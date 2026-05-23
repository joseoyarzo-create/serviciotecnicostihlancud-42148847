import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FichaTecnica } from '@/types';
import stihlLogo from '@/assets/stihl-logo.jpg';

const formatDate = (date: Date | null): string => {
  if (!date) return '';
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount);
};

const generateFileName = (ficha: FichaTecnica): string => {
  const boleta = ficha.numeroBoleta.trim();
  const cliente = ficha.cliente.nombre.trim().replace(/\s+/g, '_').toUpperCase();
  const modelo = ficha.modeloMaquina.trim().replace(/\s+/g, '_').toUpperCase();
  const mecanico = ficha.tecnico.toUpperCase();
  return `${boleta}_${cliente}_(${modelo})_${mecanico}`;
};

export const generatePdfDocument = async (ficha: FichaTecnica): Promise<void> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  const totalRepuestos = ficha.repuestos.reduce(
    (sum, r) => sum + (r.precioEditado ?? r.precio) * r.cantidad,
    0
  );

  let yPos = 12;

  // Title - SERVICIO TECNICO underlined
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('SERVICIO TECNICO.', pageWidth / 2, yPos, { align: 'center' });
  doc.setLineWidth(0.5);
  const titleWidth = doc.getTextWidth('SERVICIO TECNICO.');
  doc.line((pageWidth - titleWidth) / 2, yPos + 1, (pageWidth + titleWidth) / 2, yPos + 1);

  yPos += 8;

  // Header section: Left side (logo + company info) | Right side (N° Servicio, fechas)
  const leftColX = 14;
  const rightColX = 120;
  
  // Left side - DISTRIBUIDOR AUTORIZADO
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DISTRIBUIDOR AUTORIZADO', leftColX, yPos);
  
  // Right side - N° SERVICIO box
  doc.setFontSize(9);
  doc.text('Nº SERVICIO:', rightColX, yPos);
  doc.rect(rightColX + 25, yPos - 4, 50, 6);
  doc.setFont('helvetica', 'normal');
  doc.text(ficha.numeroServicio, rightColX + 27, yPos);

  yPos += 6;
  
  // Load and add logo
  try {
    doc.addImage(stihlLogo, 'JPEG', leftColX, yPos - 2, 30, 10);
  } catch (e) {
    // Logo fallback
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('STIHL', leftColX, yPos + 5);
  }
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('ANCUD', leftColX + 32, yPos + 4);

  // Right side - FECHA INGRESO
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('FECHA INGRESO', rightColX, yPos);
  doc.rect(rightColX + 30, yPos - 4, 45, 6);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(ficha.fechaIngreso), rightColX + 32, yPos);

  yPos += 6;
  
  // COMERCIAL SOTAVENTO LTDA.
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('COMERCIAL SOTAVENTO LDTA.', leftColX, yPos + 4);
  
  // Right side - FECHA REPARACIÓN
  doc.text('FECHA REPARACIÓN', rightColX, yPos);
  doc.rect(rightColX + 38, yPos - 4, 37, 6);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(ficha.fechaReparacion), rightColX + 40, yPos);

  yPos += 5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Casa matriz: Pudeto5 351-Ancud', leftColX, yPos + 4);
  yPos += 4;
  doc.text('Fono Fax: 652622214', leftColX, yPos + 4);

  yPos += 10;

  // DATOS DEL EQUIPO table
  autoTable(doc, {
    startY: yPos,
    head: [[{ content: 'DATOS DEL EQUIPO', colSpan: 4, styles: { halign: 'left', fillColor: [230, 230, 230], textColor: 0 } }]],
    body: [
      [{ content: 'MODELO', styles: { fontStyle: 'bold' } }, ficha.modeloMaquina, { content: 'N° SERIE', styles: { fontStyle: 'bold' } }, ficha.numeroSerie],
      [{ content: 'NOMBRE', styles: { fontStyle: 'bold' } }, ficha.cliente.nombre, { content: 'ESTADO', styles: { fontStyle: 'bold' } }, ficha.estado || 'TALLER'],
      [{ content: 'TELEFONO', styles: { fontStyle: 'bold' } }, ficha.cliente.telefono, { content: 'N° BOLETA', styles: { fontStyle: 'bold' } }, ficha.numeroBoleta],
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1.5, textColor: 0, lineColor: 0, lineWidth: 0.2 },
    headStyles: { fillColor: [230, 230, 230], textColor: 0, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 60 },
      2: { cellWidth: 25 },
      3: { cellWidth: 55 },
    },
  });

  // DATOS DE LA MAQUINA
  yPos = (doc as any).lastAutoTable.finalY + 2;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DE LA MAQUINA', 14, yPos + 4);
  
  yPos += 5;
  autoTable(doc, {
    startY: yPos,
    body: [
      [{ content: 'TIPO DE AVERIA', styles: { fontStyle: 'bold', cellWidth: 30 } }, ficha.tipoAveria || ''],
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1.5, textColor: 0, lineColor: 0, lineWidth: 0.2 },
  });

  // PROCEDIMIENTO / PRESUPUESTO / REPARACION header
  yPos = (doc as any).lastAutoTable.finalY + 2;
  autoTable(doc, {
    startY: yPos,
    body: [
      [
        { content: 'PROCEDIMIENTO', styles: { fontStyle: 'bold', halign: 'center' } },
        { content: 'PRESUPUESTO', styles: { fontStyle: 'bold', halign: 'center' } },
        { content: '', styles: { cellWidth: 30 } },
        { content: 'REPARACION', styles: { fontStyle: 'bold', halign: 'center' } },
        { content: 'X', styles: { fontStyle: 'bold', halign: 'center', cellWidth: 12 } },
      ],
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1.5, textColor: 0, lineColor: 0, lineWidth: 0.2 },
  });

  // Repuestos table
  yPos = (doc as any).lastAutoTable.finalY;
  const repuestosData = ficha.repuestos.length > 0 
    ? ficha.repuestos.map(r => [
        r.cantidad.toString(),
        r.codigo,
        r.nombre,
        formatCurrency((r.precioEditado ?? r.precio) * r.cantidad),
      ])
    : [['', '', '', '']];
  
  // Add empty rows if less than 3 repuestos
  while (repuestosData.length < 3) {
    repuestosData.push(['', '', '', '']);
  }

  autoTable(doc, {
    startY: yPos,
    head: [['CANT', 'CODIGO', 'REPUESTO', 'PRECIO']],
    body: repuestosData,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1.5, textColor: 0, lineColor: 0, lineWidth: 0.2 },
    headStyles: { fillColor: [255, 255, 255], textColor: 0, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 35 },
      2: { cellWidth: 90 },
      3: { cellWidth: 25, halign: 'right' },
    },
  });

  // TOTAL row
  yPos = (doc as any).lastAutoTable.finalY;
  autoTable(doc, {
    startY: yPos,
    body: [
      [{ content: 'TOTAL:', styles: { fontStyle: 'bold' } }, formatCurrency(totalRepuestos)],
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1.5, textColor: 0, lineColor: 0, lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 140 },
      1: { cellWidth: 25, halign: 'right' },
    },
  });

  // SERVICIO table - all REVISION marked as SÍ
  yPos = (doc as any).lastAutoTable.finalY + 2;
  const serviciosData = ficha.servicios.map(s => [
    s.nombre,
    'SI', // REVISION always SÍ
    s.reparacion ? 'SI' : 'NO',
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['SERVICIO', 'REVISION', 'REPARACION/CAMBIO']],
    body: serviciosData,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1, textColor: 0, lineColor: 0, lineWidth: 0.2 },
    headStyles: { fillColor: [230, 230, 230], textColor: 0, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 35, halign: 'center' },
    },
  });

  // RECOMENDACIONES section
  yPos = (doc as any).lastAutoTable.finalY + 2;
  autoTable(doc, {
    startY: yPos,
    body: [
      [{ content: 'RECOMENDACIONES:', styles: { fontStyle: 'bold' } }],
      [''],
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, textColor: 0, lineColor: 0, lineWidth: 0.2 },
  });

  // Footer
  yPos = (doc as any).lastAutoTable.finalY + 3;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('REPARACION GARATIZADA POR 20 DIAS DE LA FECHA DE RETIRO', 14, yPos);
  yPos += 4;
  doc.text(`FECHA DE ENTREGA: ${formatDate(ficha.fechaEntrega)}`, 14, yPos);

  // Page 2 - Mecánico encargado (or same page if fits)
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`MECÁNICO ENCARGADO: ${ficha.tecnico === 'JORGE' ? 'JORGE ALVARADO' : 'JEAN'}`, 14, yPos);

  // Save with custom filename
  const fileName = generateFileName(ficha);
  doc.save(`${fileName}.pdf`);
};

