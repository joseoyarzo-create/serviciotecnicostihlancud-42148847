import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { Zap, Plus, Trash2, Search } from 'lucide-react';
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

const FichaRapida = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [repuestosList, setRepuestosList] = useState<Repuesto[]>([]);
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

  // Filtros de aire y carburadores seleccionados (con cantidad/precio editables)
  const [extraRepuestos, setExtraRepuestos] = useState<RepuestoFicha[]>([]);
  const [searchFiltro, setSearchFiltro] = useState('');
  const [searchCarb, setSearchCarb] = useState('');

  useEffect(() => {
    (async () => {
      const [clientesData, repuestosData, folio] = await Promise.all([
        getClientes(),
        getRepuestos(),
        getNextFolio(),
      ]);
      setClientes(clientesData);
      setRepuestosList(repuestosData);
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

  const filtrosAire = useMemo(() => {
    const q = searchFiltro.trim().toLowerCase();
    const base = repuestosList.filter(
      (r) => r.nombre.toLowerCase().includes('filtro') && r.nombre.toLowerCase().includes('aire')
    );
    if (!q) return base.slice(0, 50);
    return base.filter(
      (r) => r.nombre.toLowerCase().includes(q) || r.codigo.toLowerCase().includes(q)
    );
  }, [repuestosList, searchFiltro]);

  const carburadores = useMemo(() => {
    const q = searchCarb.trim().toLowerCase();
    const base = repuestosList.filter((r) => r.nombre.toLowerCase().includes('carburador'));
    if (!q) return base.slice(0, 50);
    return base.filter(
      (r) => r.nombre.toLowerCase().includes(q) || r.codigo.toLowerCase().includes(q)
    );
  }, [repuestosList, searchCarb]);

  const addExtra = (r: Repuesto) => {
    const existing = extraRepuestos.find((x) => x.id === r.id);
    if (existing) {
      setExtraRepuestos(
        extraRepuestos.map((x) => (x.id === r.id ? { ...x, cantidad: x.cantidad + 1 } : x))
      );
    } else {
      setExtraRepuestos([...extraRepuestos, { ...r, cantidad: 1 }]);
    }
  };
  const removeExtra = (id: string) =>
    setExtraRepuestos(extraRepuestos.filter((x) => x.id !== id));
  const updateCantidad = (id: string, cantidad: number) => {
    if (cantidad <= 0) return removeExtra(id);
    setExtraRepuestos(extraRepuestos.map((x) => (x.id === id ? { ...x, cantidad } : x)));
  };
  const updatePrecio = (id: string, precio: number) => {
    setExtraRepuestos(
      extraRepuestos.map((x) => (x.id === id ? { ...x, precioEditado: precio } : x))
    );
  };

  const buildRepuestos = (): RepuestoFicha[] => {
    const out: RepuestoFicha[] = [];
    const add = (codigo: string) => {
      const r = repuestosDb[codigo];
      if (r && !out.find((o) => o.id === r.id)) out.push({ ...r, cantidad: 1 });
    };
    if (filtroMezcla) add(FILTRO_MEZCLA_CODE);
    if (bujia) add(BUJIA_CODE);
    for (const e of extraRepuestos) {
      if (!out.find((o) => o.id === e.id)) out.push(e);
    }
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
      const existing = clientes.find((c) => c.nombre.toUpperCase() === normalizedNombre);
      const cliente: Cliente = {
        id: existing?.id || selectedClienteId || generateId(),
        nombre: normalizedNombre,
        telefono: clienteTelefono,
      };
      await saveCliente(cliente);

      const modelos = await getModelos();
      if (!modelos.find((m) => m.modelo === modeloMaquina)) {
        await saveModelo({ id: generateId(), modelo: modeloMaquina });
      }

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

  const ResultsList = ({
    items,
    emptyHint,
  }: {
    items: Repuesto[];
    emptyHint: string;
  }) => (
    <div className="max-h-72 overflow-y-auto border border-border rounded-lg bg-card">
      {items.length === 0 ? (
        <p className="p-3 text-center text-sm text-muted-foreground">{emptyHint}</p>
      ) : (
        items.map((r) => {
          const isAdded = extraRepuestos.some((x) => x.id === r.id);
          return (
            <div
              key={r.id}
              className="flex items-center justify-between gap-2 p-2 border-b border-border last:border-b-0 hover:bg-muted/30"
            >
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{r.nombre}</div>
                <div className="text-xs text-muted-foreground font-mono">
                  Cód: {r.codigo} · ${r.precio.toLocaleString('es-CL')}
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant={isAdded ? 'secondary' : 'default'}
                onClick={() => addExtra(r)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          );
        })
      )}
    </div>
  );

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
                    const match = clientes.find(
                      (c) => c.nombre.toUpperCase() === v.trim().toUpperCase()
                    );
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
                  {clientes.map((c) => <option key={c.id} value={c.nombre} />)}
                </datalist>
              </div>
              <div className="input-group">
                <Label className="input-label">Teléfono</Label>
                <Input value={clienteTelefono} onChange={(e) => setClienteTelefono(e.target.value)} />
              </div>
              <div className="input-group md:col-span-2">
                <Label className="input-label">Modelo de Máquina *</Label>
                <Input
                  value={modeloMaquina}
                  onChange={(e) => setModeloMaquina(e.target.value)}
                  placeholder="Ej: MS 250"
                />
              </div>
            </div>
          </section>

          {/* Servicios 1-5 */}
          <section className="form-section">
            <h2 className="form-section-title">Servicios Técnicos (1-5)</h2>
            <div className="grid gap-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <label
                  key={i}
                  className="flex items-center gap-3 p-2 border rounded hover:bg-muted/50 cursor-pointer"
                >
                  <Checkbox checked={serviciosSel[i]} onCheckedChange={() => toggleServicio(i)} />
                  <span className="font-medium">Servicio Técnico {i + 1}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Revisión se marca como SÍ automáticamente. Marcar = Reparación realizada.
            </p>
          </section>

          {/* Repuestos rápidos */}
          <section className="form-section">
            <h2 className="form-section-title">Repuestos Rápidos</h2>
            <div className="grid gap-3">
              <label className="flex items-center gap-3 p-3 border rounded hover:bg-muted/50 cursor-pointer">
                <Checkbox checked={filtroMezcla} onCheckedChange={() => setFiltroMezcla(!filtroMezcla)} />
                <div>
                  <div className="font-medium">Filtro de Mezcla</div>
                  <div className="text-xs text-muted-foreground font-mono">
                    Cód {FILTRO_MEZCLA_CODE} · {repuestosDb[FILTRO_MEZCLA_CODE]?.nombre || 'no encontrado'}
                    {repuestosDb[FILTRO_MEZCLA_CODE] &&
                      ` · $${repuestosDb[FILTRO_MEZCLA_CODE].precio.toLocaleString('es-CL')}`}
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border rounded hover:bg-muted/50 cursor-pointer">
                <Checkbox checked={bujia} onCheckedChange={() => setBujia(!bujia)} />
                <div>
                  <div className="font-medium">Bujía</div>
                  <div className="text-xs text-muted-foreground font-mono">
                    Cód {BUJIA_CODE} · {repuestosDb[BUJIA_CODE]?.nombre || 'no encontrado'}
                    {repuestosDb[BUJIA_CODE] &&
                      ` · $${repuestosDb[BUJIA_CODE].precio.toLocaleString('es-CL')}`}
                  </div>
                </div>
              </label>
            </div>
          </section>

          {/* Filtros de Aire */}
          <section className="form-section">
            <h2 className="form-section-title">Filtros de Aire (por máquina)</h2>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por máquina o código (ej: MS 250, FS 120, 1141...)"
                className="pl-10"
                value={searchFiltro}
                onChange={(e) => setSearchFiltro(e.target.value)}
              />
            </div>
            <ResultsList items={filtrosAire} emptyHint="No se encontraron filtros de aire" />
          </section>

          {/* Carburadores */}
          <section className="form-section">
            <h2 className="form-section-title">Carburadores (por máquina)</h2>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por máquina o código (ej: MS 250, FS 120, 11112...)"
                className="pl-10"
                value={searchCarb}
                onChange={(e) => setSearchCarb(e.target.value)}
              />
            </div>
            <ResultsList items={carburadores} emptyHint="No se encontraron carburadores" />
          </section>

          {/* Repuestos seleccionados */}
          {extraRepuestos.length > 0 && (
            <section className="form-section">
              <h2 className="form-section-title">Repuestos seleccionados</h2>
              <div className="overflow-x-auto">
                <table className="stihl-table">
                  <thead>
                    <tr>
                      <th className="w-20">CANT</th>
                      <th className="w-36">CÓDIGO</th>
                      <th>REPUESTO</th>
                      <th className="w-32">PRECIO UNIT.</th>
                      <th className="w-32">SUBTOTAL</th>
                      <th className="w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {extraRepuestos.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <Input
                            type="number"
                            min="1"
                            value={r.cantidad}
                            onChange={(e) => updateCantidad(r.id, parseInt(e.target.value) || 0)}
                            className="w-16 text-center"
                          />
                        </td>
                        <td className="font-mono text-xs">{r.codigo}</td>
                        <td>{r.nombre}</td>
                        <td>
                          <Input
                            type="number"
                            min="0"
                            value={r.precioEditado ?? r.precio}
                            onChange={(e) => updatePrecio(r.id, parseInt(e.target.value) || 0)}
                            className="w-28"
                          />
                        </td>
                        <td className="font-medium">
                          ${((r.precioEditado ?? r.precio) * r.cantidad).toLocaleString('es-CL')}
                        </td>
                        <td>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeExtra(r.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <Button size="lg" onClick={handleSubmit} disabled={isLoading} className="hover-lift">
            {isLoading ? 'Guardando...' : 'Crear Ficha'}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default FichaRapida;
