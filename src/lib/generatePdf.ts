import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FichaTecnica } from '@/types';

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

export const generatePdfDocument = async (ficha: FichaTecnica): Promise<void> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  const totalRepuestos = ficha.repuestos.reduce(
    (sum, r) => sum + (r.precioEditado ?? r.precio) * r.cantidad,
    0
  );

  let yPos = 15;

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(243, 112, 33); // STIHL Orange
  doc.text('SERVICIO TÉCNICO', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 8;
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('DISTRIBUIDOR AUTORIZADO', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 7;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('STIHL ANCUD', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 5;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('COMERCIAL SOTAVENTO LTDA.', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 5;
  doc.text('Casa matriz: Pudeto 351 - Ancud', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 5;
  doc.text('Fono Fax: 652622214', pageWidth / 2, yPos, { align: 'center' });

  // Nº Servicio
  yPos += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`Nº SERVICIO: ${ficha.numeroServicio}`, pageWidth - 15, yPos, { align: 'right' });

  // Datos del Equipo
  yPos += 10;
  autoTable(doc, {
    startY: yPos,
    head: [[{ content: 'DATOS DEL EQUIPO', colSpan: 4, styles: { halign: 'center', fillColor: [243, 112, 33] } }]],
    body: [
      ['MODELO:', ficha.modeloMaquina, 'N° SERIE:', ficha.numeroSerie],
      ['NOMBRE:', ficha.cliente.nombre, 'TELÉFONO:', ficha.cliente.telefono],
      ['N° BOLETA:', ficha.numeroBoleta, 'FECHA INGRESO:', formatDate(ficha.fechaIngreso)],
    ],
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [243, 112, 33], textColor: 255 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 30 },
      2: { fontStyle: 'bold', cellWidth: 35 },
    },
  });

  // Datos de la Máquina
  yPos = (doc as any).lastAutoTable.finalY + 5;
  autoTable(doc, {
    startY: yPos,
    head: [[{ content: 'DATOS DE LA MÁQUINA', colSpan: 2, styles: { halign: 'center', fillColor: [243, 112, 33] } }]],
    body: [
      ['TIPO DE AVERÍA:', ficha.tipoAveria || '-'],
    ],
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [243, 112, 33], textColor: 255 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
    },
  });

  // Repuestos
  if (ficha.repuestos.length > 0) {
    yPos = (doc as any).lastAutoTable.finalY + 5;
    const repuestosData = ficha.repuestos.map(r => [
      r.cantidad.toString(),
      r.codigo,
      r.nombre,
      formatCurrency((r.precioEditado ?? r.precio) * r.cantidad),
    ]);
    repuestosData.push(['', '', 'TOTAL:', formatCurrency(totalRepuestos)]);

    autoTable(doc, {
      startY: yPos,
      head: [[{ content: 'PROCEDIMIENTO', colSpan: 4, styles: { halign: 'center', fillColor: [243, 112, 33] } }],
             ['CANT', 'CÓDIGO', 'REPUESTO', 'PRECIO']],
      body: repuestosData,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [243, 112, 33], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 35 },
        3: { cellWidth: 30, halign: 'right' },
      },
      didParseCell: (data) => {
        if (data.row.index === repuestosData.length - 1 && data.section === 'body') {
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });
  }

  // Servicios
  const serviciosData = ficha.servicios
    .filter(s => s.revision || s.reparacion)
    .map(s => [s.nombre, s.revision ? 'SÍ' : '-', s.reparacion ? 'SÍ' : '-']);

  if (serviciosData.length > 0) {
    yPos = (doc as any).lastAutoTable.finalY + 5;
    autoTable(doc, {
      startY: yPos,
      head: [[{ content: 'SERVICIO', colSpan: 3, styles: { halign: 'center', fillColor: [243, 112, 33] } }],
             ['', 'REVISIÓN', 'REPARACIÓN/CAMBIO']],
      body: serviciosData,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [243, 112, 33], textColor: 255 },
      columnStyles: {
        1: { halign: 'center', cellWidth: 30 },
        2: { halign: 'center', cellWidth: 40 },
      },
    });
  }

  // Footer
  yPos = (doc as any).lastAutoTable.finalY + 15;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('REPARACIÓN GARANTIZADA POR 10 DÍAS DE LA FECHA DE RETIRO', pageWidth / 2, yPos, { align: 'center' });

  yPos += 10;
  doc.setFontSize(10);
  doc.text(`FECHA DE ENTREGA: ${formatDate(ficha.fechaEntrega)}`, 15, yPos);

  yPos += 8;
  doc.text(`MECÁNICO ENCARGADO: ${ficha.tecnico}`, 15, yPos);

  // Save
  doc.save(`Ficha_${ficha.numeroServicio}_${ficha.cliente.nombre}.pdf`);
};

