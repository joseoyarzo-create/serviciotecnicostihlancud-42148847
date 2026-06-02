import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { Zap } from 'lucide-react';
import {
  getClientes,
  getRepuestos,
  saveCliente,
  saveFicha,
  saveModelo,
  getModelos,
  generateId,
  getNextFolio,
} from '@/lib/cloudStorage';
import { DEFAULT_SERVICIOS } from '@/components/ServiciosTable';
import { Cliente, FichaTecnica, Repuesto, RepuestoFicha, Tecnico } from '@/types';

const FILTRO_MEZCLA_CODE = '00003503500';
const BUJIA_CODE = '00004007000';
const FILTRO_AIRE_MS250_CODE = '1111231201613';
const FILTRO_AIRE_FS120_CODE = '1141341410300';
const CARBURADOR_MS250_CODE = '1111231200631';
const CARBURADOR_FS120_CODE = '41341200613';

type MaquinaOpt = 'NONE' | 'MS250' | 'FS120';

const FichaRapida = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [repuestosDb, setRepuestosDb] = useState<Record<string, Repuesto>>({});
  const [numeroBoleta, setNumeroBoleta] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);
  const [modeloMaquina, setModeloMaquina] = useState('');
  const [tecnico, setTecnico] = useState<Tecnico>('JORGE');
  const [isLoading, setIsLoading] = useState(false);

  // Servicios 1-5
  const [serviciosSel, setServiciosSel] = useState<boolean[]>([false, false, false, false, false]);

  // Repuestos rápidos
  const [filtroMezcla, setFiltroMezcla] = useState(false);
  const [bujia, setBujia] = useState(false);
  const [filtroAire, setFiltroAire] = useState<MaquinaOpt>('NONE');
  const [carburador, setCarburador] = useState<MaquinaOpt>('NONE');

  useEffect(() => {
    (async () => {
      const [clientesData, repuestosData, folio] = await Promise.all([
        getClientes(),
        getRepuestos(),
        getNextFolio(),
      ]);
      setClientes(clientesData);
      const map: Record<string, Repuesto> = {};
      for (const r of repuestosData) map[r.codigo] = r;
      setRepuestosDb(map);
      setNumeroBoleta(folio);
    })();
  }, []);

  const toggleServicio = (i: number) => {
    const next = [...serviciosSel];
    next[i] = !next[i];
    setServiciosSel(next);
  };

  const buildRepuestos = (): RepuestoFicha[] => {
    const out: RepuestoFicha[] = [];
    const add = (codigo: string) => {
      const r = repuestosDb[codigo];
      if (r) out.push({ ...r, cantidad: 1 });
    };
    if (filtroMezcla) add(FILTRO_MEZCLA_CODE);
    if (bujia) add(BUJIA_CODE);
    if (filtroAire === 'MS250') add(FILTRO_AIRE_MS250_CODE);
    if (filtroAire === 'FS120') add(FILTRO_AIRE_FS120_CODE);
    if (carburador === 'MS250') add(CARBURADOR_MS250_CODE);
    if (carburador === 'FS120') add(CARBURADOR_FS120_CODE);
    return out;
  };

  const handleSubmit = async () => {
    if (!numeroBoleta.trim()) {
      toast({ title: 'Error', description: 'Falta número de boleta', variant: 'destructive' });
      return;
    }
    if (!clienteNombre.trim()) {
      toast({ title: 'Error', description: 'Falta nombre de cliente', variant: 'destructive' });
      return;
    }
    if (!modeloMaquina.trim()) {
      toast({ title: 'Error', description: 'Falta modelo de máquina', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const normalizedNombre = clienteNombre.trim().toUpperCase();
      const existing = clientes.find(c => c.nombre.toUpperCase() === normalizedNombre);
      const cliente: Cliente = {
        id: existing?.id || selectedClienteId || generateId(),
        nombre: normalizedNombre,
        telefono: clienteTelefono,
      };
      await saveCliente(cliente);

      // Save modelo si nuevo
      const modelos = await getModelos();
      if (!modelos.find(m => m.modelo === modeloMaquina)) {
        await saveModelo({ id: generateId(), modelo: modeloMaquina });
      }

      // Servicios: marca revisión SÍ siempre, reparación según selección 1-5
      const servicios = DEFAULT_SERVICIOS.map((s, idx) => ({
        ...s,
        revision: true,
        reparacion: idx < 5 ? serviciosSel[idx] : false,
      }));

      const today = new Date();
      const ficha: FichaTecnica = {
        id: generateId(),
        numeroBoleta: numeroBoleta.trim(),
        numeroServicio: numeroBoleta.trim(),
        fechaIngreso: today,
        fechaReparacion: today,
        fechaEntrega: null,
        cliente,
        modeloMaquina,
        numeroSerie: '',
        tipoAveria: '',
        repuestos: buildRepuestos(),
        servicios,
        recomendaciones: 'REPARACIÓN GARANTIZADA POR 20 DÍAS DE LA FECHA DE RETIRO',
        tecnico,
        estado: 'TALLER',
      };

      await saveFicha(ficha);
      toast({ title: 'Ficha creada', description: `Boleta ${ficha.numeroBoleta} guardada.` });
      navigate('/');
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'No se pudo guardar la ficha', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-8 px-4 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Zap className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-heading font-bold">Ficha Rápida</h1>
        </div>

        <div className="grid gap-6">
          {/* Datos básicos */}
          <section className="form-section">
            <h2 className="form-section-title">Datos básicos</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="input-group">
                <Label className="input-label">Nº Boleta *</Label>
                <Input value={numeroBoleta} onChange={(e) => setNumeroBoleta(e.target.value)} />
              </div>
              <div className="input-group">
                <Label className="input-label">Mecánico *</Label>
                <Select value={tecnico} onValueChange={(v: Tecnico) => setTecnico(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="JORGE">JORGE</SelectItem>
                    <SelectItem value="JEAN">JEAN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="input-group">
                <Label className="input-label">Cliente *</Label>
                <Input
                  list="rapida-clientes"
                  value={clienteNombre}
                  onChange={(e) => {
                    const v = e.target.value;
                    setClienteNombre(v);
                    const match = clientes.find(c => c.nombre.toUpperCase() === v.trim().toUpperCase());
                    if (match) {
                      setSelectedClienteId(match.id);
                      setClienteTelefono(match.telefono || '');
                    } else {
                      setSelectedClienteId(null);
                    }
                  }}
                  placeholder="Nombre"
                />
                <datalist id="rapida-clientes">
                  {clientes.map(c => <option key={c.id} value={c.nombre} />)}
                </datalist>
              </div>
              <div className="input-group">
                <Label className="input-label">Teléfono</Label>
                <Input value={clienteTelefono} onChange={(e) => setClienteTelefono(e.target.value)} />
              </div>
              <div className="input-group md:col-span-2">
                <Label className="input-label">Modelo de Máquina *</Label>
                <Input value={modeloMaquina} onChange={(e) => setModeloMaquina(e.target.value)} placeholder="Ej: MS 250" />
              </div>
            </div>
          </section>

          {/* Servicios 1-5 */}
          <section className="form-section">
            <h2 className="form-section-title">Servicios Técnicos (1-5)</h2>
            <div className="grid gap-2">
              {DEFAULT_SERVICIOS.slice(0, 5).map((s, i) => (
                <label key={i} className="flex items-center gap-3 p-2 border rounded hover:bg-muted/50 cursor-pointer">
                  <Checkbox checked={serviciosSel[i]} onCheckedChange={() => toggleServicio(i)} />
                  <span className="font-medium">Servicio Técnico {i + 1}: {s.nombre}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Revisión se marca como SÍ automáticamente. Marcar = Reparación realizada.</p>
          </section>

          {/* Repuestos rápidos */}
          <section className="form-section">
            <h2 className="form-section-title">Repuestos Rápidos</h2>
            <div className="grid gap-3">
              <label className="flex items-center gap-3 p-3 border rounded hover:bg-muted/50 cursor-pointer">
                <Checkbox checked={filtroMezcla} onCheckedChange={() => setFiltroMezcla(!filtroMezcla)} />
                <div>
                  <div className="font-medium">Filtro de Mezcla</div>
                  <div className="text-xs text-muted-foreground">Código {FILTRO_MEZCLA_CODE} — {repuestosDb[FILTRO_MEZCLA_CODE]?.nombre || 'no encontrado'}</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border rounded hover:bg-muted/50 cursor-pointer">
                <Checkbox checked={bujia} onCheckedChange={() => setBujia(!bujia)} />
                <div>
                  <div className="font-medium">Bujía</div>
                  <div className="text-xs text-muted-foreground">Código {BUJIA_CODE} — {repuestosDb[BUJIA_CODE]?.nombre || 'no encontrado'}</div>
                </div>
              </label>

              <div className="p-3 border rounded">
                <Label className="input-label mb-2 block">Filtro de Aire</Label>
                <Select value={filtroAire} onValueChange={(v: MaquinaOpt) => setFiltroAire(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">— No incluir —</SelectItem>
                    <SelectItem value="MS250">MS 250</SelectItem>
                    <SelectItem value="FS120">FS 120</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 border rounded">
                <Label className="input-label mb-2 block">Carburador</Label>
                <Select value={carburador} onValueChange={(v: MaquinaOpt) => setCarburador(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">— No incluir —</SelectItem>
                    <SelectItem value="MS250">MS 250</SelectItem>
                    <SelectItem value="FS120">FS 120</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <Button size="lg" onClick={handleSubmit} disabled={isLoading} className="hover-lift">
            {isLoading ? 'Guardando...' : 'Crear Ficha'}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default FichaRapida;
