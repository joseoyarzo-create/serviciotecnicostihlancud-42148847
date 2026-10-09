import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { getClientes, getModelos, getFichaById } from '@/lib/cloudStorage';
import { crearRecepcion, listarRecepciones, Recepcion, RecepcionDatos } from '@/lib/recepciones';
import { boletaHtml, imprimirBoleta } from '@/lib/boletaRecepcion';
import type { Cliente } from '@/types';
import { Plus, Printer, FileText, Wrench, Eye } from 'lucide-react';

const empty = (): RecepcionDatos => ({ nombre: '', telefono: '', modelo: '', serie: '', motivo: '', observaciones: '', cadena: false, espada: false, funda: false, fecha: new Date().toISOString(), fechaEstimada: null });
export default function RecepcionesPage() {
  const { toast } = useToast();
  const [datos, setDatos] = useState(empty);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [modelos, setModelos] = useState<string[]>([]);
  const [recepciones, setRecepciones] = useState<Recepcion[]>([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [guardada, setGuardada] = useState<Recepcion | null>(null);
  const [preview, setPreview] = useState<{ html: string; numero: string } | null>(null);
  const [papel, setPapel] = useState<'80' | '58'>('80');
  const solicitud = useRef(crypto.randomUUID());
  const lock = useRef(false);
  useEffect(() => {
    Promise.all([getClientes(), getModelos(), listarRecepciones()]).then(([c, m, r]) => {
      setClientes(c); setModelos(m.map(x => x.modelo)); setRecepciones(r);
    }).catch(() => setError('No se pudieron cargar las recepciones.')).finally(() => setLoading(false));
  }, []);
  const set = <K extends keyof RecepcionDatos>(key: K, value: RecepcionDatos[K]) => setDatos(d => ({ ...d, [key]: value }));
  const guardar = async () => {
    if (lock.current || guardada) return;
    lock.current = true; setSaving(true); setError('');
    try {
      const r = await crearRecepcion(solicitud.current, datos);
      setGuardada(r); setRecepciones(old => [r, ...old.filter(x => x.id !== r.id)]);
      toast({ title: 'Recepción registrada', description: `${r.numero}: ficha técnica inicial creada.` });
    } catch (e) {
      setError(e instanceof z.ZodError ? e.issues[0]?.message ?? 'Revise los datos' : 'No se pudo guardar. Puede reintentar sin duplicar la recepción.');
    } finally { lock.current = false; setSaving(false); }
  };
  const ver = async (r: Recepcion) => {
    try {
      const ficha = await getFichaById(r.ficha_id);
      if (!ficha) throw new Error('Ficha no encontrada');
      setPreview({ html: boletaHtml(r, ficha, papel), numero: r.numero });
    } catch { toast({ title: 'Error', description: 'No se pudo abrir la boleta. Sigue guardada para reimprimir.', variant: 'destructive' }); }
  };
  return <div className="min-h-screen bg-background"><Header /><main className="container mx-auto py-8 px-4">
    <div className="flex flex-wrap items-center justify-between gap-4 mb-8"><h1 className="text-3xl font-heading font-bold">Nueva recepción digital</h1><Button variant="outline" asChild><Link to="/ingresar-maquina-reparada"><Wrench className="mr-2 h-4 w-4" />Ingresar máquina reparada</Link></Button></div>
    {guardada ? <section className="border border-primary p-6 mb-8 space-y-4"><h2 className="text-xl font-bold">Recepción {guardada.numero} registrada</h2><div className="flex flex-wrap gap-3"><Button onClick={() => ver(guardada)}><Printer className="mr-2 h-4 w-4" />Ver e imprimir boleta</Button><Button variant="outline" asChild><Link to={`/ficha-tecnica/${guardada.ficha_id}`}><FileText className="mr-2 h-4 w-4" />Completar ficha técnica</Link></Button><Button variant="outline" onClick={() => { setGuardada(null); setDatos(empty()); solicitud.current = crypto.randomUUID(); }}><Plus className="mr-2 h-4 w-4" />Nueva recepción digital</Button></div></section> :
    <form onSubmit={e => { e.preventDefault(); guardar(); }} className="space-y-6 mb-10">
      <fieldset disabled={saving} className="space-y-6">
        <section className="border-b border-border pb-6"><h2 className="form-section-title">Cliente y máquina</h2><div className="grid md:grid-cols-2 gap-4">
          <div className="input-group"><Label htmlFor="recepcion-nombre">Nombre del cliente *</Label><Input id="recepcion-nombre" required maxLength={100} list="recepcion-clientes" value={datos.nombre} onChange={e => { const nombre = e.target.value.toUpperCase(); const c = clientes.find(c => c.nombre.trim().toUpperCase() === nombre.trim()); setDatos(d => ({ ...d, nombre, telefono: c?.telefono ?? d.telefono })); }} /><datalist id="recepcion-clientes">{clientes.map(c => <option key={c.id} value={c.nombre} />)}</datalist></div>
          <div className="input-group"><Label htmlFor="recepcion-telefono">Teléfono</Label><Input id="recepcion-telefono" maxLength={40} value={datos.telefono} onChange={e => set('telefono', e.target.value)} /></div>
          <div className="input-group"><Label htmlFor="recepcion-modelo">Modelo *</Label><Input id="recepcion-modelo" required maxLength={100} list="recepcion-modelos" value={datos.modelo} onChange={e => set('modelo', e.target.value)} /><datalist id="recepcion-modelos">{modelos.map(m => <option key={m} value={m} />)}</datalist></div>
          <div className="input-group"><Label htmlFor="recepcion-serie">Motor Nº / número de serie</Label><Input id="recepcion-serie" maxLength={100} value={datos.serie} onChange={e => set('serie', e.target.value)} /></div>
          <div className="input-group"><Label htmlFor="recepcion-fecha">Fecha de recepción *</Label><Input id="recepcion-fecha" type="date" required value={datos.fecha.slice(0,10)} onChange={e => { if (e.target.value) set('fecha', new Date(`${e.target.value}T12:00:00`).toISOString()); }} /></div>
          <div className="input-group"><Label htmlFor="recepcion-entrega">Fecha estimada de entrega</Label><Input id="recepcion-entrega" type="date" value={datos.fechaEstimada ?? ''} onChange={e => set('fechaEstimada', e.target.value || null)} /></div>
        </div></section>
        <section className="border-b border-border pb-6"><h2 className="form-section-title">Accesorios recibidos</h2><div className="flex flex-wrap gap-6">{(['cadena','espada','funda'] as const).map(k => <div key={k} className="flex items-center gap-2"><Checkbox id={`recepcion-${k}`} checked={datos[k]} onCheckedChange={v => set(k, v === true)} /><Label htmlFor={`recepcion-${k}`} className="capitalize">{k}</Label></div>)}</div></section>
        <section className="grid md:grid-cols-2 gap-4"><div className="input-group"><Label htmlFor="recepcion-motivo">Motivo de ingreso *</Label><Textarea id="recepcion-motivo" required maxLength={2000} value={datos.motivo} onChange={e => set('motivo', e.target.value)} /></div><div className="input-group"><Label htmlFor="recepcion-observaciones">Observaciones</Label><Textarea id="recepcion-observaciones" maxLength={2000} value={datos.observaciones} onChange={e => set('observaciones', e.target.value)} /></div></section>
      </fieldset>
      {error && <p role="alert" className="text-destructive">{error}</p>}
      <Button type="submit" disabled={saving}><Plus className="mr-2 h-4 w-4" />{saving ? 'Guardando...' : 'Guardar recepción'}</Button>
    </form>}
    <section><div className="flex flex-wrap justify-between items-center gap-4 mb-4"><h2 className="text-xl font-bold">Recepciones digitales</h2><div className="flex gap-3"><Input aria-label="Buscar recepción" placeholder="Buscar Nº de boleta" value={search} onChange={e => setSearch(e.target.value)} /><Select value={papel} onValueChange={v => setPapel(v as '80' | '58')}><SelectTrigger className="w-32" aria-label="Ancho de papel"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="80">Papel 80 mm</SelectItem><SelectItem value="58">Papel 58 mm</SelectItem></SelectContent></Select></div></div>
      {loading ? <p>Cargando recepciones...</p> : !recepciones.length ? <p className="text-muted-foreground">Sin recepciones digitales registradas.</p> : <div className="divide-y divide-border">{recepciones.filter(r => r.numero.toLowerCase().includes(search.toLowerCase())).map(r => <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-bold">{r.numero}</p><p className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleString('es-CL')}</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => ver(r)}><Eye className="mr-2 h-4 w-4" />Ver / reimprimir</Button><Button variant="outline" asChild><Link to={`/ficha-tecnica/${r.ficha_id}`}>Ficha técnica</Link></Button></div></div>)}</div>}
    </section>
    <Dialog open={!!preview} onOpenChange={open => { if (!open) setPreview(null); }}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Boleta {preview?.numero}</DialogTitle></DialogHeader><iframe title="Vista previa de boleta" srcDoc={preview?.html} className="w-full h-[60vh] border border-border" sandbox="allow-same-origin" /><Button onClick={() => { if (!preview) return; try { imprimirBoleta(preview.html); } catch(e) { toast({ title: 'No se pudo imprimir', description: e instanceof Error ? e.message : 'La recepción sigue guardada.', variant: 'destructive' }); } }}><Printer className="mr-2 h-4 w-4" />Imprimir boleta</Button></DialogContent></Dialog>
  </main></div>;
}