// HTML escape function to prevent XSS
const escapeHtml = (text: string | null | undefined): string => {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

export const printFicha = (ficha: FichaTecnica): void => {
  const totalRepuestos = ficha.repuestos.reduce(
    (sum, r) => sum + (r.precioEditado ?? r.precio) * r.cantidad,
    0
  );

  // Escape all user-controlled data
  const safeNumeroServicio = escapeHtml(ficha.numeroServicio);
  const safeModeloMaquina = escapeHtml(ficha.modeloMaquina);
  const safeNumeroSerie = escapeHtml(ficha.numeroSerie);
  const safeClienteNombre = escapeHtml(ficha.cliente.nombre);
  const safeClienteTelefono = escapeHtml(ficha.cliente.telefono);
  const safeNumeroBoleta = escapeHtml(ficha.numeroBoleta);
  const safeTipoAveria = escapeHtml(ficha.tipoAveria);
  const safeTecnico = escapeHtml(ficha.tecnico);

  // All servicios with REVISION always marked as SÍ
  const serviciosHtml = ficha.servicios
    .map(s => `
      <tr>
        <td>${escapeHtml(s.nombre)}</td>
        <td style="text-align: center;">SI</td>
        <td style="text-align: center;">${s.reparacion ? 'SI' : 'NO'}</td>
      </tr>
    `).join('');

  const repuestosHtml = ficha.repuestos.length > 0 
    ? ficha.repuestos.map(r => `
      <tr>
        <td style="text-align: center;">${escapeHtml(r.cantidad.toString())}</td>
        <td>${escapeHtml(r.codigo)}</td>
        <td>${escapeHtml(r.nombre)}</td>
        <td style="text-align: right;">${formatCurrency((r.precioEditado ?? r.precio) * r.cantidad)}</td>
      </tr>
    `).join('')
    : '<tr><td></td><td></td><td></td><td></td></tr>';

  const fileName = generateFileName(ficha);

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${escapeHtml(fileName)}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 10px; padding: 10px; color: #000; }
        .title { text-align: center; font-size: 14px; font-weight: bold; text-decoration: underline; margin-bottom: 10px; }
        .header { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .header-left { flex: 1; }
        .header-right { width: 200px; }
        .header-right table { width: 100%; border-collapse: collapse; }
        .header-right td { border: 1px solid #000; padding: 2px 5px; font-size: 9px; }
        .company-name { font-weight: bold; font-size: 10px; margin-bottom: 2px; }
        .stihl-logo { font-weight: bold; font-size: 16px; font-style: italic; }
        .company-info { font-size: 8px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 5px; }
        th, td { border: 1px solid #000; padding: 2px 4px; font-size: 8px; }
        th { background: #e6e6e6; text-align: left; font-weight: bold; }
        .section-title { background: #e6e6e6; font-weight: bold; text-align: left; }
        .label { font-weight: bold; width: 80px; }
        .footer { margin-top: 10px; font-size: 8px; }
        .mecanico { font-size: 10px; font-weight: bold; margin-top: 10px; }
        @media print {
          body { padding: 5px; }
          @page { margin: 0.5cm; size: A4; }
        }
      </style>
    </head>
    <body>
      <div class="title">SERVICIO TECNICO.</div>
      
      <div class="header">
        <div class="header-left">
          <div class="company-name">DISTRIBUIDOR AUTORIZADO</div>
          <div><span class="stihl-logo">STIHL</span> ANCUD</div>
          <div class="company-name">COMERCIAL SOTAVENTO LDTA.</div>
          <div class="company-info">Casa matriz: Pudeto5 351-Ancud</div>
          <div class="company-info">Fono Fax: 652622214</div>
        </div>
        <div class="header-right">
          <table>
            <tr><td class="label">Nº SERVICIO:</td><td>${safeNumeroServicio}</td></tr>
            <tr><td class="label">FECHA INGRESO</td><td>${formatDate(ficha.fechaIngreso)}</td></tr>
            <tr><td class="label">FECHA REPARACIÓN</td><td>${formatDate(ficha.fechaReparacion)}</td></tr>
          </table>
        </div>
      </div>

      <table>
        <tr><td colspan="4" class="section-title">DATOS DEL EQUIPO</td></tr>
        <tr>
          <td class="label">MODELO</td><td>${safeModeloMaquina}</td>
          <td class="label">N° SERIE</td><td>${safeNumeroSerie}</td>
        </tr>
        <tr>
          <td class="label">NOMBRE</td><td colspan="3">${safeClienteNombre}</td>
        </tr>
        <tr>
          <td class="label">TELEFONO</td><td>${safeClienteTelefono}</td>
          <td class="label">N° BOLETA</td><td>${safeNumeroBoleta}</td>
        </tr>
      </table>

      <table>
        <tr><td colspan="2" class="section-title">DATOS DE LA MAQUINA</td></tr>
        <tr>
          <td class="label">TIPO DE AVERIA</td>
          <td>${safeTipoAveria}</td>
        </tr>
      </table>

      <table>
        <tr>
          <th>CANT</th>
          <th>CODIGO</th>
          <th>REPUESTO</th>
          <th>PRECIO</th>
        </tr>
        ${repuestosHtml}
        <tr style="font-weight: bold;">
          <td colspan="3" style="text-align: right;">TOTAL:</td>
          <td style="text-align: right;">${formatCurrency(totalRepuestos)}</td>
        </tr>
      </table>

      <table>
        <tr>
          <th>SERVICIO</th>
          <th style="width: 60px;">REVISION</th>
          <th style="width: 80px;">REPARACION/CAMBIO</th>
        </tr>
        ${serviciosHtml}
      </table>

      <table>
        <tr><td class="section-title">RECOMENDACIONES:</td></tr>
        <tr><td style="height: 15px;"></td></tr>
      </table>

      <div class="footer">
        <p>REPARACION GARATIZADA POR 20 DIAS DE LA FECHA DE RETIRO</p>
        <p>FECHA DE ENTREGA: ${formatDate(ficha.fechaEntrega)}</p>
      </div>

      <div class="mecanico">MECÁNICO ENCARGADO: ${safeTecnico === 'JORGE' ? 'JORGE ALVARADO' : 'JEAN'}</div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
};
