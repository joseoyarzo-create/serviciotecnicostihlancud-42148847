import { QRCodeCanvas } from 'qrcode.react';
import { useRef } from 'react';
import { QrCode, Copy, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { buildWhatsAppUrl } from '@/lib/whatsapp';

export const fichaPublicUrl = (token: string) => `${window.location.origin}/f/${token}`;

interface Props {
  token?: string;
  numeroBoleta: string;
  clienteNombre: string;
  clienteTelefono?: string;
  size?: 'sm' | 'default' | 'lg';
  label?: boolean;
  className?: string;
}

const FichaQrButton = ({ token, numeroBoleta, clienteNombre, clienteTelefono, size = 'sm', label = false, className }: Props) => {
  const { toast } = useToast();
  const wrapRef = useRef<HTMLDivElement>(null);
  if (!token) return null;
  const url = fichaPublicUrl(token);

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    toast({ title: 'Enlace copiado' });
  };
  const download = () => {
    const canvas = wrapRef.current?.querySelector('canvas');
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `QR ${numeroBoleta} ${clienteNombre}.png`;
    a.click();
  };
  const sendWa = () => {
    const msg = `Hola ${clienteNombre}, aquí puede ver la ficha técnica de su equipo (boleta N° ${numeroBoleta}): ${url}`;
    window.open(buildWhatsAppUrl(clienteTelefono || '', msg), '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" size={size} variant="outline" className={className} title="Ficha virtual (QR y enlace)">
          <QrCode className={label ? 'mr-2 h-5 w-5' : 'h-4 w-4'} />
          {label && 'Ficha Virtual / QR'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Ficha virtual N° {numeroBoleta}</DialogTitle>
        </DialogHeader>
        <div ref={wrapRef} className="flex justify-center rounded-md bg-background p-4">
          <QRCodeCanvas value={url} size={220} marginSize={2} level="M" />
        </div>
        <p className="break-all text-center text-xs text-muted-foreground">{url}</p>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={copy}><Copy className="mr-2 h-4 w-4" />Copiar</Button>
          <Button variant="outline" onClick={download}><Download className="mr-2 h-4 w-4" />Descargar QR</Button>
          <Button variant="outline" onClick={() => window.open(url, '_blank')}><ExternalLink className="mr-2 h-4 w-4" />Abrir</Button>
          <Button variant="outline" onClick={sendWa} disabled={!clienteTelefono}>WhatsApp</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FichaQrButton;
