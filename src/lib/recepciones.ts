import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Recepcion = Tables<'recepciones'>;
export const recepcionSchema = z.object({
  nombre: z.string().trim().min(1, 'Ingrese el nombre del cliente').max(100).transform(s => s.toUpperCase()),
  telefono: z.string().trim().max(40),
  modelo: z.string().trim().min(1, 'Ingrese el modelo').max(100),
  serie: z.string().trim().max(100),
  motivo: z.string().trim().min(1, 'Ingrese el motivo de ingreso').max(2000),
  observaciones: z.string().trim().max(2000),
  cadena: z.boolean(), espada: z.boolean(), funda: z.boolean(),
  fecha: z.string().datetime(),
  fechaEstimada: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
});
export type RecepcionDatos = z.input<typeof recepcionSchema>;
export async function crearRecepcion(solicitud: string, datos: RecepcionDatos) {
  const d = recepcionSchema.parse(datos);
  const { data, error } = await supabase.rpc('crear_recepcion_digital', {
    _solicitud: z.string().uuid().parse(solicitud), _nombre: d.nombre, _telefono: d.telefono,
    _modelo: d.modelo, _serie: d.serie, _motivo: d.motivo, _observaciones: d.observaciones,
    _cadena: d.cadena, _espada: d.espada, _funda: d.funda, _fecha: d.fecha,
    _fecha_estimada: d.fechaEstimada,
  });
  if (error) throw error;
  return data;
}
export async function listarRecepciones() {
  const all: Recepcion[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from('recepciones').select('*').order('created_at', { ascending: false }).range(from, from + 999);
    if (error) throw error;
    all.push(...data);
    if (data.length < 1000) return all;
  }
}