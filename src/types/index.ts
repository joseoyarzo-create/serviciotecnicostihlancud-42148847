export interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  puntos?: number;
}

export interface Repuesto {
  id: string;
  codigo: string;
  nombre: string;
  precio: number;
}

export interface RepuestoFicha extends Repuesto {
  cantidad: number;
  precioEditado?: number;
}

export interface ModeloMaquina {
  id: string;
  modelo: string;
}

export interface ServicioItem {
  nombre: string;
  revision: boolean;
  reparacion: boolean;
  necesitaCambio?: boolean;
  motivoNoCambio?: string;
  motivoOtro?: string;
}

export const MOTIVOS_NO_CAMBIO = [
  'Cliente no autorizó',
  'No había repuesto disponible',
  'Repuesto encargado',
  'Cliente retiró la máquina',
  'Se recomienda para próximo servicio',
  'Otro',
] as const;

export function motivoTexto(s: ServicioItem): string {
  if (!s.motivoNoCambio) return 'Sin motivo indicado';
  if (s.motivoNoCambio === 'Otro') return s.motivoOtro?.trim() || 'Otro';
  return s.motivoNoCambio;
}

export function serviciosPendientes(servicios: ServicioItem[]): ServicioItem[] {
  return (servicios || []).filter(s => s.necesitaCambio && !s.reparacion);
}

export type EstadoFicha = 'TALLER' | 'ESPERA_REPUESTO' | 'LISTO' | 'ENTREGADA';

export const ESTADOS_FICHA: { value: EstadoFicha; label: string; color: string }[] = [
  { value: 'TALLER',          label: 'En Taller',           color: 'bg-blue-100 text-blue-800' },
  { value: 'ESPERA_REPUESTO', label: 'Espera Repuesto',     color: 'bg-amber-100 text-amber-800' },
  { value: 'LISTO',           label: 'Listo para Retirar',  color: 'bg-green-100 text-green-800' },
  { value: 'ENTREGADA',       label: 'Entregada',           color: 'bg-slate-100 text-slate-700' },
];

export function estadoColor(estado: EstadoFicha): string {
  return ESTADOS_FICHA.find(e => e.value === estado)?.color ?? 'bg-gray-100 text-gray-700';
}

export function estadoLabel(estado: EstadoFicha): string {
  return ESTADOS_FICHA.find(e => e.value === estado)?.label ?? estado;
}

export interface FichaTecnica {
  id: string;
  numeroBoleta: string;
  numeroServicio: string;
  fechaIngreso: Date;
  fechaReparacion: Date | null;
  cliente: Cliente;
  modeloMaquina: string;
  numeroSerie: string;
  tipoAveria: string;
  repuestos: RepuestoFicha[];
  servicios: ServicioItem[];
  recomendaciones: string;
  tecnico: 'JORGE' | 'JEAN';
  fechaEntrega: Date | null;
  estado: EstadoFicha;
  publicToken?: string;
}

export type Tecnico = 'JORGE' | 'JEAN';
