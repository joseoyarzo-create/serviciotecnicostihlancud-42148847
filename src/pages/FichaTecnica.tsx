import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FichaTecnica, Cliente, RepuestoFicha, Tecnico, EstadoFicha } from '@/types';
import { getClientes, saveCliente, saveFicha, generateId, getModelos, saveModelo, getFichaById, getConfigSistema, ConfigSistema, getNextFolio } from '@/lib/cloudStorage';

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
import { CalendarIcon, FileText, Save, User, Wrench, FileDown, Printer, Award } from 'lucide-react';
import WhatsAppButton from '@/components/WhatsAppButton';
import { mensajeContactoRapido } from '@/lib/whatsapp';
import { cn } from '@/lib/utils';

const BenefitBadge = ({ label, achieved }: { label: string; achieved: boolean }) => (
  <div className={cn(
    "flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold border transition-colors",
    achieved 
      ? "bg-green-100 border-green-300 text-green-700" 
      : "bg-gray-50 border-gray-200 text-gray-400 opacity-50"
  )}>
    {achieved ? "✓" : "○"} {label}
  </div>
);

const FichaTecnicaPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [modelos, setModelos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(!!id);
  const [exportType, setExportType] = useState<'pdf' | 'print'>('pdf');

  // Form state
  const [numeroBoleta, setNumeroBoleta] = useState('');
  const [fechaIngreso, setFechaIngreso] = useState<Date>(new Date());
  const [fechaReparacion, setFechaReparacion] = useState<Date>(new Date());
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
  const [estado, setEstado] = useState<EstadoFicha>('TALLER');
  const [config, setConfig] = useState<ConfigSistema | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      const data = await getConfigSistema();
      setConfig(data);
    };
    loadConfig();
    loadData();
    if (id) {
      loadFicha(id);
    }
  }, [id]);

  const loadFicha = async (fichaId: string) => {
    try {
      const ficha = await getFichaById(fichaId);
      if (ficha) {
        setNumeroBoleta(ficha.numeroBoleta);
        setFechaIngreso(ficha.fechaIngreso);
        setFechaReparacion(ficha.fechaReparacion || new Date());
        setFechaEntrega(ficha.fechaEntrega);
        setClienteNombre(ficha.cliente.nombre);
        setClienteTelefono(ficha.cliente.telefono);
        setSelectedClienteId(ficha.cliente.id);
        setModeloMaquina(ficha.modeloMaquina);
        setNumeroSerie(ficha.numeroSerie);
        setTipoAveria(ficha.tipoAveria);
        setRepuestos(ficha.repuestos);
        setServicios(ficha.servicios.length > 0 ? ficha.servicios : DEFAULT_SERVICIOS);
        setTecnico(ficha.tecnico);
        setEstado(ficha.estado || 'TALLER');
      } else {
        toast({ title: 'Error', description: 'Ficha no encontrada', variant: 'destructive' });
        navigate('/');
      }
    } catch (error) {
      console.error('Error loading ficha:', error);
      toast({ title: 'Error', description: 'Error al cargar la ficha', variant: 'destructive' });
    } finally {
      setIsFetching(false);
    }
  };

  const loadData = async () => {
    try {
      const promises: Promise<any>[] = [
        getClientes(),
        getModelos(),
      ];

      if (!id) {
        promises.push(getNextFolio());
      }

      const results = await Promise.all(promises);
      const clientesData = results[0];
      const modelosData = results[1];
      
      setClientes(clientesData);
      setModelos(modelosData.map((m: any) => m.modelo));

      if (!id && results[2]) {
        setNumeroBoleta(results[2]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({ title: 'Error', description: 'Error al cargar datos', variant: 'destructive' });
    }
  };

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

  const handleSubmit = async (type: 'pdf' | 'print') => {
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
      
      // Intentamos normalizar el nombre para la búsqueda
      const normalizedNombre = clienteNombre.trim().toUpperCase();
      const existingCliente = clientes.find(c => c.nombre.toUpperCase() === normalizedNombre);

      if (existingCliente) {
        cliente = { id: existingCliente.id, nombre: normalizedNombre, telefono: clienteTelefono };
      } else if (selectedClienteId) {
        cliente = { id: selectedClienteId, nombre: normalizedNombre, telefono: clienteTelefono };
      } else {
        cliente = { id: generateId(), nombre: normalizedNombre, telefono: clienteTelefono };
      }
      
      await saveCliente(cliente);

      // Save modelo if new
      if (!modelos.includes(modeloMaquina)) {
        await saveModelo({ id: generateId(), modelo: modeloMaquina });
      }

      const ficha: FichaTecnica = {
        id: id || generateId(),
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
        recomendaciones: 'REPARACIÓN GARANTIZADA POR 20 DÍAS DE LA FECHA DE RETIRO',
        tecnico,
        fechaEntrega,
        estado,
      };

      await saveFicha(ficha);

      // Generate document based on type
      if (type === 'pdf') {
        await generatePdfDocument(ficha);
        toast({ title: 'Éxito', description: `Ficha ${id ? 'actualizada' : 'guardada'} y PDF generado` });
      } else {
        printFicha(ficha);
        toast({ title: 'Éxito', description: `Ficha ${id ? 'actualizada' : 'guardada'} y enviada a impresión` });
      }

      // If we are editing, we don't necessarily want to reset the form, maybe just refresh data or stay there
      if (!id) {
        // Reset form only if creating new
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
        setFechaReparacion(new Date());
        setFechaEntrega(null);
        setEstado('TALLER');
      }
      
      // Refresh data
      await loadData();
      if (id) {
        // Optionally redirect back or stay
        // navigate('/'); 
      }
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Error', description: 'Error al generar el documento', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Cargando ficha...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto py-8 px-4">
        <div className="flex items-center gap-3 mb-8">
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-heading font-bold">{id ? 'Editar Ficha Técnica' : 'Nueva Ficha Técnica'}</h1>
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
                <Label className="input-label">Fecha de Reparación (automática)</Label>
                <Input 
                  value={format(fechaReparacion, 'dd/MM/yyyy', { locale: es })} 
                  disabled 
                  className="bg-muted" 
                />
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
                  list="clientes-list"
                  value={clienteNombre}
                  onChange={(e) => {
                    const value = e.target.value;
                    setClienteNombre(value);
                    const match = clientes.find(
                      (c) => c.nombre.toUpperCase() === value.trim().toUpperCase()
                    );
                    if (match) {
                      setSelectedClienteId(match.id);
                      setClienteTelefono(match.telefono || '');
                    } else {
                      setSelectedClienteId(null);
                    }
                  }}
                  placeholder="Nombre del cliente"
                />
                <datalist id="clientes-list">
                  {clientes.map((c) => (
                    <option key={c.id} value={c.nombre} />
                  ))}
                </datalist>
              </div>

              <div className="input-group">
                <Label className="input-label">Teléfono</Label>
                <div className="flex gap-2">
                  <Input
                    value={clienteTelefono}
                    onChange={(e) => setClienteTelefono(e.target.value)}
                    placeholder="+56 9 1234 5678"
                    className="flex-1"
                  />
                  {clienteTelefono && clienteTelefono.replace(/\D/g, '').length >= 7 && (
                    <WhatsAppButton
                      phone={clienteTelefono}
                      message={mensajeContactoRapido(clienteNombre || 'cliente')}
                      label="Contactar"
                      showLabel={false}
                      size="sm"
                      className="shrink-0"
                    />
                  )}
                </div>
              </div>

              {config?.sistema_puntos_activo && selectedClienteId && (
                <div className="input-group">
                  <Label className="input-label">Fidelización y Beneficios</Label>
                  <div className="flex flex-col gap-3 p-3 bg-orange-50 border border-orange-200 rounded-md">
                    {/* Header Puntos y Nivel */}
                    <div className="flex items-center justify-between text-orange-700 font-bold">
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        <span>{clientes.find(c => c.id === selectedClienteId)?.puntos || 0} Puntos</span>
                      </div>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {(clientes.find(c => c.id === selectedClienteId)?.puntos || 0) >= config.puntos_meta_diamante ? (
                          <span className="text-[9px] bg-blue-600 text-white px-2 py-0.5 rounded-full animate-pulse">DIAMANTE</span>
                        ) : (clientes.find(c => c.id === selectedClienteId)?.puntos || 0) >= config.puntos_meta_oro ? (
                          <span className="text-[9px] bg-yellow-500 text-white px-2 py-0.5 rounded-full animate-pulse">ORO</span>
                        ) : (clientes.find(c => c.id === selectedClienteId)?.puntos || 0) >= config.puntos_meta_plata ? (
                          <span className="text-[9px] bg-slate-400 text-white px-2 py-0.5 rounded-full">PLATA</span>
                        ) : null}
                      </div>
                    </div>
                    
                    {/* Barra de Progreso Principal (Próximo Nivel) */}
                    <div className="space-y-1">
                      <div className="w-full bg-orange-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-orange-500 h-full transition-all duration-500" 
                          style={{ 
                            width: `${Math.min(((clientes.find(c => c.id === selectedClienteId)?.puntos || 0) / config.puntos_meta_oro) * 100, 100)}%` 
                          }}
                        />
                      </div>
                    </div>

                    {/* Beneficios Disponibles */}
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <BenefitBadge 
                        label="Afilado Gratis" 
                        achieved={(clientes.find(c => c.id === selectedClienteId)?.puntos || 0) >= config.puntos_meta_afilado} 
                      />
                      <BenefitBadge 
                        label="Inspección 10 Pts" 
                        achieved={(clientes.find(c => c.id === selectedClienteId)?.puntos || 0) >= config.puntos_meta_inspeccion} 
                      />
                      <BenefitBadge 
                        label="Carburación Express" 
                        achieved={(clientes.find(c => c.id === selectedClienteId)?.puntos || 0) >= config.puntos_meta_carburacion} 
                      />
                      <BenefitBadge 
                        label="Aceite de Cadena" 
                        achieved={(clientes.find(c => c.id === selectedClienteId)?.puntos || 0) >= config.puntos_meta_aceite_cadena} 
                      />
                      <BenefitBadge 
                        label="Ultrasonido Gratis" 
                        achieved={(clientes.find(c => c.id === selectedClienteId)?.puntos || 0) >= config.puntos_meta_ultrasonido} 
                      />
                      <BenefitBadge 
                        label="Garantía 30 Días" 
                        achieved={(clientes.find(c => c.id === selectedClienteId)?.puntos || 0) >= config.puntos_meta_garantia_extendida} 
                      />
                    </div>
                    
                    {(clientes.find(c => c.id === selectedClienteId)?.puntos || 0) >= config.puntos_meta_diamante && (
                      <p className="text-[10px] text-blue-700 font-bold mt-1 text-center border-t border-blue-200 pt-1">
                        ✓ RETIRO Y ENTREGA GRATIS ACTIVADO
                      </p>
                    )}
                  </div>
                </div>
              )}
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

          {/* Técnico y Estado */}
          <section className="form-section animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <h2 className="form-section-title">Mecánico y Estado</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="input-group">
                <Label className="input-label">Mecánico *</Label>
                <Select value={tecnico} onValueChange={(value: Tecnico) => setTecnico(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione mecánico" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="JORGE">JORGE</SelectItem>
                    <SelectItem value="JEAN">JEAN</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="input-group">
                <Label className="input-label">Estado de la Máquina *</Label>
                <Select 
                  value={estado} 
                  onValueChange={(value: EstadoFicha) => {
                    setEstado(value);
                    if (value === 'ENTREGADA' && !fechaEntrega) {
                      setFechaEntrega(new Date());
                    } else if (value === 'TALLER') {
                      setFechaEntrega(null);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TALLER">EN TALLER</SelectItem>
                    <SelectItem value="ENTREGADA">ENTREGADA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* Garantía */}
          <section className="form-section animate-fade-in bg-primary/5 border-primary/20" style={{ animationDelay: '0.6s' }}>
            <p className="font-bold text-center text-lg">
              REPARACIÓN GARANTIZADA POR 20 DÍAS DE LA FECHA DE RETIRO
            </p>
          </section>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 animate-fade-in">
            <Button
              onClick={() => handleSubmit('pdf')}
              disabled={isLoading}
              size="lg"
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
