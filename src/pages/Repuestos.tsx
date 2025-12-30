import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Repuesto } from '@/types';
import { getRepuestos, saveRepuesto, saveRepuestosBulk, deleteRepuesto, generateId } from '@/lib/storage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { Package, Upload, Plus, Trash2, Search, Edit2, Check, X, FileSpreadsheet } from 'lucide-react';

const RepuestosPage = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // New repuesto form
  const [nuevoCodigo, setNuevoCodigo] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoPrecio, setNuevoPrecio] = useState('');

  // Edit form
  const [editCodigo, setEditCodigo] = useState('');
  const [editNombre, setEditNombre] = useState('');
  const [editPrecio, setEditPrecio] = useState('');

  useEffect(() => {
    loadRepuestos();
  }, []);

  const loadRepuestos = () => {
    setRepuestos(getRepuestos());
  };

  const handleAddRepuesto = () => {
    if (!nuevoCodigo.trim() || !nuevoNombre.trim()) {
      toast({ title: 'Error', description: 'Código y nombre son requeridos', variant: 'destructive' });
      return;
    }

    const precio = nuevoPrecio ? parseInt(nuevoPrecio) : 1;
    const repuesto: Repuesto = {
      id: generateId(),
      codigo: nuevoCodigo.trim().toUpperCase(),
      nombre: nuevoNombre.trim(),
      precio,
    };

    saveRepuesto(repuesto);
    loadRepuestos();
    setNuevoCodigo('');
    setNuevoNombre('');
    setNuevoPrecio('');
    toast({ title: 'Éxito', description: 'Repuesto agregado correctamente' });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];

        const nuevosRepuestos: Repuesto[] = [];
        
        // Skip header row if exists
        const startRow = jsonData[0]?.some(cell => 
          typeof cell === 'string' && 
          (cell.toLowerCase().includes('codigo') || cell.toLowerCase().includes('nombre'))
        ) ? 1 : 0;

        for (let i = startRow; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || !row[0]) continue;

          const codigo = String(row[0] || '').trim().toUpperCase();
          const nombre = String(row[1] || row[0] || '').trim();
          const precioRaw = row[2];
          let precio = 1;

          if (precioRaw !== undefined && precioRaw !== null && precioRaw !== '') {
            const parsed = parseInt(String(precioRaw).replace(/[^0-9]/g, ''));
            if (!isNaN(parsed) && parsed > 0) {
              precio = parsed;
            }
          }

          if (codigo) {
            nuevosRepuestos.push({
              id: generateId(),
              codigo,
              nombre,
              precio,
            });
          }
        }

        if (nuevosRepuestos.length > 0) {
          saveRepuestosBulk(nuevosRepuestos);
          loadRepuestos();
          toast({ title: 'Éxito', description: `${nuevosRepuestos.length} repuestos importados` });
        } else {
          toast({ title: 'Aviso', description: 'No se encontraron repuestos válidos en el archivo', variant: 'destructive' });
        }
      } catch (error) {
        console.error('Error parsing Excel:', error);
        toast({ title: 'Error', description: 'Error al procesar el archivo Excel', variant: 'destructive' });
      }
    };
    reader.readAsArrayBuffer(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startEdit = (repuesto: Repuesto) => {
    setEditingId(repuesto.id);
    setEditCodigo(repuesto.codigo);
    setEditNombre(repuesto.nombre);
    setEditPrecio(repuesto.precio.toString());
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditCodigo('');
    setEditNombre('');
    setEditPrecio('');
  };

  const saveEdit = (id: string) => {
    if (!editCodigo.trim() || !editNombre.trim()) {
      toast({ title: 'Error', description: 'Código y nombre son requeridos', variant: 'destructive' });
      return;
    }

    const repuesto: Repuesto = {
      id,
      codigo: editCodigo.trim().toUpperCase(),
      nombre: editNombre.trim(),
      precio: parseInt(editPrecio) || 1,
    };

    saveRepuesto(repuesto);
    loadRepuestos();
    cancelEdit();
    toast({ title: 'Éxito', description: 'Repuesto actualizado' });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este repuesto?')) {
      deleteRepuesto(id);
      loadRepuestos();
      toast({ title: 'Éxito', description: 'Repuesto eliminado' });
    }
  };

  const filteredRepuestos = repuestos.filter(
    (r) =>
      r.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto py-8 px-4">
        <div className="flex items-center gap-3 mb-8">
          <Package className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-heading font-bold">Gestión de Repuestos</h1>
        </div>

        <div className="grid gap-6">
          {/* Import & Add Section */}
          <section className="form-section animate-fade-in">
            <h2 className="form-section-title flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Importar desde Excel
            </h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
                id="excel-upload"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="hover-lift"
              >
                <Upload className="mr-2 h-4 w-4" />
                Seleccionar archivo Excel
              </Button>
              <p className="text-sm text-muted-foreground self-center">
                Formato esperado: Código | Nombre | Precio (opcional, si no hay se asigna $1)
              </p>
            </div>
          </section>

          {/* Add Manual */}
          <section className="form-section animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <h2 className="form-section-title flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Agregar Repuesto Manual
            </h2>
            <div className="grid sm:grid-cols-4 gap-4">
              <div className="input-group">
                <Label className="input-label">Código *</Label>
                <Input
                  value={nuevoCodigo}
                  onChange={(e) => setNuevoCodigo(e.target.value)}
                  placeholder="Ej: 1234-567-890"
                />
              </div>
              <div className="input-group">
                <Label className="input-label">Nombre *</Label>
                <Input
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Nombre del repuesto"
                />
              </div>
              <div className="input-group">
                <Label className="input-label">Precio (opcional)</Label>
                <Input
                  type="number"
                  value={nuevoPrecio}
                  onChange={(e) => setNuevoPrecio(e.target.value)}
                  placeholder="$1 por defecto"
                />
              </div>
              <div className="input-group flex items-end">
                <Button onClick={handleAddRepuesto} className="w-full hover-lift">
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar
                </Button>
              </div>
            </div>
          </section>

          {/* List */}
          <section className="form-section animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h2 className="form-section-title flex items-center gap-2">
              <Package className="h-5 w-5" />
              Inventario de Repuestos ({repuestos.length})
            </h2>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código o nombre..."
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
                    <th className="w-40">CÓDIGO</th>
                    <th>NOMBRE</th>
                    <th className="w-32">PRECIO</th>
                    <th className="w-32">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRepuestos.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center text-muted-foreground py-8">
                        No hay repuestos. Importa un archivo Excel o agrega manualmente.
                      </td>
                    </tr>
                  ) : (
                    filteredRepuestos.map((repuesto) => (
                      <tr key={repuesto.id}>
                        {editingId === repuesto.id ? (
                          <>
                            <td>
                              <Input
                                value={editCodigo}
                                onChange={(e) => setEditCodigo(e.target.value)}
                                className="w-full"
                              />
                            </td>
                            <td>
                              <Input
                                value={editNombre}
                                onChange={(e) => setEditNombre(e.target.value)}
                                className="w-full"
                              />
                            </td>
                            <td>
                              <Input
                                type="number"
                                value={editPrecio}
                                onChange={(e) => setEditPrecio(e.target.value)}
                                className="w-full"
                              />
                            </td>
                            <td>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  onClick={() => saveEdit(repuesto.id)}
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
                            <td className="font-mono">{repuesto.codigo}</td>
                            <td>{repuesto.nombre}</td>
                            <td className="font-medium">
                              ${repuesto.precio.toLocaleString('es-CL')}
                            </td>
                            <td>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEdit(repuesto)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDelete(repuesto.id)}
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
    </div>
  );
};

export default RepuestosPage;
