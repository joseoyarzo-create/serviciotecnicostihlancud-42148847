import { FichaTecnica } from '@/types';
import { format } from 'date-fns';

/**
 * Imprime una etiqueta térmica 80mm para Epson TM-T20II.
 * Datos clave: N° boleta, cliente, teléfono, modelo, n° serie, fecha,
 * técnico, estado y código de barras (Code128 vía CSS font fallback texto grande).
 */
export function printThermalLabel(ficha: FichaTecnica): void {
  const w = window.open('', '_blank', 'width=400,height=600');
  if (!w) return;

  const fecha = format(ficha.fechaIngreso, 'dd/MM/yyyy HH:mm');
  const tel = (ficha.cliente.telefono || '').trim();
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Etiqueta ${ficha.numeroBoleta}</title>
<style>
  @page { size: 80mm auto; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; color: #000;
    font-family: 'Arial Narrow', Arial, sans-serif; }
  .label { width: 80mm; padding: 3mm 3mm 5mm 3mm; }
  .center { text-align: center; }
  .title { font-weight: 900; font-size: 14pt; letter-spacing: 1px; }
  .sub { font-size: 8pt; margin-bottom: 3mm; }
  .hr { border: 0; border-top: 1px dashed #000; margin: 2mm 0; }
  .row { display: flex; justify-content: space-between; font-size: 9pt; }
  .big { font-size: 22pt; font-weight: 900; text-align: center; letter-spacing: 2px; }
  .field { font-size: 10pt; margin: 1mm 0; }
  .field b { display: inline-block; min-width: 18mm; }
  .boleta { font-size: 28pt; font-weight: 900; text-align: center;
    border: 2px solid #000; padding: 2mm; margin: 2mm 0; letter-spacing: 3px; }
  .estado { text-align: center; font-weight: 900; font-size: 12pt;
    border: 1px solid #000; padding: 1mm; margin-top: 2mm; }
  .barcode { font-family: 'Libre Barcode 128', monospace; font-size: 36pt;
    text-align: center; line-height: 1; }
  .small { font-size: 8pt; text-align: center; }
  @media print { .noprint { display: none; } }
</style>
<link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+128&display=swap" rel="stylesheet">
</head><body>
<div class="label">
  <div class="center title">STIHL ANCUD</div>
  <div class="center sub">SERVICIO TÉCNICO</div>
  <hr class="hr">
  <div class="boleta">N° ${escapeHtml(ficha.numeroBoleta)}</div>
  <div class="field"><b>Fecha:</b> ${fecha}</div>
  <div class="field"><b>Cliente:</b> ${escapeHtml(ficha.cliente.nombre)}</div>
  ${tel ? `<div class="field"><b>Teléfono:</b> ${escapeHtml(tel)}</div>` : ''}
  <hr class="hr">
  <div class="field"><b>Equipo:</b> ${escapeHtml(ficha.modeloMaquina || '—')}</div>
  ${ficha.numeroSerie ? `<div class="field"><b>N° Serie:</b> ${escapeHtml(ficha.numeroSerie)}</div>` : ''}
  <div class="field"><b>Técnico:</b> ${escapeHtml(ficha.tecnico)}</div>
  <hr class="hr">
  ${ficha.tipoAveria ? `<div class="field"><b>Avería:</b><br>${escapeHtml(ficha.tipoAveria)}</div><hr class="hr">` : ''}
  <div class="barcode">*${escapeHtml(ficha.numeroBoleta)}*</div>
  <div class="small">${escapeHtml(ficha.numeroBoleta)}</div>
  <div class="estado">${escapeHtml(estadoTxt(ficha.estado))}</div>
  <div class="small" style="margin-top:3mm">Pudeto 351, Ancud · +56 65 2622214</div>
</div>
<div class="noprint" style="text-align:center;padding:10px">
  <button onclick="window.print()" style="font-size:14px;padding:6px 14px">Imprimir</button>
  <button onclick="window.close()" style="font-size:14px;padding:6px 14px">Cerrar</button>
</div>
<script>
  // Esperar fuentes de barcode antes de imprimir
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => setTimeout(() => window.print(), 250));
  } else {
    setTimeout(() => window.print(), 600);
  }
</script>
</body></html>`;

  w.document.open();
  w.document.write(html);
  w.document.close();
}

function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]!));
}

function estadoTxt(e: string): string {
  switch (e) {
    case 'TALLER': return 'EN TALLER';
    case 'ESPERA_REPUESTO': return 'ESPERA REPUESTO';
    case 'LISTO': return 'LISTO PARA RETIRAR';
    case 'ENTREGADA': return 'ENTREGADA';
    default: return e;
  }
}
