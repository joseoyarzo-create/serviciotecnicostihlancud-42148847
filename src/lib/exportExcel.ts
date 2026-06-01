import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

export async function exportAllToExcel() {
  const [clientesRes, repuestosRes, modelosRes, fichasRes] = await Promise.all([
    supabase.from('clientes').select('*').order('nombre'),
    supabase.from('repuestos').select('*').order('nombre'),
    supabase.from('modelos').select('*').order('nombre'),
    supabase.from('fichas').select('*').order('created_at', { ascending: false }),
  ]);

  const wb = XLSX.utils.book_new();

  const clientes = (clientesRes.data || []).map((c: any) => ({
    Nombre: c.nombre,
    Teléfono: c.telefono || '',
    Dirección: c.direccion || '',
    'Creado el': c.created_at ? new Date(c.created_at).toLocaleString('es-CL') : '',
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(clientes), 'Clientes');

  const repuestos = (repuestosRes.data || []).map((r: any) => ({
    Código: r.codigo,
    Nombre: r.nombre,
    Precio: Number(r.precio) || 0,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(repuestos), 'Repuestos');

  const modelos = (modelosRes.data || []).map((m: any) => ({
    Modelo: m.nombre,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(modelos), 'Máquinas');

  const fichas = (fichasRes.data || []).map((f: any) => {
    const repuestosArr = Array.isArray(f.repuestos) ? f.repuestos : [];
    const serviciosArr = Array.isArray(f.servicios) ? f.servicios : [];
    const totalRepuestos = repuestosArr.reduce(
      (s: number, r: any) => s + (Number(r.precioEditado ?? r.precio) || 0) * (Number(r.cantidad) || 0),
      0
    );
    return {
      'N° Boleta': f.numero_boleta,
      Estado: f.cliente_direccion === 'ENTREGADA' ? 'ENTREGADA' : 'TALLER',
      'Fecha Ingreso': f.fecha_ingreso ? new Date(f.fecha_ingreso).toLocaleString('es-CL') : '',
      'Fecha Reparación': f.fecha_reparacion ? new Date(f.fecha_reparacion).toLocaleString('es-CL') : '',
      'Fecha Entrega': f.fecha_entrega ? new Date(f.fecha_entrega).toLocaleString('es-CL') : '',
      Cliente: f.cliente_nombre,
      Teléfono: f.cliente_telefono || '',
      'Modelo Máquina': f.modelo_maquina,
      'N° Serie': f.numero_serie || '',
      Mecánico: f.mecanico,
      'Avería / Observaciones': f.observaciones || '',
      Repuestos: repuestosArr
        .map((r: any) => `${r.cantidad}x ${r.codigo || ''} ${r.nombre} ($${r.precioEditado ?? r.precio})`)
        .join(' | '),
      Servicios: serviciosArr
        .map((s: any) => {
          const tags: string[] = [];
          if (s.revision) tags.push('REV');
          if (s.reparacion) tags.push('REP');
          return `${s.nombre}${tags.length ? ` (${tags.join('/')})` : ''}`;
        })
        .filter((s: string) => s)
        .join(' | '),
      'Total Repuestos': totalRepuestos,
    };
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(fichas), 'Fichas Técnicas');

  // Detalle: una fila por repuesto usado en cada ficha
  const detalleRepuestos: any[] = [];
  (fichasRes.data || []).forEach((f: any) => {
    const arr = Array.isArray(f.repuestos) ? f.repuestos : [];
    arr.forEach((r: any) => {
      const precio = Number(r.precioEditado ?? r.precio) || 0;
      const cantidad = Number(r.cantidad) || 0;
      detalleRepuestos.push({
        'N° Boleta': f.numero_boleta,
        Cliente: f.cliente_nombre,
        'Fecha Ingreso': f.fecha_ingreso ? new Date(f.fecha_ingreso).toLocaleDateString('es-CL') : '',
        Código: r.codigo || '',
        Repuesto: r.nombre,
        Cantidad: cantidad,
        'Precio Unitario': precio,
        Subtotal: precio * cantidad,
      });
    });
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detalleRepuestos), 'Detalle Repuestos');

  const fecha = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `stihl-ancud-export-${fecha}.xlsx`);
}
