import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FichaTecnica, Cliente, RepuestoFicha, Tecnico } from '@/types';
import { getClientes, saveCliente, saveFicha, generateId, getNextNumero, incrementContador, getModelos, saveModelo } from '@/lib/storage';
import { generateWordDocument } from '@/lib/generateWord';
import { generatePdfDocument, printFicha } from '@/lib/generatePdf';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import RepuestosSelector from '@/components/RepuestosSelector';
import ServiciosTable, { DEFAULT_SERVICIOS } from '@/components/ServiciosTable';
import { CalendarIcon, FileText, Save, User, Wrench, FileDown, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';

const FichaTecnicaPage = () => {
  const { toast } = useToast();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [modelos, setModelos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [exportType, setExportType] = useState<'word' | 'pdf' | 'print'>('word');

  // Form state
  const [numeroBoleta, setNumeroBoleta] = useState('');
  const [fechaIngreso, setFechaIngreso] = useState<Date>(new Date());
  const [fechaReparacion, setFechaReparacion] = useState<Date | null>(null);
  const [fechaEntrega, setFechaEntrega] = useState<Date | null>(null);
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);
  const [modeloMaquina, setModeloMaquina] = useState('');
  const [numeroSerie, setNumeroSerie] = useState('');
  const [tipoAveria, setTipoAveria] = useState('');
  const [repuestos, setRepuestos] = useState<RepuestoFicha[]>([]);
  const [servicios, setServicios] = useState(DEFAULT_SERVICIOS);
  const [tecnico, setTecnico] = useState<Tecnico>('JORGE');

  useEffect(() => {
    setClientes(getClientes());
    setModelos(getModelos().map((m) => m.modelo));
  }, []);

  const handleClienteSelect = (clienteId: string) => {
    if (clienteId === 'nuevo') {
      setSelectedClienteId(null);
      setClienteNombre('');
      setClienteTelefono('');
      return;
    }
    const cliente = clientes.find((c) => c.id === clienteId);
    if (cliente) {
      setSelectedClienteId(cliente.id);
      setClienteNombre(cliente.nombre);
      setClienteTelefono(cliente.telefono);
    }
  };

  const handleModeloSelect = (modelo: string) => {
    if (modelo === 'nuevo') {
      setModeloMaquina('');
      return;
    }
    setModeloMaquina(modelo);
  };

  const handleSubmit = async (type: 'word' | 'pdf' | 'print') => {
    if (!numeroBoleta.trim()) {
      toast({ title: 'Error', description: 'El número de boleta es requerido', variant: 'destructive' });
      return;
    }
    if (!clienteNombre.trim()) {
      toast({ title: 'Error', description: 'El nombre del cliente es requerido', variant: 'destructive' });
      return;
    }
    if (!modeloMaquina.trim()) {
      toast({ title: 'Error', description: 'El modelo de máquina es requerido', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    setExportType(type);

    try {
      // Save cliente
      let cliente: Cliente;
      if (selectedClienteId) {
        cliente = { id: selectedClienteId, nombre: clienteNombre, telefono: clienteTelefono };
      } else {
        cliente = { id: generateId(), nombre: clienteNombre, telefono: clienteTelefono };
      }
      saveCliente(cliente);

      // Save modelo if new
      if (!modelos.includes(modeloMaquina)) {
        saveModelo({ id: generateId(), modelo: modeloMaquina });
      }

      const ficha: FichaTecnica = {
        id: generateId(),
        numeroBoleta: numeroBoleta.trim(),
        numeroServicio: numeroBoleta.trim(),
        fechaIngreso,
        fechaReparacion,
        cliente,
        modeloMaquina,
        numeroSerie,
        tipoAveria,
        repuestos,
        servicios,
        recomendaciones: 'REPARACIÓN GARANTIZADA POR 10 DÍAS DE LA FECHA DE RETIRO',
        tecnico,
        fechaEntrega,
      };

      saveFicha(ficha);

      // Generate document based on type
      if (type === 'word') {
        await generateWordDocument(ficha);
        toast({ title: 'Éxito', description: 'Ficha guardada y documento Word generado' });
      } else if (type === 'pdf') {
        await generatePdfDocument(ficha);
        toast({ title: 'Éxito', description: 'Ficha guardada y PDF generado' });
      } else {
        printFicha(ficha);
        toast({ title: 'Éxito', description: 'Ficha guardada y enviada a impresión' });
      }

      // Reset form
      setNumeroBoleta('');
      setClienteNombre('');
      setClienteTelefono('');
      setSelectedClienteId(null);
      setModeloMaquina('');
      setNumeroSerie('');
      setTipoAveria('');
      setRepuestos([]);
      setServicios(DEFAULT_SERVICIOS);
      setFechaIngreso(new Date());
      setFechaReparacion(null);
      setFechaEntrega(null);
      
      // Refresh clientes
      setClientes(getClientes());
      setModelos(getModelos().map((m) => m.modelo));
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Error', description: 'Error al generar el documento', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto py-8 px-4">
        <div className="flex items-center gap-3 mb-8">
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-heading font-bold">Nueva Ficha Técnica</h1>
        </div>

        <div className="grid gap-6">
          {/* Datos del Servicio */}
          <section className="form-section animate-fade-in">
            <h2 className="form-section-title flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Datos del Servicio
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="input-group">
                <Label className="input-label">Nº Boleta *</Label>
                <Input
                  value={numeroBoleta}
                  onChange={(e) => setNumeroBoleta(e.target.value)}
                  placeholder="Ej: 12345"
                />
              </div>
              
              <div className="input-group">
                <Label className="input-label">Nº Servicio (automático)</Label>
                <Input value={numeroBoleta || '-'} disabled className="bg-muted" />
              </div>

              <div className="input-group">
                <Label className="input-label">Fecha de Ingreso</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !fechaIngreso && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fechaIngreso ? format(fechaIngreso, 'dd/MM/yyyy', { locale: es }) : 'Seleccionar'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={fechaIngreso}
                      onSelect={(date) => date && setFechaIngreso(date)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="input-group">
                <Label className="input-label">Fecha de Reparación</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !fechaReparacion && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fechaReparacion ? format(fechaReparacion, 'dd/MM/yyyy', { locale: es }) : 'Seleccionar'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={fechaReparacion ?? undefined}
                      onSelect={(date) => setFechaReparacion(date ?? null)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="input-group">
                <Label className="input-label">Fecha de Entrega</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !fechaEntrega && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fechaEntrega ? format(fechaEntrega, 'dd/MM/yyyy', { locale: es }) : 'Seleccionar'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={fechaEntrega ?? undefined}
                      onSelect={(date) => setFechaEntrega(date ?? null)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </section>

          {/* Datos del Cliente */}
          <section className="form-section animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <h2 className="form-section-title flex items-center gap-2">
              <User className="h-5 w-5" />
              Datos del Cliente
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="input-group">
                <Label className="input-label">Cliente existente</Label>
                <Select onValueChange={handleClienteSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar o nuevo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nuevo">+ Nuevo cliente</SelectItem>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre} - {c.telefono}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="input-group">
                <Label className="input-label">Nombre *</Label>
                <Input
                  value={clienteNombre}
                  onChange={(e) => setClienteNombre(e.target.value)}
                  placeholder="Nombre del cliente"
                />
              </div>

              <div className="input-group">
                <Label className="input-label">Teléfono</Label>
                <Input
                  value={clienteTelefono}
                  onChange={(e) => setClienteTelefono(e.target.value)}
                  placeholder="+56 9 1234 5678"
                />
              </div>
            </div>
          </section>

          {/* Datos del Equipo */}
          <section className="form-section animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h2 className="form-section-title flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Datos del Equipo
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="input-group">
                <Label className="input-label">Modelo existente</Label>
                <Select onValueChange={handleModeloSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar o nuevo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nuevo">+ Nuevo modelo</SelectItem>
                    {modelos.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="input-group">
                <Label className="input-label">Modelo de Máquina *</Label>
                <Input
                  value={modeloMaquina}
                  onChange={(e) => setModeloMaquina(e.target.value)}
                  placeholder="Ej: MS 170"
                />
              </div>

              <div className="input-group">
                <Label className="input-label">Número de Serie</Label>
                <Input
                  value={numeroSerie}
                  onChange={(e) => setNumeroSerie(e.target.value)}
                  placeholder="Número de serie"
                />
              </div>

              <div className="input-group">
                <Label className="input-label">Tipo de Avería</Label>
                <Textarea
                  value={tipoAveria}
                  onChange={(e) => setTipoAveria(e.target.value)}
                  placeholder="Describa el problema..."
                  rows={2}
                />
              </div>
            </div>
          </section>

          {/* Repuestos */}
          <section className="form-section animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <h2 className="form-section-title">Repuestos Utilizados</h2>
            <RepuestosSelector
              selectedRepuestos={repuestos}
              onRepuestosChange={setRepuestos}
            />
          </section>

          {/* Servicios */}
          <section className="form-section animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <h2 className="form-section-title">Servicios Realizados</h2>
            <ServiciosTable
              servicios={servicios}
              onServiciosChange={setServicios}
            />
          </section>

          {/* Técnico */}
          <section className="form-section animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <h2 className="form-section-title">Mecánico Encargado</h2>
            <RadioGroup
              value={tecnico}
              onValueChange={(value) => setTecnico(value as Tecnico)}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="JORGE" id="jorge" />
                <Label htmlFor="jorge" className="cursor-pointer font-medium">JORGE</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="JEAN" id="jean" />
                <Label htmlFor="jean" className="cursor-pointer font-medium">JEAN</Label>
              </div>
            </RadioGroup>
          </section>

          {/* Garantía */}
          <section className="form-section animate-fade-in bg-primary/5 border-primary/20" style={{ animationDelay: '0.6s' }}>
            <p className="font-bold text-center text-lg">
              REPARACIÓN GARANTIZADA POR 10 DÍAS DE LA FECHA DE RETIRO
            </p>
          </section>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 animate-fade-in">
            <Button
              onClick={() => handleSubmit('word')}
              disabled={isLoading}
              size="lg"
              className="flex-1 hover-lift"
            >
              <Save className="mr-2 h-5 w-5" />
              {isLoading && exportType === 'word' ? 'Generando...' : 'Guardar y Word'}
            </Button>
            
            <Button
              onClick={() => handleSubmit('pdf')}
              disabled={isLoading}
              size="lg"
              variant="secondary"
              className="flex-1 hover-lift"
            >
              <FileDown className="mr-2 h-5 w-5" />
              {isLoading && exportType === 'pdf' ? 'Generando...' : 'Guardar y PDF'}
            </Button>
            
            <Button
              onClick={() => handleSubmit('print')}
              disabled={isLoading}
              size="lg"
              variant="outline"
              className="flex-1 hover-lift"
            >
              <Printer className="mr-2 h-5 w-5" />
              {isLoading && exportType === 'print' ? 'Imprimiendo...' : 'Guardar e Imprimir'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FichaTecnicaPage;
