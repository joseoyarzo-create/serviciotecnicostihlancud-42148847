import type { Recepcion } from './recepciones';
import type { FichaTecnica } from '@/types';
import sotaventoLogo from '@/assets/sotavento-logo.asset.json';

const escape = (value: string) => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c));
export function boletaHtml(r: Recepcion, f: FichaTecnica, papel: '80' | '58' = '80') {
  const field = (label: string, value: string) => `<p class="field"><b>${label}:</b> ${escape(value || '—')}</p>`;
  const assetOrigin = window.location.hostname === 'localhost' ? 'https://serviciotecnicostihlancud.lovable.app' : window.location.origin;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Recepción ${escape(r.numero)}</title><style>
  :root { --paper: #fff; --ink: #000; }
  @page { size: ${papel}mm auto; margin: 0; }
  *{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:12px Arial,sans-serif}
  .receipt{width:${papel === '80' ? '72' : '48'}mm;margin:0 auto;padding:3mm 0 5mm;overflow-wrap:anywhere}
  header{text-align:center;border-bottom:1px solid var(--ink);padding-bottom:2mm}img{width:26mm;max-height:10mm;object-fit:contain;filter:grayscale(1) contrast(2)}
  h1{font-size:17px;margin:3mm 0 1mm}h2{font-size:15px;margin:3mm 0}p{margin:1.5mm 0;line-height:1.3}.contact{font-size:10px}
  .number{font-size:23px;font-weight:bold;text-align:center;margin:2mm 0}.legend{text-align:center;font-weight:bold;font-size:11px}
  .accessories{display:flex;justify-content:space-between;gap:1mm;font-size:11px;border-bottom:1px solid var(--ink);padding-bottom:2mm}
  .section{border-top:1px solid var(--ink);margin-top:3mm;padding-top:2mm;white-space:pre-wrap}.conditions{font-size:10px;line-height:1.35;border-top:1px solid var(--ink);margin-top:3mm;padding-top:2mm}
  footer{text-align:center;border-top:2px solid var(--ink);margin-top:3mm;padding-top:2mm;font-size:11px;font-weight:bold}
  </style></head><body><article class="receipt"><header><img src="${new URL(sotaventoLogo.url, assetOrigin).href}" alt="Sotavento"><p><b>COMERCIAL SOTAVENTO LTDA.</b></p><p>Distribuidor Oficial STIHL</p><div class="contact">Pudeto 351 - Ancud<br>Aviador Barrientos s/n - Achao<br>sotaventoancud@gmail.com<br>sotaventoachao@gmail.com<br>+56 65 2622214 · +56 9 9773 7088</div></header>
  <h1>Cartola Reparación</h1><div class="number">Nº ${escape(r.numero)}</div><p class="legend">BOLETA GENERADA POR SISTEMA</p>
  <p class="accessories"><span>Cadena: ${r.cadena ? 'SÍ' : 'NO'}</span><span>Espada: ${r.espada ? 'SÍ' : 'NO'}</span><span>Funda: ${r.funda ? 'SÍ' : 'NO'}</span></p>
  ${field('Motor Nº', f.numeroSerie)}${field('Modelo', f.modeloMaquina)}${field('Nombre', f.cliente.nombre)}${field('Fecha', f.fechaIngreso.toLocaleDateString('es-CL'))}${field('F. entrega estimada', r.fecha_estimada ? r.fecha_estimada.split('-').reverse().join('/') : '')}
  <div class="section"><b>Motivo de ingreso</b><p>${escape(r.motivo_ingreso || f.tipoAveria)}</p></div>${r.observaciones ? `<div class="section"><b>Observaciones</b><p>${escape(r.observaciones)}</p></div>` : ''}${field('Teléfono', f.cliente.telefono)}
  <div class="conditions"><b>IMPORTANTE: Art. 42 LEY DE COMERCIO</b><p>• Las Máquinas no retiradas dentro de los siguientes 60 días será, enviadas a Bodega y la Empresa no se responsabiliza por deterioros producidos.</p><p>• Las Máquinas no retiradas dentro de 1 año según el artículo 42 de la ley de comercio será considerado como abandonada por sus propietarios, por lo que la Empresa podrá disponer de ella.</p><p>• El valor del presupuesto, debe sufrir modificaciones, si durante el proceso de reparación se detectan desperfectos no advertidos en el diagnóstico original que impliquen gastos adicionales. Esta variación en el caso de reparación será informada al cliente antes de continuar con la reparación del equipo.</p><p>• Este presupuesto tiene una vigencia de 10 días desde la fecha de emisión.</p><p><b>• EL PRESUPUESTO RECHAZADO TENDRÁ UN COSTO DE INSPECCIÓN.</b></p></div>
  <footer><u>COMPROBANTE OBLIGATORIO PARA RETIRO</u><p>BODEGAJE DESPUÉS DE 15 DÍAS SE APLICARÁ $500 P/DÍA</p><p>RETIRO: PUDETO 351 - ANCUD<br>FONO: 652622214</p><p>HORARIO: LUNES A VIERNES<br>9:00 A 13:00 Y 14:30 A 19:00<br>SÁBADO 9:30 A 13:00</p></footer></article></body></html>`;
}
export function imprimirBoleta(html: string) {
  const w = window.open('', '_blank', 'width=440,height=800');
  if (!w) throw new Error('Permite las ventanas emergentes para imprimir. La recepción sigue guardada.');
  w.document.open(); w.document.write(html); w.document.close();
  Promise.all(Array.from(w.document.images).map(img => img.complete ? Promise.resolve() : new Promise(resolve => { img.onload = resolve; img.onerror = resolve; }))).then(() => {
    w.focus(); w.print();
  });
}