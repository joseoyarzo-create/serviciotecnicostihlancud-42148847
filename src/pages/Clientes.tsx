import { useState, useEffect, useMemo } from 'react';
import { Cliente, FichaTecnica } from '@/types';
import {
  getClientes,
  saveCliente,
  deleteCliente,
  generateId,
  getFichasByClienteNombre,
  findSimilarClientes,
  findDuplicateGroups,
  mergeClientes,
} from '@/lib/cloudStorage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { Users, Plus, Trash2, Search, Edit2, Check, X, FileText, Calendar, AlertTriangle, GitMerge, DollarSign } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const fmtCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(n);

const calcTotal = (f: FichaTecnica) =>
  f.repuestos.reduce((s, r) => s + (r.precioEditado ?? r.precio) * r.cantidad, 0);

const ClientesPage = () => {
  const { toast } = useToast();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // History
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [clientFichas, setClientFichas] = useState<FichaTecnica[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // New cliente form
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');

  // Edit form
  const [editNombre, setEditNombre] = useState('');
  const [editTelefono, setEditTelefono] = useState('');

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    setIsLoading(true);
    try {
      const data = await getClientes();
      setClientes(data);
    } catch (error) {
      console.error('Error loading clientes:', error);
      toast({ title: 'Error', description: 'Error al cargar clientes', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCliente = async () => {
    if (!nuevoNombre.trim()) {
      toast({ title: 'Error', description: 'El nombre es requerido', variant: 'destructive' });
      return;
    }

    const cliente: Cliente = {
      id: generateId(),
      nombre: nuevoNombre.trim(),
      telefono: nuevoTelefono.trim(),
    };

    try {
      await saveCliente(cliente);
      await loadClientes();
      setNuevoNombre('');
      setNuevoTelefono('');
      toast({ title: 'Éxito', description: 'Cliente agregado correctamente' });
    } catch (error) {
      toast({ title: 'Error', description: 'Error al agregar cliente', variant: 'destructive' });
    }
  };

  const startEdit = (cliente: Cliente) => {
    setEditingId(cliente.id);
    setEditNombre(cliente.nombre);
    setEditTelefono(cliente.telefono);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditNombre('');
    setEditTelefono('');
  };

  const saveEdit = async (id: string) => {
    if (!editNombre.trim()) {
      toast({ title: 'Error', description: 'El nombre es requerido', variant: 'destructive' });
      return;
    }

    const cliente: Cliente = {
      id,
      nombre: editNombre.trim(),
      telefono: editTelefono.trim(),
    };

    try {
      await saveCliente(cliente);
      await loadClientes();
      cancelEdit();
      toast({ title: 'Éxito', description: 'Cliente actualizado' });
    } catch (error) {
      toast({ title: 'Error', description: 'Error al actualizar cliente', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este cliente?')) {
      try {
        await deleteCliente(id);
        await loadClientes();
        toast({ title: 'Éxito', description: 'Cliente eliminado' });
      } catch (error) {
        toast({ title: 'Error', description: 'Error al eliminar cliente', variant: 'destructive' });
      }
    }
  };

  const handleViewHistory = async (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setHistoryOpen(true);
    setLoadingHistory(true);
    setClientFichas([]); // Reset previous data
    try {
      const fichas = await getFichasByClienteNombre(cliente.nombre);
      setClientFichas(fichas);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast({ title: 'Error', description: 'Error al cargar historial', variant: 'destructive' });
    } finally {
      setLoadingHistory(false);
    }
  };

  const filteredClientes = clientes.filter(
    (c) =>
      c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.telefono.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto py-8 px-4">
        <div className="flex items-center gap-3 mb-8">
          <Users className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-heading font-bold">Gestión de Clientes</h1>
        </div>

        <div className="grid gap-6">
          {/* Add Manual */}
          <section className="form-section animate-fade-in">
            <h2 className="form-section-title flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Agregar Cliente Manual
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="input-group">
                <Label className="input-label">Nombre *</Label>
                <Input
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Nombre del cliente"
                />
              </div>
              <div className="input-group">
                <Label className="input-label">Teléfono</Label>
                <Input
                  value={nuevoTelefono}
                  onChange={(e) => setNuevoTelefono(e.target.value)}
                  placeholder="+56 9 1234 5678"
                />
              </div>
              <div className="input-group flex items-end">
                <Button onClick={handleAddCliente} className="w-full hover-lift">
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar
                </Button>
              </div>
            </div>
          </section>

          {/* List */}
          <section className="form-section animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <h2 className="form-section-title flex items-center gap-2">
              <Users className="h-5 w-5" />
              Directorio de Clientes ({clientes.length})
            </h2>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="stihl-table">
                <thead>
                  <tr>
                    <th>NOMBRE</th>
                    <th className="w-48">TELÉFONO</th>
                    <th className="w-32">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={3} className="text-center text-muted-foreground py-8">
                        Cargando...
                      </td>
                    </tr>
                  ) : filteredClientes.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center text-muted-foreground py-8">
                        No hay clientes registrados.
                      </td>
                    </tr>
                  ) : (
                    filteredClientes.map((cliente) => (
                      <tr key={cliente.id}>
                        {editingId === cliente.id ? (
                          <>
                            <td>
                              <Input
                                value={editNombre}
                                onChange={(e) => setEditNombre(e.target.value)}
                                className="w-full"
                              />
                            </td>
                            <td>
                              <Input
                                value={editTelefono}
                                onChange={(e) => setEditTelefono(e.target.value)}
                                className="w-full"
                              />
                            </td>
                            <td>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  onClick={() => saveEdit(cliente.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={cancelEdit}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="font-medium">{cliente.nombre}</td>
                            <td>{cliente.telefono}</td>
                            <td>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleViewHistory(cliente)}
                                  title="Ver Historial"
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEdit(cliente)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDelete(cliente.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Historial de Servicios - {selectedCliente?.nombre}</DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
            {loadingHistory ? (
              <p className="text-center py-4 text-muted-foreground">Cargando historial...</p>
            ) : clientFichas.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">No hay fichas técnicas registradas para este cliente.</p>
            ) : (
              <div className="space-y-4">
                {clientFichas.map((ficha) => (
                  <div key={ficha.id} className="border rounded-lg p-4 bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-bold text-lg">Boleta #{ficha.numeroBoleta}</span>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(ficha.fechaIngreso, "d 'de' MMMM, yyyy", { locale: es })}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                          {ficha.modeloMaquina}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4 mt-3 text-sm">
                      <div>
                        <span className="font-semibold block text-xs uppercase text-muted-foreground mb-1">Avería Reportada</span>
                        <p>{ficha.tipoAveria || 'Sin detalles'}</p>
                      </div>
                      <div>
                        <span className="font-semibold block text-xs uppercase text-muted-foreground mb-1">Repuestos Utilizados</span>
                        {ficha.repuestos.length > 0 ? (
                          <ul className="list-disc list-inside">
                            {ficha.repuestos.map((r, idx) => (
                              <li key={idx}>{r.cantidad}x {r.nombre}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="italic text-muted-foreground">Sin repuestos</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientesPage;