export const printFicha = (ficha: FichaTecnica): void => {
  const totalRepuestos = ficha.repuestos.reduce(
    (sum, r) => sum + (r.precioEditado ?? r.precio) * r.cantidad,
    0
  );

  const serviciosHtml = ficha.servicios
    .filter(s => s.revision || s.reparacion)
    .map(s => `
      <tr>
        <td>${s.nombre}</td>
        <td style="text-align: center;">${s.revision ? 'SÍ' : '-'}</td>
        <td style="text-align: center;">${s.reparacion ? 'SÍ' : '-'}</td>
      </tr>
    `).join('');

  const repuestosHtml = ficha.repuestos.map(r => `
    <tr>
      <td style="text-align: center;">${r.cantidad}</td>
      <td>${r.codigo}</td>
      <td>${r.nombre}</td>
      <td style="text-align: right;">${formatCurrency((r.precioEditado ?? r.precio) * r.cantidad)}</td>
    </tr>
  `).join('');

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Ficha Técnica - ${ficha.numeroServicio}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; }
        .header { text-align: center; margin-bottom: 20px; }
        .header h1 { color: #F37021; font-size: 18px; margin-bottom: 5px; }
        .header h2 { font-size: 14px; margin-bottom: 3px; }
        .header p { font-size: 10px; color: #666; }
        .servicio-num { text-align: right; font-weight: bold; margin-bottom: 15px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        th, td { border: 1px solid #333; padding: 6px 8px; }
        th { background: #F37021; color: white; text-align: left; }
        .section-title { background: #F37021; color: white; text-align: center; font-weight: bold; }
        .label { font-weight: bold; width: 120px; }
        .footer { margin-top: 30px; }
        .footer p { margin-bottom: 8px; }
        .garantia { font-weight: bold; text-align: center; margin: 20px 0; font-size: 11px; }
        .total-row { font-weight: bold; background: #f5f5f5; }
        @media print {
          body { padding: 10px; }
          @page { margin: 1cm; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>SERVICIO TÉCNICO</h1>
        <h2>DISTRIBUIDOR AUTORIZADO</h2>
        <h2>STIHL ANCUD</h2>
        <p>COMERCIAL SOTAVENTO LTDA.</p>
        <p>Casa matriz: Pudeto 351 - Ancud | Fono Fax: 652622214</p>
      </div>

      <div class="servicio-num">Nº SERVICIO: ${ficha.numeroServicio}</div>

      <table>
        <tr><td colspan="4" class="section-title">DATOS DEL EQUIPO</td></tr>
        <tr>
          <td class="label">MODELO:</td><td>${ficha.modeloMaquina}</td>
          <td class="label">N° SERIE:</td><td>${ficha.numeroSerie}</td>
        </tr>
        <tr>
          <td class="label">NOMBRE:</td><td>${ficha.cliente.nombre}</td>
          <td class="label">TELÉFONO:</td><td>${ficha.cliente.telefono}</td>
        </tr>
        <tr>
          <td class="label">N° BOLETA:</td><td>${ficha.numeroBoleta}</td>
          <td class="label">FECHA INGRESO:</td><td>${formatDate(ficha.fechaIngreso)}</td>
        </tr>
      </table>

      <table>
        <tr><td colspan="2" class="section-title">DATOS DE LA MÁQUINA</td></tr>
        <tr>
          <td class="label">TIPO DE AVERÍA:</td>
          <td>${ficha.tipoAveria || '-'}</td>
        </tr>
      </table>

      ${ficha.repuestos.length > 0 ? `
      <table>
        <tr><td colspan="4" class="section-title">PROCEDIMIENTO</td></tr>
        <tr>
          <th style="width: 50px;">CANT</th>
          <th style="width: 100px;">CÓDIGO</th>
          <th>REPUESTO</th>
          <th style="width: 100px;">PRECIO</th>
        </tr>
        ${repuestosHtml}
        <tr class="total-row">
          <td colspan="3" style="text-align: right;">TOTAL:</td>
          <td style="text-align: right;">${formatCurrency(totalRepuestos)}</td>
        </tr>
      </table>
      ` : ''}

      ${serviciosHtml ? `
      <table>
        <tr><td colspan="3" class="section-title">SERVICIO</td></tr>
        <tr>
          <th>SERVICIO</th>
          <th style="width: 80px;">REVISIÓN</th>
          <th style="width: 120px;">REPARACIÓN/CAMBIO</th>
        </tr>
        ${serviciosHtml}
      </table>
      ` : ''}

      <p class="garantia">REPARACIÓN GARANTIZADA POR 10 DÍAS DE LA FECHA DE RETIRO</p>

      <div class="footer">
        <p><strong>FECHA DE ENTREGA:</strong> ${formatDate(ficha.fechaEntrega)}</p>
        <p><strong>MECÁNICO ENCARGADO:</strong> ${ficha.tecnico}</p>
      </div>
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
