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
  estado: 'TALLER' | 'ENTREGADA';
}

export type Tecnico = 'JORGE' | 'JEAN';
export type EstadoFicha = 'TALLER' | 'ENTREGADA';
