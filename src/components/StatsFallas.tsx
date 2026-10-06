import { useMemo, useState } from 'react';
import { FichaTecnica } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Wrench, Package } from 'lucide-react';
import { startOfMonth, startOfYear, subMonths } from 'date-fns';

type Periodo = 'mes' | '3m' | 'anio' | 'todo';
const PERIODOS: { value: Periodo; label: string }[] = [
  { value: 'mes', label: 'Este mes' },
  { value: '3m', label: 'Últimos 3 meses' },
  { value: 'anio', label: 'Este año' },
  { value: 'todo', label: 'Todo el historial' },
];

// Categorías detectadas a partir del texto libre de "Tipo de avería" (se pueden repetir varias por ficha)
const CATEGORIAS: { nombre: string; patrones: RegExp[] }[] = [
  { nombre: 'No parte / cuesta partir', patrones: [/NO PARTE/, /NO ANDA/, /CUESTA (PARA HACER )?PARTIR/, /PESADA PARTIR/, /NO ARRANCA/] },
  { nombre: 'Se ahoga', patrones: [/AHOGA/] },
  { nombre: 'Se para / se apaga', patrones: [/SE PARA/, /SE APAGA/, /SE CHUPA/, /SE DETIENE/] },
  { nombre: 'Pierde fuerza', patrones: [/FUERZA/, /FUEZA/, /COMPRESION/] },
  { nombre: 'Problema de carburación', patrones: [/CARBURA/, /ACELERAD/, /DISPAREJO/] },
  { nombre: 'Lubricación / no aceita', patrones: [/ACEITA/, /BOMBA (DE )?ACEITE/, /PIERDE ACEITE/] },
  { nombre: 'Cadena / espada', patrones: [/CADENA/, /ESPADA/, /RECTIFIC/, /TENSOR/] },
  { nombre: 'Arranque / piola', patrones: [/ARRANQUE/, /PIOLA/, /TRINQUETE/, /CUERDA/] },
  { nombre: 'Embrague', patrones: [/EMBR?EA?GUE/, /EMBRIAGUE/, /TAMBOR/] },
  { nombre: 'Cabezal / cuchilla', patrones: [/CABEZAL/, /CUCHILL/, /VARILLA/] },
  { nombre: 'Bujía', patrones: [/BUJIA/, /BUJÍA/] },
  { nombre: 'Ruido extraño', patrones: [/RUIDO/, /SONIDO/] },
  { nombre: 'Combustible malo / agua', patrones: [/BENCINA/, /PARAFINA/, /CON AGUA/] },
  { nombre: 'Mantención', patrones: [/MANTEN/, /REVISAR COMPLETA/, /REVISION COMPLETA/, /LIMPIEZA/, /ENGRAS/] },
];
const OTROS = 'Otros';
const SIN_DATO = 'Sin avería registrada';

const normalizar = (t: string) =>
  t.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export function clasificarAveria(tipoAveria: string): string[] {
  const texto = normalizar((tipoAveria || '').split(/Comentarios:/i)[0]).trim();
  if (!texto) return [SIN_DATO];
  const cats = CATEGORIAS.filter(c => c.patrones.some(p => p.test(texto))).map(c => c.nombre);
  return cats.length ? cats : [OTROS];
}

const desde = (p: Periodo): Date | null => {
  const now = new Date();
  if (p === 'mes') return startOfMonth(now);
  if (p === '3m') return startOfMonth(subMonths(now, 2));
  if (p === 'anio') return startOfYear(now);
  return null;
};

const filtrar = (fichas: FichaTecnica[], p: Periodo) => {
  const d = desde(p);
  return d ? fichas.filter(f => new Date(f.fechaIngreso) >= d) : fichas;
};

const contarProblemas = (fichas: FichaTecnica[]) => {
  const m = new Map<string, number>();
  fichas.forEach(f => clasificarAveria(f.tipoAveria).forEach(c => m.set(c, (m.get(c) || 0) + 1)));
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};

