export type TemplateKey = 'equipoListo' | 'recordatorio' | 'contacto';

const STORAGE_KEYS: Record<TemplateKey, string> = {
  equipoListo: 'wa_tmpl_equipo_listo',
  recordatorio: 'wa_tmpl_recordatorio',
  contacto: 'wa_tmpl_contacto',
};

const HISTORY_KEY = 'wa_msg_history';

export const DEFAULT_TEMPLATES: Record<TemplateKey, string> = {
  equipoListo:
    'Estimado/a {cliente}, le informamos que su equipo *{modelo}* ' +
    '(Servicio N° {servicio}) se encuentra *listo para retirar* en nuestro taller.\n\n' +
    '{precio}' +
    '📍 Pudeto 351, Ancud\n📞 +56 65 2622214\n\n' +
    'Horario de atención:\n' +
    'Lunes a Viernes: 09:00 - 13:00 | 14:30 - 18:30 hrs.\n' +
    'Sábado: 09:00 - 13:00 hrs.\n\n' +
    'Recuerde que la reparación cuenta con garantía de 20 días desde la fecha de retiro.\n\n' +
    'STIHL ANCUD - Comercial Sotavento Ltda.',

  recordatorio:
    'Estimado/a {cliente}, le recordamos que su equipo *{modelo}* ' +
    '(Servicio N° {servicio}) lleva *{dias} días listo* esperando ser retirado de nuestro taller.\n\n' +
    '{precio}' +
    '📍 Pudeto 351, Ancud\n📞 +56 65 2622214\n\n' +
    'Horario de atención:\n' +
    'Lunes a Viernes: 09:00 - 13:00 | 14:30 - 18:30 hrs.\n' +
    'Sábado: 09:00 - 13:00 hrs.\n\n' +
    'STIHL ANCUD - Comercial Sotavento Ltda.',

  contacto: 'Hola {cliente}, le contactamos desde STIHL ANCUD - Servicio Técnico. ',
};

export function getTemplate(key: TemplateKey): string {
  try {
    return localStorage.getItem(STORAGE_KEYS[key]) ?? DEFAULT_TEMPLATES[key];
  } catch {
    return DEFAULT_TEMPLATES[key];
  }
}

export function saveTemplate(key: TemplateKey, value: string): void {
  localStorage.setItem(STORAGE_KEYS[key], value);
}

export function resetTemplate(key: TemplateKey): void {
  localStorage.removeItem(STORAGE_KEYS[key]);
}

export interface MensajeEnviado {
  id: string;
  tipo: TemplateKey;
  clienteNombre: string;
  telefono: string;
  fichaId: string;
  numeroServicio: string;
  modelo: string;
  fechaEnvio: string;
  resumen: string;
}

export function getMessageHistory(): MensajeEnviado[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as MensajeEnviado[]) : [];
  } catch {
    return [];
  }
}

export function recordMessage(entry: Omit<MensajeEnviado, 'id' | 'fechaEnvio'>): void {
  try {
    const history = getMessageHistory();
    const newEntry: MensajeEnviado = {
      ...entry,
      id: crypto.randomUUID(),
      fechaEnvio: new Date().toISOString(),
    };
    const updated = [newEntry, ...history].slice(0, 200);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // silently fail
  }
}

export function clearMessageHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

export const TEMPLATE_VARIABLES: Record<TemplateKey, { key: string; desc: string }[]> = {
  equipoListo: [
    { key: '{cliente}', desc: 'Nombre del cliente' },
    { key: '{modelo}', desc: 'Modelo del equipo' },
    { key: '{servicio}', desc: 'N° de servicio' },
    { key: '{precio}', desc: 'Línea con precio total (vacío si sin precio)' },
  ],
  recordatorio: [
    { key: '{cliente}', desc: 'Nombre del cliente' },
    { key: '{modelo}', desc: 'Modelo del equipo' },
    { key: '{servicio}', desc: 'N° de servicio' },
    { key: '{dias}', desc: 'Días que lleva en taller' },
    { key: '{precio}', desc: 'Línea con precio total (vacío si sin precio)' },
  ],
  contacto: [
    { key: '{cliente}', desc: 'Nombre del cliente' },
  ],
};
