import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  ImageRun,
} from 'docx';
import { saveAs } from 'file-saver';
import { FichaTecnica, ServicioItem } from '@/types';
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

const createTableBorders = () => ({
  top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
});

async function getImageAsArrayBuffer(imagePath: string): Promise<ArrayBuffer> {
  const response = await fetch(imagePath);
  const blob = await response.blob();
  return await blob.arrayBuffer();
}

export const generateWordDocument = async (ficha: FichaTecnica): Promise<void> => {
  const totalRepuestos = ficha.repuestos.reduce(
    (sum, r) => sum + (r.precioEditado ?? r.precio) * r.cantidad,
    0
  );

  let logoImageRun: ImageRun | null = null;
  
  try {
    const imageBuffer = await getImageAsArrayBuffer(stihlLogo);
    logoImageRun = new ImageRun({
      data: imageBuffer,
      transformation: {
        width: 120,
        height: 60,
      },
      type: 'jpg',
    });
  } catch (error) {
    console.error('Error loading logo:', error);
  }

  const headerParagraphs: Paragraph[] = [];

  if (logoImageRun) {
    headerParagraphs.push(
      new Paragraph({
        children: [logoImageRun],
        alignment: AlignmentType.LEFT,
      })
    );
  }

  headerParagraphs.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'SERVICIO TÉCNICO', bold: true, size: 28 }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'DISTRIBUIDOR AUTORIZADO', bold: true, size: 24 }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'STIHL ANCUD', bold: true, size: 22 }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'COMERCIAL SOTAVENTO LDTA.', size: 20 }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Casa matriz: Pudeto 351-Ancud', size: 18 }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Fono Fax: 652622214', size: 18 }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Nº SERVICIO: ${ficha.numeroServicio}`, bold: true, size: 24 }),
      ],
      alignment: AlignmentType.RIGHT,
      spacing: { after: 300 },
    })
  );

  // Tabla de datos del equipo
  const datosEquipoTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'DATOS DEL EQUIPO', bold: true })] })],
            columnSpan: 4,
            shading: { fill: 'F37021' },
            borders: createTableBorders(),
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'MODELO:', bold: true })] })],
            borders: createTableBorders(),
          }),
          new TableCell({
            children: [new Paragraph({ text: ficha.modeloMaquina })],
            borders: createTableBorders(),
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'N° SERIE:', bold: true })] })],
            borders: createTableBorders(),
          }),
          new TableCell({
            children: [new Paragraph({ text: ficha.numeroSerie })],
            borders: createTableBorders(),
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'NOMBRE:', bold: true })] })],
            borders: createTableBorders(),
          }),
          new TableCell({
            children: [new Paragraph({ text: ficha.cliente.nombre })],
            borders: createTableBorders(),
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'TELÉFONO:', bold: true })] })],
            borders: createTableBorders(),
          }),
          new TableCell({
            children: [new Paragraph({ text: ficha.cliente.telefono })],
            borders: createTableBorders(),
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'N° BOLETA:', bold: true })] })],
            borders: createTableBorders(),
          }),
          new TableCell({
            children: [new Paragraph({ text: ficha.numeroBoleta })],
            borders: createTableBorders(),
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'FECHA INGRESO:', bold: true })] })],
            borders: createTableBorders(),
          }),
          new TableCell({
            children: [new Paragraph({ text: formatDate(ficha.fechaIngreso) })],
            borders: createTableBorders(),
          }),
        ],
      }),
    ],
  });

  // Tabla de tipo de avería
  const averiaTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'DATOS DE LA MÁQUINA', bold: true })] })],
            columnSpan: 2,
            shading: { fill: 'F37021' },
            borders: createTableBorders(),
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'TIPO DE AVERÍA:', bold: true })] })],
            borders: createTableBorders(),
          }),
          new TableCell({
            children: [new Paragraph({ text: ficha.tipoAveria })],
            borders: createTableBorders(),
          }),
        ],
      }),
    ],
  });

  // Tabla de repuestos
  const repuestosRows = [
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: 'PROCEDIMIENTO', bold: true })] })],
          columnSpan: 4,
          shading: { fill: 'F37021' },
          borders: createTableBorders(),
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: 'CANT', bold: true })] })],
          shading: { fill: 'DDDDDD' },
          borders: createTableBorders(),
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: 'CÓDIGO', bold: true })] })],
          shading: { fill: 'DDDDDD' },
          borders: createTableBorders(),
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: 'REPUESTO', bold: true })] })],
          shading: { fill: 'DDDDDD' },
          borders: createTableBorders(),
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: 'PRECIO', bold: true })] })],
          shading: { fill: 'DDDDDD' },
          borders: createTableBorders(),
        }),
      ],
    }),
    ...ficha.repuestos.map(
      (r) =>
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ text: r.cantidad.toString() })],
              borders: createTableBorders(),
            }),
            new TableCell({
              children: [new Paragraph({ text: r.codigo })],
              borders: createTableBorders(),
            }),
            new TableCell({
              children: [new Paragraph({ text: r.nombre })],
              borders: createTableBorders(),
            }),
            new TableCell({
              children: [new Paragraph({ text: formatCurrency((r.precioEditado ?? r.precio) * r.cantidad) })],
              borders: createTableBorders(),
            }),
          ],
        })
    ),
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: 'TOTAL:', bold: true })] })],
          columnSpan: 3,
          borders: createTableBorders(),
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(totalRepuestos), bold: true })] })],
          borders: createTableBorders(),
        }),
      ],
    }),
  ];

  const repuestosTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: repuestosRows,
  });

  // Tabla de servicios
  const serviciosRows = [
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: 'SERVICIO', bold: true })] })],
          columnSpan: 3,
          shading: { fill: 'F37021' },
          borders: createTableBorders(),
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ text: '' })],
          shading: { fill: 'DDDDDD' },
          borders: createTableBorders(),
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: 'REVISIÓN', bold: true })] })],
          shading: { fill: 'DDDDDD' },
          borders: createTableBorders(),
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: 'REPARACIÓN/CAMBIO', bold: true })] })],
          shading: { fill: 'DDDDDD' },
          borders: createTableBorders(),
        }),
      ],
    }),
    ...ficha.servicios.map(
      (s) =>
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ text: s.nombre })],
              borders: createTableBorders(),
            }),
            new TableCell({
              children: [new Paragraph({ text: s.revision ? 'SÍ' : '-' })],
              borders: createTableBorders(),
            }),
            new TableCell({
              children: [new Paragraph({ text: s.reparacion ? 'SÍ' : '-' })],
              borders: createTableBorders(),
            }),
          ],
        })
    ),
  ];

  const serviciosTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: serviciosRows,
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          ...headerParagraphs,
          datosEquipoTable,
          new Paragraph({ text: '', spacing: { after: 200 } }),
          averiaTable,
          new Paragraph({ text: '', spacing: { after: 200 } }),
          repuestosTable,
          new Paragraph({ text: '', spacing: { after: 200 } }),
          serviciosTable,
          new Paragraph({ text: '', spacing: { after: 300 } }),
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: 'RECOMENDACIONES:', bold: true })],
          }),
          new Paragraph({
            children: [new TextRun({ text: 'REPARACIÓN GARANTIZADA POR 10 DÍAS DE LA FECHA DE RETIRO', bold: true })],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'FECHA DE ENTREGA: ', bold: true }),
              new TextRun({ text: formatDate(ficha.fechaEntrega) }),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'MECÁNICO ENCARGADO: ', bold: true }),
              new TextRun({ text: ficha.tecnico }),
            ],
            alignment: AlignmentType.LEFT,
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Ficha_${ficha.numeroServicio}_${ficha.cliente.nombre}.docx`);
};