const PeriodoSelect = ({ value, onChange }: { value: Periodo; onChange: (p: Periodo) => void }) => (
  <Select value={value} onValueChange={(v) => onChange(v as Periodo)}>
    <SelectTrigger className="w-44 h-8"><SelectValue /></SelectTrigger>
    <SelectContent>
      {PERIODOS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
    </SelectContent>
  </Select>
);

const Barras = ({ items, unidad }: { items: [string, number][]; unidad: string }) => {
  const max = items[0]?.[1] || 1;
  if (!items.length) return <p className="text-sm text-muted-foreground">Sin datos en este período.</p>;
  return (
    <div className="space-y-2">
      {items.map(([nombre, n]) => (
        <div key={nombre}>
          <div className="flex justify-between text-sm">
            <span className="font-medium">{nombre}</span>
            <span className="text-muted-foreground">{n} {unidad}</span>
          </div>
          <div className="h-2 rounded bg-muted">
            <div className="h-2 rounded bg-primary" style={{ width: `${(n / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
};

const StatsFallas = ({ fichas }: { fichas: FichaTecnica[] }) => {
  const [pFallas, setPFallas] = useState<Periodo>('todo');
  const [pModelo, setPModelo] = useState<Periodo>('todo');
  const [pRep, setPRep] = useState<Periodo>('todo');

  const problemas = useMemo(() => contarProblemas(filtrar(fichas, pFallas)), [fichas, pFallas]);

  const modelos = useMemo(() => {
    const m = new Map<string, number>();
    fichas.forEach(f => {
      const k = (f.modeloMaquina || '').trim().toUpperCase();
      if (k) m.set(k, (m.get(k) || 0) + 1);
    });
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);
  }, [fichas]);
  const [modelo, setModelo] = useState<string>('');
  const modeloSel = modelo || modelos[0] || '';
  const fichasModelo = useMemo(
    () => filtrar(fichas, pModelo).filter(f => (f.modeloMaquina || '').trim().toUpperCase() === modeloSel),
    [fichas, pModelo, modeloSel]
  );
  const problemasModelo = useMemo(() => contarProblemas(fichasModelo), [fichasModelo]);

  // Solo repuestos registrados en la ficha (realmente utilizados); los marcados como "necesita cambio" no cambiados no están aquí
  const repuestos = useMemo(() => {
    const m = new Map<string, { nombre: string; codigo: string; veces: number; unidades: number }>();
    filtrar(fichas, pRep).forEach(f =>
      (f.repuestos || []).forEach(r => {
        const key = (r.codigo || r.nombre || '').trim().toUpperCase();
        if (!key) return;
        const e = m.get(key) || { nombre: r.nombre, codigo: r.codigo, veces: 0, unidades: 0 };
        e.veces += 1;
        e.unidades += Number(r.cantidad) || 0;
        m.set(key, e);
      })
    );
    return [...m.values()].sort((a, b) => b.unidades - a.unidades).slice(0, 20);
  }, [fichas, pRep]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-primary" />Problemas más frecuentes</CardTitle>
          <PeriodoSelect value={pFallas} onChange={setPFallas} />
        </CardHeader>
        <CardContent>
          <Barras items={problemas} unidad="fichas" />
          <p className="text-xs text-muted-foreground mt-3">Según el "Tipo de avería" escrito en cada ficha. Una ficha puede contar en más de un problema.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5 text-primary" />Problemas por modelo</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Select value={modeloSel} onValueChange={setModelo}>
              <SelectTrigger className="w-56 h-8"><SelectValue placeholder="Elegir modelo" /></SelectTrigger>
              <SelectContent>
                {modelos.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <PeriodoSelect value={pModelo} onChange={setPModelo} />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-3">Servicios realizados: <span className="font-bold">{fichasModelo.length}</span></p>
          <Barras items={problemasModelo} unidad="veces" />
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-primary" />Repuestos más utilizados</CardTitle>
          <PeriodoSelect value={pRep} onChange={setPRep} />
        </CardHeader>
        <CardContent>
          {repuestos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin datos en este período.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="stihl-table">
                <thead>
                  <tr><th>#</th><th>Repuesto</th><th>Código</th><th className="text-center">Veces utilizado</th><th className="text-center">Unidades</th></tr>
                </thead>
                <tbody>
                  {repuestos.map((r, i) => (
                    <tr key={r.codigo + r.nombre}>
                      <td>{i + 1}</td><td className="font-medium">{r.nombre}</td><td>{r.codigo || '—'}</td>
                      <td className="text-center">{r.veces}</td><td className="text-center font-bold">{r.unidades}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsFallas;
