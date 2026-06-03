import { RepuestoFicha } from '@/types';
import { getTemplate, recordMessage, TemplateKey } from './waTemplates';

export function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '');
  let normalized = digits;
  if (digits.startsWith('569') && digits.length === 11) {
    normalized = digits;
  } else if (digits.startsWith('56') && digits.length >= 10) {
    normalized = digits;
  } else if (digits.startsWith('9') && digits.length === 9) {
    normalized = '56' + digits;
  } else if (digits.length === 8) {
    normalized = '569' + digits;
  } else {
    normalized = digits.startsWith('56') ? digits : '56' + digits;
  }
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export function calcularTotal(repuestos: RepuestoFicha[]): number {
  return repuestos.reduce((sum, r) => {
    const precio = r.precioEditado !== undefined ? r.precioEditado : r.precio;
    return sum + precio * r.cantidad;
  }, 0);
}

export function formatPrecio(monto: number): string {
  return `$${monto.toLocaleString('es-CL')}`;
}

function applyTemplate(
  key: TemplateKey,
  vars: Record<string, string>
): string {
  let msg = getTemplate(key);
  for (const [k, v] of Object.entries(vars)) {
    msg = msg.split(k).join(v);
  }
  return msg;
}

export function mensajeEquipoListo(
  clienteNombre: string,
  modeloMaquina: string,
  numeroServicio: string,
  repuestos: RepuestoFicha[],
  fichaId = ''
): string {
  const total = calcularTotal(repuestos);
  const precioLinea = total > 0 ? `💰 *Valor total a cancelar: ${formatPrecio(total)}*\n\n` : '';
  const msg = applyTemplate('equipoListo', {
    '{cliente}': clienteNombre,
    '{modelo}': modeloMaquina,
    '{servicio}': numeroServicio,
    '{precio}': precioLinea,
  });
  recordMessage({
    tipo: 'equipoListo',
    clienteNombre,
    telefono: '',
    fichaId,
    numeroServicio,
    modelo: modeloMaquina,
    resumen: `Equipo listo${total > 0 ? ` — ${formatPrecio(total)}` : ''}`,
  });
  return msg;
}

export function mensajeRecordatorioRetiro(
  clienteNombre: string,
  modeloMaquina: string,
  numeroServicio: string,
  diasEsperando: number,
  repuestos: RepuestoFicha[],
  fichaId = ''
): string {
  const total = calcularTotal(repuestos);
  const precioLinea = total > 0 ? `💰 *Valor a cancelar: ${formatPrecio(total)}*\n\n` : '';
  const msg = applyTemplate('recordatorio', {
    '{cliente}': clienteNombre,
    '{modelo}': modeloMaquina,
    '{servicio}': numeroServicio,
    '{dias}': String(diasEsperando),
    '{precio}': precioLinea,
  });
  recordMessage({
    tipo: 'recordatorio',
    clienteNombre,
    telefono: '',
    fichaId,
    numeroServicio,
    modelo: modeloMaquina,
    resumen: `Recordatorio retiro — ${diasEsperando} días`,
  });
  return msg;
}

export function mensajeContactoRapido(clienteNombre: string, fichaId = ''): string {
  const msg = applyTemplate('contacto', { '{cliente}': clienteNombre });
  recordMessage({
    tipo: 'contacto',
    clienteNombre,
    telefono: '',
    fichaId,
    numeroServicio: '',
    modelo: '',
    resumen: 'Contacto rápido',
  });
  return msg;
}
