import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { createPdfDoc, getPdfFileName } from '@/lib/generatePdf';
import { FichaTecnica } from '@/types';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

type Row = {
  numero_boleta: string; fecha_ingreso: string; fecha_reparacion: string | null; fecha_entrega: string | null;
  cliente_nombre: string; cliente_telefono: string | null; modelo_maquina: string; numero_serie: string | null;
  mecanico: string; repuestos: any; servicios: any; observaciones: string | null;
};

const FichaPublica = () => {
  const { token } = useParams();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState('ficha.pdf');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    document.title = 'Ficha Técnica - Servicio Técnico STIHL';
    let url: string | null = null;
    (async () => {
      const { data } = await supabase.rpc('get_ficha_publica' as never, { _token: token } as never);
      const rows = data as unknown as Row[] | null;
      if (!rows || !rows.length) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const r = rows[0];
      const ficha: FichaTecnica = {
        id: '',
        numeroBoleta: r.numero_boleta,
        numeroServicio: r.numero_boleta,
        fechaIngreso: new Date(r.fecha_ingreso),
        fechaReparacion: r.fecha_reparacion ? new Date(r.fecha_reparacion) : null,
        fechaEntrega: r.fecha_entrega ? new Date(r.fecha_entrega) : null,
        cliente: { id: '', nombre: r.cliente_nombre, telefono: r.cliente_telefono || '' },
        modeloMaquina: r.modelo_maquina,
        numeroSerie: r.numero_serie || '',
        tipoAveria: r.observaciones || '',
        repuestos: Array.isArray(r.repuestos) ? r.repuestos : [],
        servicios: Array.isArray(r.servicios) ? r.servicios : [],
        recomendaciones: '',
        tecnico: r.mecanico === 'JORGE' ? 'JORGE' : 'JEAN',
        estado: 'TALLER',
      };
      const doc = createPdfDoc(ficha);
      const blob = doc.output('blob');
      url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setFileName(`${getPdfFileName(ficha)}.pdf`);
      setLoading(false);
    })();
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [token]);

  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Cargando ficha...</div>;
  if (notFound) return <div className="flex min-h-screen items-center justify-center p-6 text-center text-muted-foreground">Ficha no encontrada. Revise el enlace.</div>;

  return (
    <div className="flex h-screen flex-col bg-muted/30">
      <div className="flex items-center justify-between gap-2 border-b bg-card px-4 py-2">
        <p className="truncate text-sm font-medium">{fileName}</p>
        <Button size="sm" asChild>
          <a href={pdfUrl ?? '#'} download={fileName}>
            <Download className="mr-1 h-4 w-4" /> Descargar PDF
          </a>
        </Button>
      </div>
      <iframe src={pdfUrl ?? undefined} title="Ficha Técnica PDF" className="h-full w-full flex-1" />
    </div>
  );
};

export default FichaPublica;
