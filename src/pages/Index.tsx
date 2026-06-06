import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FichaTecnica, EstadoFicha, ESTADOS_FICHA, estadoColor, estadoLabel } from '@/types';
import { getFichas, getRepuestos, getClientes, deleteFicha, updateFichaEstado, getModelos } from '@/lib/cloudStorage';

import { generatePdfDocument, printFicha } from '@/lib/generatePdf';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { FileText, Package, Users, Wrench, Plus, Download, Trash2, Clock, FileDown, Printer, Search, Edit, CheckCircle, RotateCcw, Zap, Bell, ChevronDown, ChevronUp } from 'lucide-react';
import { buildWhatsAppUrl, mensajeEquipoListo, mensajeRecordatorioRetiro } from '@/lib/whatsapp';
import stihlLogo from '@/assets/stihl-logo.jpg';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const WA_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const PendientesRetiro = ({ fichas }: { fichas: import('@/types').FichaTecnica[] }) => {
  const [open, setOpen] = useState(false);
  const hoy = new Date();

  const FECHA_CORTE = new Date('2026-05-20');
  const pendientes = fichas.filter((f) => {
    if (f.estado === 'ENTREGADA') return false;
    const ingreso = new Date(f.fechaIngreso);
    if (ingreso < FECHA_CORTE) return false;
    return differenceInDays(hoy, ingreso) >= 7;
  });

  if (pendientes.length === 0) return null;

  return (
    <section className="mb-8 animate-fade-in" style={{ animationDelay: '0.35s' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between rounded-xl border-2 border-orange-300 bg-orange-50 px-4 py-3 text-left hover:bg-orange-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-orange-600" />
          <span className="text-base font-bold text-orange-800">
            Recordatorios de Retiro Pendiente
          </span>
          <span className="bg-orange-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
            {pendientes.length}
          </span>
        </div>
        {open ? (
          <ChevronUp className="h-5 w-5 text-orange-600 shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-orange-600 shrink-0" />
        )}
      </button>

      {open && (
        <div className="border-2 border-t-0 border-orange-300 rounded-b-xl bg-orange-50 p-3 space-y-2">
          {pendientes.map((ficha) => {
            const dias = differenceInDays(hoy, new Date(ficha.fechaIngreso));
            return (
              <div
                key={ficha.id}
                className="bg-white rounded-lg px-3 py-2 flex flex-col sm:flex-row sm:items-center gap-2 border border-orange-200"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{ficha.cliente.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {ficha.modeloMaquina} · N° {ficha.numeroServicio} ·{' '}
                    <span className="text-orange-700 font-medium">
                      {dias} {dias === 1 ? 'día' : 'días'} en taller
                    </span>
                    {' '}(ingresó el {format(new Date(ficha.fechaIngreso), "d 'de' MMMM", { locale: es })})
                  </p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {ficha.cliente.telefono ? (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white gap-1.5 h-8 text-xs"
                      onClick={() => {
                        window.open(
                          buildWhatsAppUrl(
                            ficha.cliente.telefono,
                            mensajeRecordatorioRetiro(
                              ficha.cliente.nombre,
                              ficha.modeloMaquina,
                              ficha.numeroServicio,
                              dias,
                              ficha.repuestos
                            )
                          ),
                          '_blank',
                          'noopener,noreferrer'
                        );
                      }}
                    >
                      {WA_ICON}
                      Recordatorio
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground italic self-center">Sin teléfono</span>
                  )}
                  <Button size="sm" variant="outline" className="h-8" asChild>
                    <Link to={`/ficha-tecnica/${ficha.id}`}>
                      <Edit className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

const Index = () => {
  const { toast } = useToast();
  const [allFichas, setAllFichas] = useState<FichaTecnica[]>([]);
  const [fichas, setFichas] = useState<FichaTecnica[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ repuestos: 0, clientes: 0, fichas: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFichas(allFichas.slice(0, 10));
    } else {
      const filtered = allFichas.filter(f => 
        f.numeroBoleta.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.modeloMaquina.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFichas(filtered);
    }
  }, [searchTerm, allFichas]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allFichasData, repuestos, clientes] = await Promise.all([
        getFichas(),
        getRepuestos(),
        getClientes(),
      ]);
      setAllFichas(allFichasData);
      setFichas(allFichasData.slice(0, 10));
      setStats({
        repuestos: repuestos.length,
        clientes: clientes.length,
        fichas: allFichasData.length,
      });
    } catch (error) {
      console.error('Error loading data:', error);
      toast({ title: 'Error', description: 'Error al cargar datos', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (id: string, nuevoEstado: EstadoFicha) => {
    try {
      await updateFichaEstado(id, nuevoEstado);
      toast({ title: 'Estado actualizado', description: `Marcado como: ${estadoLabel(nuevoEstado)}` });
      await loadData();
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar el estado', variant: 'destructive' });
    }
  };


  const handleDownloadPdf = async (ficha: FichaTecnica) => {
    try {
      await generatePdfDocument(ficha);
      toast({ title: 'Éxito', description: 'PDF descargado' });
    } catch (error) {
      toast({ title: 'Error', description: 'Error al generar PDF', variant: 'destructive' });
    }
  };

  const handleExportData = async () => {
    try {
      const [allFichasData, repuestos, clientes, modelos] = await Promise.all([
        getFichas(),
        getRepuestos(),
        getClientes(),
        getModelos(),
      ]);

      const exportData = {
        fichas: allFichasData,
        repuestos,
        clientes,
        modelos,
        exportDate: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `respaldo_taller_stihl_${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: 'Éxito', description: 'Respaldo de datos generado y descargado' });
    } catch (error) {
      console.error('Error exportando datos:', error);
      toast({ title: 'Error', description: 'Error al exportar datos', variant: 'destructive' });
    }
  };

  const handlePrint = (ficha: FichaTecnica) => {
    try {
      printFicha(ficha);
      toast({ title: 'Éxito', description: 'Enviado a impresión' });
    } catch (error) {
      toast({ title: 'Error', description: 'Error al imprimir', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Está seguro de eliminar esta ficha?')) {
      try {
        await deleteFicha(id);
        await loadData();
        toast({ title: 'Éxito', description: 'Ficha eliminada' });
      } catch (error) {
        toast({ title: 'Error', description: 'Error al eliminar ficha', variant: 'destructive' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto py-8 px-4">
        {/* Hero Section */}
        <section className="text-center mb-12 animate-fade-in">
          <div className="flex justify-center mb-6">
            <img src={stihlLogo} alt="STIHL" className="h-24 object-contain" />
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
            STIHL ANCUD - Gestión de Taller
          </h1>
          <p className="text-xl text-muted-foreground mb-2">
            STIHL ANCUD - COMERCIAL SOTAVENTO LTDA.
          </p>
          <p className="text-muted-foreground">
            Pudeto 351 - Ancud | Fono Fax: 652622214
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportData} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Descargar Respaldo Completo (JSON)
            </Button>
          </div>
        </section>

        {/* Stats */}
        <section className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="form-section hover-lift animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm uppercase tracking-wide">Fichas Técnicas</p>
                <p className="text-4xl font-bold text-primary">{stats.fichas}</p>
              </div>
              <FileText className="h-12 w-12 text-primary/30" />
            </div>
          </div>
          
          <div className="form-section hover-lift animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm uppercase tracking-wide">Repuestos</p>
                <p className="text-4xl font-bold text-primary">{stats.repuestos}</p>
              </div>
              <Package className="h-12 w-12 text-primary/30" />
            </div>
          </div>
          
          <div className="form-section hover-lift animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm uppercase tracking-wide">Clientes</p>
                <p className="text-4xl font-bold text-primary">{stats.clientes}</p>
              </div>
              <Users className="h-12 w-12 text-primary/30" />
            </div>
          </div>
        </section>

        {/* Pendientes de Retiro */}
        <PendientesRetiro fichas={allFichas} />

        {/* Quick Actions */}
        <section className="grid md:grid-cols-3 gap-6 mb-12">
          <Link to="/ficha-rapida">
            <div className="form-section hover-lift cursor-pointer border-2 border-primary/20 hover:border-primary transition-colors animate-fade-in" style={{ animationDelay: '0.35s' }}>
              <div className="flex items-center gap-4">
                <div className="bg-primary rounded-full p-4">
                  <Zap className="h-8 w-8 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Ficha Rápida</h3>
                  <p className="text-muted-foreground">Crear ficha en segundos</p>
                </div>
              </div>
            </div>
          </Link>

          <Link to="/ficha-tecnica">
            <div className="form-section hover-lift cursor-pointer border-2 border-primary/20 hover:border-primary transition-colors animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center gap-4">
                <div className="bg-primary rounded-full p-4">
                  <Plus className="h-8 w-8 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Nueva Ficha Técnica</h3>
                  <p className="text-muted-foreground">Crear una nueva orden de servicio</p>
                </div>
              </div>
            </div>
          </Link>

          <Link to="/repuestos">
            <div className="form-section hover-lift cursor-pointer border-2 border-border hover:border-primary transition-colors animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <div className="flex items-center gap-4">
                <div className="bg-secondary rounded-full p-4">
                  <Wrench className="h-8 w-8 text-secondary-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Gestionar Repuestos</h3>
                  <p className="text-muted-foreground">Importar, agregar o editar repuestos</p>
                </div>
              </div>
            </div>
          </Link>
        </section>

        {/* Recent Fichas */}
        <section className="form-section animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h2 className="form-section-title flex items-center gap-2 mb-0">
              <Clock className="h-5 w-5" />
              {searchTerm ? 'Resultados de búsqueda' : 'Fichas Recientes'}
            </h2>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por boleta, cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">
              Cargando...
            </p>
          ) : fichas.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay fichas técnicas. ¡Crea la primera!
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="stihl-table">
                <thead>
                  <tr>
                    <th>Nº SERVICIO</th>
                    <th>CLIENTE</th>
                    <th>MODELO</th>
                    <th>FECHA</th>
                    <th>TÉCNICO</th>
                    <th>ESTADO</th>
                    <th>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {fichas.map((ficha) => (
                    <tr key={ficha.id}>
                      <td className="font-mono font-bold">{ficha.numeroServicio}</td>
                      <td>{ficha.cliente.nombre}</td>
                      <td>{ficha.modeloMaquina}</td>
                      <td>{format(ficha.fechaIngreso, 'dd/MM/yyyy', { locale: es })}</td>
                      <td>{ficha.tecnico}</td>
                      <td>
                        <Select
                          value={ficha.estado}
                          onValueChange={(v) => handleStatusChange(ficha.id, v as EstadoFicha)}
                        >
                          <SelectTrigger className={`h-8 w-[160px] text-xs font-semibold ${estadoColor(ficha.estado)}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ESTADOS_FICHA.map((e) => (
                              <SelectItem key={e.value} value={e.value}>
                                <span className="inline-flex items-center gap-2">
                                  <span className={`h-2 w-2 rounded-full ${e.color.split(' ')[0]}`} />
                                  {e.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td>
                        <div className="flex gap-1 flex-wrap">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Download className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to={`/ficha-tecnica/${ficha.id}`} className="flex items-center cursor-pointer">
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownloadPdf(ficha)}>
                                <FileDown className="mr-2 h-4 w-4" />
                                Descargar PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePrint(ficha)}>
                                <Printer className="mr-2 h-4 w-4" />
                                Imprimir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Button
                            size="sm"
                            variant="outline"
                            className={ficha.cliente.telefono
                              ? 'text-green-600 border-green-400 hover:bg-green-50 hover:text-green-700'
                              : 'text-gray-400 border-gray-300 cursor-not-allowed opacity-50'}
                            title={ficha.cliente.telefono
                              ? `Avisar a ${ficha.cliente.nombre} que su equipo está listo`
                              : 'El cliente no tiene teléfono registrado'}
                            onClick={() => {
                              if (!ficha.cliente.telefono) {
                                toast({ title: 'Sin teléfono', description: 'Este cliente no tiene teléfono registrado.', variant: 'destructive' });
                                return;
                              }
                              window.open(
                                buildWhatsAppUrl(
                                  ficha.cliente.telefono,
                                  mensajeEquipoListo(ficha.cliente.nombre, ficha.modeloMaquina, ficha.numeroServicio, ficha.repuestos)
                                ),
                                '_blank',
                                'noopener,noreferrer'
                              );
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(ficha.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-secondary text-secondary-foreground py-6 mt-12">
        <div className="container mx-auto text-center">
          <p className="text-sm">
            STIHL ANCUD - Sistema de Taller © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
