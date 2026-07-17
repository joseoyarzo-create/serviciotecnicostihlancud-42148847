import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FichaTecnica, Cliente, RepuestoFicha, Tecnico, EstadoFicha } from '@/types';
import { getClientes, saveCliente, saveFicha, generateId, getModelos, saveModelo, getFichaById, getConfigSistema, ConfigSistema, getNextFolio, getDespieceUrl, markFichaWhatsappNotificado } from '@/lib/cloudStorage';

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
import { CalendarIcon, FileText, Save, User, Wrench, FileDown, Printer, Award, Tag, BookOpen, CheckCircle2, AlertCircle, MessageCircle } from 'lucide-react';
import WhatsAppButton from '@/components/WhatsAppButton';
import { mensajeContactoRapido, mensajeEquipoListo, buildWhatsAppUrl } from '@/lib/whatsapp';
import { printThermalLabel } from '@/lib/thermalLabel';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
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
  const [modelosFull, setModelosFull] = useState<{ modelo: string; despieceUrl?: string | null }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(!!id);
  const [isSaving, setIsSaving] = useState(false);
  const [exportType, setExportType] = useState<'pdf' | 'print'>('pdf');

  // Wizard state (Paso 1 guardar → Paso 2 WhatsApp → Paso 3 PDF)
  const [savedFicha, setSavedFicha] = useState<FichaTecnica | null>(null);
  const [waOpened, setWaOpened] = useState(false);
  const [waConfirmed, setWaConfirmed] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [loadedNotified, setLoadedNotified] = useState(false);
  const [loadedNotifiedAt, setLoadedNotifiedAt] = useState<Date | null>(null);





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
        setLoadedNotified(!!ficha.whatsappNotificado);
        setLoadedNotifiedAt(ficha.whatsappNotificadoAt ?? null);

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
      setModelosFull(modelosData.map((m: any) => ({ modelo: m.modelo, despieceUrl: m.despieceUrl })));

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

  // PASO 1: guarda la orden y activa el asistente (Paso 2 → WhatsApp, Paso 3 → PDF).
  const handleSaveOrden = async () => {
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
    if (!clienteTelefono.trim()) {
      toast({
        title: 'Teléfono requerido',
        description: 'Debe registrar el teléfono del cliente para notificarlo por WhatsApp antes de imprimir la Orden.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const normalizedNombre = clienteNombre.trim().toUpperCase();
      const existingCliente = clientes.find(c => c.nombre.toUpperCase() === normalizedNombre);

      let cliente: Cliente;
      if (existingCliente) {
        cliente = { id: existingCliente.id, nombre: normalizedNombre, telefono: clienteTelefono };
      } else if (selectedClienteId) {
        cliente = { id: selectedClienteId, nombre: normalizedNombre, telefono: clienteTelefono };
      } else {
        cliente = { id: generateId(), nombre: normalizedNombre, telefono: clienteTelefono };
      }
      await saveCliente(cliente);

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
        whatsappNotificado: false,
        whatsappNotificadoAt: null,
      };

      await saveFicha(ficha);

      setSavedFicha(ficha);
      setWaOpened(false);
      setWaConfirmed(false);
      toast({ title: 'Orden guardada', description: 'Ahora notifica al cliente por WhatsApp para poder imprimir.' });
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Error', description: 'No se pudo guardar la orden', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // Enlace único de WhatsApp reutilizado en Paso 2 y en "volver a abrir"
  const waUrl = useMemo(() => {
    const f = savedFicha;
    if (!f || !f.cliente.telefono) return '';
    return buildWhatsAppUrl(
      f.cliente.telefono,
      mensajeEquipoListo(f.cliente.nombre, f.modeloMaquina, f.numeroServicio, f.repuestos)
    );
  }, [savedFicha]);

  const reopenWhatsapp = () => {
    if (!waUrl) return;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // Cuando el navegador vuelve a tomar foco después de abrir WhatsApp, pedir confirmación.
  const focusArmedRef = useRef(false);
  useEffect(() => {
    if (!waOpened || waConfirmed || !savedFicha) return;
    focusArmedRef.current = false;
    const t = setTimeout(() => { focusArmedRef.current = true; }, 800);
    const onFocus = () => {
      if (!focusArmedRef.current) return;
      setConfirmDialogOpen(true);
    };
    window.addEventListener('focus', onFocus);
    return () => {
      clearTimeout(t);
      window.removeEventListener('focus', onFocus);
    };
  }, [waOpened, waConfirmed, savedFicha]);

  const handleConfirmWhatsappSent = async () => {
    if (!savedFicha) return;
    try {
      const at = await markFichaWhatsappNotificado(savedFicha.id);
      setSavedFicha({ ...savedFicha, whatsappNotificado: true, whatsappNotificadoAt: at });
      setWaConfirmed(true);
      setConfirmDialogOpen(false);
      toast({ title: 'Cliente notificado', description: 'Ahora puedes generar el PDF.' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo registrar la notificación', variant: 'destructive' });
    }
  };

  const requireNotified = () => {
    if (!savedFicha?.whatsappNotificado) {
      toast({
        title: 'Notificación pendiente',
        description: 'Primero debes notificar al cliente por WhatsApp (Paso 2).',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const handleGeneratePdf = async () => {
    if (!savedFicha || !requireNotified()) return;
    setIsLoading(true);
    setExportType('pdf');
    try {
      await generatePdfDocument(savedFicha);
      toast({ title: 'Éxito', description: 'PDF generado' });
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Error al generar PDF', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintFicha = () => {
    if (!savedFicha || !requireNotified()) return;
    setExportType('print');
    try {
      printFicha(savedFicha);
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Error al imprimir', variant: 'destructive' });
    }
  };

  const handleNuevaOrden = async () => {
    setSavedFicha(null);
    setWaOpened(false);
    setWaConfirmed(false);
    if (!id) {
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
      await loadData();
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
                <Label className="input-label flex items-center justify-between gap-2">
                  <span>Modelo de Máquina *</span>
                  {(() => {
                    const found = modelosFull.find((m) => m.modelo === modeloMaquina);
                    if (found?.despieceUrl) {
                      return (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const url = await getDespieceUrl(found.despieceUrl!);
                              window.open(url, '_blank', 'noopener,noreferrer');
                            } catch {
                              toast({ title: 'No se pudo abrir el despiece', variant: 'destructive' });
                            }
                          }}
                          className="text-xs text-primary inline-flex items-center gap-1 underline font-normal"
                        >
                          <BookOpen className="h-3 w-3" /> Ver despiece
                        </button>
                      );
                    }
                    return null;
                  })()}
                </Label>
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

          {/* Botón principal + Etiqueta térmica */}
          <div className="flex flex-col sm:flex-row gap-3 animate-fade-in">
            <Button
              onClick={handleSaveOrden}
              disabled={isSaving || !!savedFicha}
              size="lg"
              className="flex-1 hover-lift"
            >
              <Save className="mr-2 h-5 w-5" />
              {isSaving ? 'Guardando...' : savedFicha ? '✔ Orden guardada' : 'Guardar Orden'}
            </Button>

            <Button
              type="button"
              onClick={() => {
                if (!numeroBoleta.trim() || !clienteNombre.trim() || !modeloMaquina.trim()) {
                  toast({ title: 'Datos incompletos', description: 'Boleta, cliente y modelo son requeridos para la etiqueta', variant: 'destructive' });
                  return;
                }
                printThermalLabel({
                  id: id || 'tmp',
                  numeroBoleta: numeroBoleta.trim(),
                  numeroServicio: numeroBoleta.trim(),
                  fechaIngreso,
                  fechaReparacion,
                  fechaEntrega,
                  cliente: { id: selectedClienteId || 'tmp', nombre: clienteNombre.toUpperCase(), telefono: clienteTelefono },
                  modeloMaquina,
                  numeroSerie,
                  tipoAveria,
                  repuestos,
                  servicios,
                  recomendaciones: '',
                  tecnico,
                  estado,
                });
              }}
              size="lg"
              variant="secondary"
              className="flex-1 hover-lift"
              title="Imprimir etiqueta 80mm (Epson TM-T20II)"
            >
              <Tag className="mr-2 h-5 w-5" />
              Etiqueta Térmica
            </Button>
          </div>

          {/* Asistente 3 pasos: Guardar → Notificar → PDF */}
          {savedFicha && (
            <section className="form-section animate-fade-in border-2 border-primary/30">
              <h2 className="form-section-title flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Asistente para imprimir la Orden
              </h2>

              <ol className="space-y-4">
                {/* PASO 1 */}
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">PASO 1 — Orden guardada</p>
                    <p className="text-sm text-muted-foreground">
                      N° {savedFicha.numeroServicio} · {savedFicha.cliente.nombre}
                    </p>
                  </div>
                </li>

                {/* PASO 2 */}
                <li className="flex items-start gap-3">
                  {savedFicha.whatsappNotificado ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">
                      PASO 2 — {savedFicha.whatsappNotificado ? 'Cliente notificado' : 'Notificar al cliente'}
                    </p>
                    {savedFicha.whatsappNotificado ? (
                      <p className="text-sm text-green-700">
                        ✔ Notificado el{' '}
                        {savedFicha.whatsappNotificadoAt
                          ? format(savedFicha.whatsappNotificadoAt, "dd/MM/yyyy HH:mm", { locale: es })
                          : ''}
                      </p>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground mb-2">
                          Antes de imprimir la Orden de Trabajo, debe notificar al cliente mediante WhatsApp.
                        </p>
                        <a
                          href={waUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setWaOpened(true)}
                          className="inline-flex items-center justify-center rounded-md bg-green-600 hover:bg-green-700 text-white h-11 px-6 text-base font-semibold"
                        >
                          <MessageCircle className="mr-2 h-5 w-5" />
                          {waOpened ? 'Volver a abrir WhatsApp' : 'Abrir WhatsApp'}
                        </a>
                        {waOpened && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Cuando vuelvas a la app te preguntaremos si el mensaje fue enviado.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </li>

                {/* PASO 3 */}
                <li className="flex items-start gap-3">
                  {savedFicha.whatsappNotificado ? (
                    <FileDown className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                  ) : (
                    <div className="h-6 w-6 rounded-full border-2 border-muted-foreground/40 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">PASO 3 — Generar PDF</p>
                    {!savedFicha.whatsappNotificado && (
                      <p className="text-sm text-muted-foreground mb-2">
                        (Bloqueado hasta confirmar el envío del WhatsApp)
                      </p>
                    )}
                    <div className="flex flex-col sm:flex-row gap-2 mt-2">
                      <Button
                        onClick={handleGeneratePdf}
                        disabled={!savedFicha.whatsappNotificado || isLoading}
                        size="lg"
                      >
                        <FileDown className="mr-2 h-5 w-5" />
                        {isLoading && exportType === 'pdf' ? 'Generando...' : 'Generar PDF'}
                      </Button>
                      <Button
                        onClick={handlePrintFicha}
                        disabled={!savedFicha.whatsappNotificado || isLoading}
                        size="lg"
                        variant="outline"
                      >
                        <Printer className="mr-2 h-5 w-5" />
                        Imprimir
                      </Button>
                      <Button
                        onClick={handleNuevaOrden}
                        size="lg"
                        variant="ghost"
                        className="sm:ml-auto"
                      >
                        {id ? 'Cerrar asistente' : 'Nueva Orden'}
                      </Button>
                    </div>
                  </div>
                </li>
              </ol>
            </section>
          )}
        </div>
      </main>

      {/* Diálogo de confirmación al volver del foco */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿El mensaje fue enviado correctamente?</DialogTitle>
            <DialogDescription>
              Confirma si enviaste el aviso al cliente por WhatsApp para habilitar la generación del PDF.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => { setConfirmDialogOpen(false); reopenWhatsapp(); }}>
              🔄 Volver a abrir WhatsApp
            </Button>
            <Button onClick={handleConfirmWhatsappSent}>
              ✅ Sí, continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>


  );
};

export default FichaTecnicaPage;
