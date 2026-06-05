import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FichaTecnica } from '@/types';

const calcTotal = (f: FichaTecnica) =>
  f.repuestos.reduce((s, r) => s + (r.precioEditado ?? r.precio) * r.cantidad, 0);

const fmtCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(n);

export async function exportStatsToPdf(
  fichas: FichaTecnica[],
  monthlyFichas: FichaTecnica[],
  currentMonth: Date,
  chartElement?: HTMLElement | null
): Promise<void> {
  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const W = pdf.internal.pageSize.getWidth();

  // Header
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text('STIHL ANCUD — Panel de Estadísticas', W / 2, 15, { align: 'center' });
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text(
    `Mes: ${format(currentMonth, 'MMMM yyyy', { locale: es }).toUpperCase()}`,
    W / 2, 22, { align: 'center' }
  );
  pdf.text(`Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, W / 2, 28, { align: 'center' });

  // KPIs
  const totalMes = monthlyFichas.reduce((s, f) => s + calcTotal(f), 0);
  const totalHist = fichas.reduce((s, f) => s + calcTotal(f), 0);
  const enTaller = fichas.filter((f) => f.estado !== 'ENTREGADA').length;
  const prom = monthlyFichas.length ? totalMes / monthlyFichas.length : 0;

  autoTable(pdf, {
    startY: 34,
    head: [['Indicador', 'Valor']],
    body: [
      ['Ingresos del mes', fmtCLP(totalMes)],
      ['Fichas del mes', String(monthlyFichas.length)],
      ['Promedio por ficha', fmtCLP(prom)],
      ['Equipos en taller', String(enTaller)],
      ['Total histórico', fmtCLP(totalHist)],
      ['Total fichas históricas', String(fichas.length)],
    ],
    theme: 'grid',
    styles: { fontSize: 10 },
    headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
  });

  let cursorY = (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // Optional: charts screenshot
  if (chartElement) {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(chartElement, { scale: 2, backgroundColor: '#ffffff' });
      const img = canvas.toDataURL('image/png');
      const imgW = W - 20;
      const imgH = (canvas.height * imgW) / canvas.width;
      if (cursorY + imgH > 280) { pdf.addPage(); cursorY = 15; }
      pdf.addImage(img, 'PNG', 10, cursorY, imgW, imgH);
      cursorY += imgH + 8;
    } catch (e) {
      console.warn('No se pudo capturar gráficos', e);
    }
  }

  // Ranking de modelos
  const modelosMap = new Map<string, number>();
  monthlyFichas.forEach((f) => {
    modelosMap.set(f.modeloMaquina || 'SIN MODELO', (modelosMap.get(f.modeloMaquina || 'SIN MODELO') || 0) + 1);
  });
  const rankingModelos = [...modelosMap.entries()]
    .sort((a, b) => b[1] - a[1]).slice(0, 10);

  if (rankingModelos.length) {
    if (cursorY > 240) { pdf.addPage(); cursorY = 15; }
    pdf.setFont('helvetica', 'bold');
    pdf.text('Top 10 modelos atendidos (mes)', 10, cursorY);
    autoTable(pdf, {
      startY: cursorY + 3,
      head: [['Modelo', 'Fichas']],
      body: rankingModelos.map(([m, c]) => [m, String(c)]),
      theme: 'striped',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [40, 40, 40] },
    });
    cursorY = (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  // Ingresos por técnico
  const tecMap = new Map<string, { count: number; total: number }>();
  monthlyFichas.forEach((f) => {
    const t = tecMap.get(f.tecnico) || { count: 0, total: 0 };
    t.count += 1;
    t.total += calcTotal(f);
    tecMap.set(f.tecnico, t);
  });
  if (tecMap.size) {
    if (cursorY > 240) { pdf.addPage(); cursorY = 15; }
    pdf.setFont('helvetica', 'bold');
    pdf.text('Ingresos por técnico (mes)', 10, cursorY);
    autoTable(pdf, {
      startY: cursorY + 3,
      head: [['Técnico', 'Fichas', 'Total']],
      body: [...tecMap.entries()].map(([t, v]) => [t, String(v.count), fmtCLP(v.total)]),
      theme: 'striped',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [40, 40, 40] },
    });
    cursorY = (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  // Lista de fichas del mes
  if (monthlyFichas.length) {
    if (cursorY > 230) { pdf.addPage(); cursorY = 15; }
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Fichas del mes (${monthlyFichas.length})`, 10, cursorY);
    autoTable(pdf, {
      startY: cursorY + 3,
      head: [['Boleta', 'Fecha', 'Cliente', 'Equipo', 'Téc.', 'Estado', 'Total']],
      body: monthlyFichas.map((f) => [
        f.numeroBoleta,
        format(f.fechaIngreso, 'dd/MM/yy'),
        f.cliente.nombre,
        f.modeloMaquina,
        f.tecnico,
        f.estado,
        fmtCLP(calcTotal(f)),
      ]),
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [40, 40, 40] },
    });
  }

  pdf.save(`stats_${format(currentMonth, 'yyyy-MM')}.pdf`);
}
