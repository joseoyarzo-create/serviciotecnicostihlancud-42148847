import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { supabase } from '@/integrations/supabase/client';
import { createPdfDoc, getPdfFileName } from '@/lib/generatePdf';
import { FichaTecnica } from '@/types';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

type Row = {
  numero_boleta: string; fecha_ingreso: string; fecha_reparacion: string | null; fecha_entrega: string | null;
  cliente_nombre: string; cliente_telefono: string | null; modelo_maquina: string; numero_serie: string | null;
  mecanico: string; repuestos: any; servicios: any; observaciones: string | null;
};

const FichaPublica = () => {
  const { token } = useParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState('ficha.pdf');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    document.title = 'Ficha Técnica - Servicio Técnico STIHL';
    let url: string | null = null;
    let cancelled = false;

    (async () => {
      const { data } = await supabase.rpc('get_ficha_publica' as never, { _token: token } as never);
      const rows = data as unknown as Row[] | null;
      if (!rows || !rows.length) {
        if (!cancelled) { setNotFound(true); setLoading(false); }
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
      const bytes = doc.output('arraybuffer');
      url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      if (cancelled) return;
      setPdfUrl(url);
      setFileName(`${getPdfFileName(ficha)}.pdf`);

      // Render every page to canvas so it displays on any device (incl. phones)
      const pdf = await pdfjs.getDocument({ data: bytes.slice(0) }).promise;
      const container = containerRef.current;
      if (!container || cancelled) return;
      container.innerHTML = '';
      for (let p = 1; p <= pdf.numPages; p++) {
        const pdfPage = await pdf.getPage(p);
        const baseViewport = pdfPage.getViewport({ scale: 1 });
        const targetWidth = Math.min(container.clientWidth || 800, 900);
        const scale = (targetWidth / baseViewport.width) * (window.devicePixelRatio || 1);
        const viewport = pdfPage.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = '100%';
        canvas.style.height = 'auto';
        canvas.className = 'block w-full rounded border bg-white shadow-sm';
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;
        await pdfPage.render({ canvasContext: ctx, viewport }).promise;
        container.appendChild(canvas);
      }
      if (!cancelled) setLoading(false);
    })();

    return () => { cancelled = true; if (url) URL.revokeObjectURL(url); };
  }, [token]);

  if (notFound) return <div className="flex min-h-screen items-center justify-center p-6 text-center text-muted-foreground">Ficha no encontrada. Revise el enlace.</div>;

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b bg-card px-4 py-2">
        <p className="truncate text-sm font-medium">{fileName}</p>
        <Button size="sm" asChild disabled={!pdfUrl}>
          <a href={pdfUrl ?? '#'} download={fileName}>
            <Download className="mr-1 h-4 w-4" /> Descargar PDF
          </a>
        </Button>
      </div>
      {loading && <div className="flex flex-1 items-center justify-center text-muted-foreground">Cargando ficha...</div>}
      <div ref={containerRef} className="mx-auto w-full max-w-3xl space-y-4 p-3" />
    </div>
  );
};

export default FichaPublica;
