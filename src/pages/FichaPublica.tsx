import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import stihlLogo from '@/assets/stihl-logo.jpg';

type Row = {
  numero_boleta: string; fecha_ingreso: string; fecha_reparacion: string | null; fecha_entrega: string | null;
  cliente_nombre: string; modelo_maquina: string; numero_serie: string | null; mecanico: string;
  repuestos: any; servicios: any; observaciones: string | null;
};

const fmt = (d?: string | null) => (d ? format(new Date(d), 'dd/MM/yyyy', { locale: es }) : '—');
const money = (n: number) => '$' + Math.round(n).toLocaleString('es-CL');

const FichaPublica = () => {
  const { token } = useParams();
  const [ficha, setFicha] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Ficha Técnica - Servicio Técnico STIHL';
    (async () => {
      const { data } = await supabase.rpc('get_ficha_publica' as never, { _token: token } as never);
      const rows = data as unknown as Row[] | null;
      setFicha(rows && rows.length ? rows[0] : null);
      setLoading(false);
    })();
  }, [token]);

  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Cargando ficha...</div>;
  if (!ficha) return <div className="flex min-h-screen items-center justify-center p-6 text-center text-muted-foreground">Ficha no encontrada. Revise el enlace.</div>;

  const repuestos: any[] = Array.isArray(ficha.repuestos) ? ficha.repuestos : [];
  const servicios: any[] = (Array.isArray(ficha.servicios) ? ficha.servicios : []).filter((s) => s.reparacion);
  const total = repuestos.reduce((s, r) => s + (Number(r.precioEditado ?? r.precio) || 0) * (Number(r.cantidad) || 1), 0);

  return (
    <div className="min-h-screen bg-muted/30 px-3 py-6">
      <div className="mx-auto max-w-2xl space-y-5 rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-4 border-b pb-4">
          <img src={stihlLogo} alt="STIHL" className="h-14 w-auto" />
          <div>
            <h1 className="text-xl font-bold">Ficha Técnica N° {ficha.numero_boleta}</h1>
            <p className="text-sm text-muted-foreground">Servicio Técnico STIHL Ancud</p>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Cliente</dt><dd className="font-medium">{ficha.cliente_nombre}</dd>
          <dt className="text-muted-foreground">Máquina</dt><dd className="font-medium">{ficha.modelo_maquina}</dd>
          <dt className="text-muted-foreground">N° de serie</dt><dd>{ficha.numero_serie || '—'}</dd>
          <dt className="text-muted-foreground">Fecha ingreso</dt><dd>{fmt(ficha.fecha_ingreso)}</dd>
          <dt className="text-muted-foreground">Fecha reparación</dt><dd>{fmt(ficha.fecha_reparacion)}</dd>
          <dt className="text-muted-foreground">Fecha entrega</dt><dd>{fmt(ficha.fecha_entrega)}</dd>
          <dt className="text-muted-foreground">Técnico</dt><dd>{ficha.mecanico}</dd>
        </dl>

        {ficha.observaciones && (
          <section>
            <h2 className="mb-1 font-semibold">Tipo de avería</h2>
            <p className="text-sm">{ficha.observaciones}</p>
          </section>
        )}

        {servicios.length > 0 && (
          <section>
            <h2 className="mb-1 font-semibold">Reparaciones / cambios realizados</h2>
            <ul className="list-disc pl-5 text-sm">{servicios.map((s, i) => <li key={i}>{s.nombre}</li>)}</ul>
          </section>
        )}

        <section>
          <h2 className="mb-2 font-semibold">Repuestos utilizados</h2>
          {repuestos.length === 0 ? <p className="text-sm text-muted-foreground">Sin repuestos.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left"><th className="py-1">Cant.</th><th>Código</th><th>Nombre</th><th className="text-right">Precio</th></tr></thead>
                <tbody>
                  {repuestos.map((r, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-1">{r.cantidad}</td><td>{r.codigo}</td><td>{r.nombre}</td>
                      <td className="text-right">{money((Number(r.precioEditado ?? r.precio) || 0) * (Number(r.cantidad) || 1))}</td>
                    </tr>
                  ))}
                  <tr><td colSpan={3} className="py-2 text-right font-bold">TOTAL REPUESTOS</td><td className="text-right font-bold">{money(total)}</td></tr>
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="border-t pt-3 text-center text-xs text-muted-foreground">REPARACIÓN GARANTIZADA POR 20 DÍAS DE LA FECHA DE RETIRO</p>
      </div>
    </div>
  );
};

export default FichaPublica;
