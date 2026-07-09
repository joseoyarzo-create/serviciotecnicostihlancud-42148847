import { RepuestoFicha } from '@/types';
import { getTemplate, recordMessage, TemplateKey } from './waTemplates';

export function normalizeWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('569') && digits.length === 11) return digits;
  if (digits.startsWith('56') && digits.length >= 10) return digits;
  if (digits.startsWith('9') && digits.length === 9) return '56' + digits;
  if (digits.length === 8) return '569' + digits;
  return digits.startsWith('56') ? digits : '56' + digits;
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const normalized = normalizeWhatsAppPhone(phone);
  const text = encodeURIComponent(message);
  // Detectar móvil vs escritorio: wa.me suele redirigir a api.whatsapp.com
  // (que en algunas redes está bloqueado). En escritorio usamos web.whatsapp.com.
  const isMobile =
    typeof navigator !== 'undefined' &&
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  if (isMobile) {
    return `whatsapp://send?phone=${normalized}&text=${text}`;
  }
  return `https://web.whatsapp.com/send?phone=${normalized}&text=${text}&type=phone_number&app_absent=0`;
}

export function buildWhatsAppFallbackUrls(phone: string, message: string): string[] {
  const normalized = normalizeWhatsAppPhone(phone);
  const text = encodeURIComponent(message);
  return [
    `https://web.whatsapp.com/send?phone=${normalized}&text=${text}`,
    `https://wa.me/${normalized}?text=${text}`,
    `whatsapp://send?phone=${normalized}&text=${text}`,
  ];
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
