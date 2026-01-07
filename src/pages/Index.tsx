import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FichaTecnica } from '@/types';
import { getFichas, getRepuestos, getClientes, deleteFicha } from '@/lib/cloudStorage';
import { generateWordDocument } from '@/lib/generateWord';
import { generatePdfDocument, printFicha } from '@/lib/generatePdf';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { FileText, Package, Users, Wrench, Plus, Download, Trash2, Clock, FileDown, Printer } from 'lucide-react';
import stihlLogo from '@/assets/stihl-logo.jpg';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Index = () => {
  const { toast } = useToast();
  const [fichas, setFichas] = useState<FichaTecnica[]>([]);
  const [stats, setStats] = useState({ repuestos: 0, clientes: 0, fichas: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allFichas, repuestos, clientes] = await Promise.all([
        getFichas(),
        getRepuestos(),
        getClientes(),
      ]);
      setFichas(allFichas.slice(0, 5));
      setStats({
        repuestos: repuestos.length,
        clientes: clientes.length,
        fichas: allFichas.length,
      });
    } catch (error) {
      console.error('Error loading data:', error);
      toast({ title: 'Error', description: 'Error al cargar datos', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadWord = async (ficha: FichaTecnica) => {
    try {
      await generateWordDocument(ficha);
      toast({ title: 'Éxito', description: 'Documento Word descargado' });
    } catch (error) {
      toast({ title: 'Error', description: 'Error al generar documento', variant: 'destructive' });
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
            Sistema de Taller
          </h1>
          <p className="text-xl text-muted-foreground mb-2">
            STIHL ANCUD - COMERCIAL SOTAVENTO LTDA.
          </p>
          <p className="text-muted-foreground">
            Pudeto 351 - Ancud | Fono Fax: 652622214
          </p>
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

        {/* Quick Actions */}
        <section className="grid md:grid-cols-2 gap-6 mb-12">
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
          <h2 className="form-section-title flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Fichas Recientes
          </h2>
          
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
                        <div className="flex gap-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Download className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleDownloadWord(ficha)}>
                                <FileText className="mr-2 h-4 w-4" />
                                Descargar Word
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
