import { useState, useEffect } from 'react';
import { Repuesto, RepuestoFicha } from '@/types';
import { getRepuestos } from '@/lib/cloudStorage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Search } from 'lucide-react';

interface Props {
  selectedRepuestos: RepuestoFicha[];
  onRepuestosChange: (repuestos: RepuestoFicha[]) => void;
}

const RepuestosSelector = ({ selectedRepuestos, onRepuestosChange }: Props) => {
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadRepuestos = async () => {
      const data = await getRepuestos();
      setRepuestos(data);
    };
    loadRepuestos();
  }, []);

  const filteredRepuestos = repuestos.filter(
    (r) =>
      r.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addRepuesto = (repuesto: Repuesto) => {
    const existing = selectedRepuestos.find((r) => r.id === repuesto.id);
    if (existing) {
      onRepuestosChange(
        selectedRepuestos.map((r) =>
          r.id === repuesto.id ? { ...r, cantidad: r.cantidad + 1 } : r
        )
      );
    } else {
      onRepuestosChange([...selectedRepuestos, { ...repuesto, cantidad: 1 }]);
    }
  };

  const updateCantidad = (id: string, cantidad: number) => {
    if (cantidad <= 0) {
      removeRepuesto(id);
      return;
    }
    onRepuestosChange(
      selectedRepuestos.map((r) => (r.id === id ? { ...r, cantidad } : r))
    );
  };

  const updatePrecio = (id: string, precio: number) => {
    onRepuestosChange(
      selectedRepuestos.map((r) => (r.id === id ? { ...r, precioEditado: precio } : r))
    );
  };

  const removeRepuesto = (id: string) => {
    onRepuestosChange(selectedRepuestos.filter((r) => r.id !== id));
  };

  const total = selectedRepuestos.reduce(
    (sum, r) => sum + (r.precioEditado ?? r.precio) * r.cantidad,
    0
  );

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar repuesto por código o nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Available Repuestos */}
      {searchTerm && (
        <div className="max-h-48 overflow-y-auto border border-border rounded-lg bg-card">
          {filteredRepuestos.length === 0 ? (
            <p className="p-4 text-center text-muted-foreground">No se encontraron repuestos</p>
          ) : (
            filteredRepuestos.map((repuesto) => (
              <div
                key={repuesto.id}
                className="flex items-center justify-between p-3 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
              >
                <div>
                  <span className="font-mono text-sm text-muted-foreground">{repuesto.codigo}</span>
                  <span className="mx-2">-</span>
                  <span>{repuesto.nombre}</span>
                  <span className="ml-2 text-primary font-medium">
                    ${repuesto.precio.toLocaleString('es-CL')}
                  </span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => addRepuesto(repuesto)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Selected Repuestos Table */}
      {selectedRepuestos.length > 0 && (
        <div className="overflow-x-auto">
          <table className="stihl-table">
            <thead>
              <tr>
                <th className="w-20">CANT</th>
                <th className="w-32">CÓDIGO</th>
                <th>REPUESTO</th>
                <th className="w-32">PRECIO UNIT.</th>
                <th className="w-32">SUBTOTAL</th>
                <th className="w-16"></th>
              </tr>
            </thead>
            <tbody>
              {selectedRepuestos.map((repuesto) => (
                <tr key={repuesto.id}>
                  <td>
                    <Input
                      type="number"
                      min="1"
                      value={repuesto.cantidad}
                      onChange={(e) => updateCantidad(repuesto.id, parseInt(e.target.value) || 0)}
                      className="w-16 text-center"
                    />
                  </td>
                  <td className="font-mono">{repuesto.codigo}</td>
                  <td>{repuesto.nombre}</td>
                  <td>
                    <Input
                      type="number"
                      min="0"
                      value={repuesto.precioEditado ?? repuesto.precio}
                      onChange={(e) => updatePrecio(repuesto.id, parseInt(e.target.value) || 0)}
                      className="w-28"
                    />
                  </td>
                  <td className="font-medium">
                    ${((repuesto.precioEditado ?? repuesto.precio) * repuesto.cantidad).toLocaleString('es-CL')}
                  </td>
                  <td>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeRepuesto(repuesto.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-muted/50">
                <td colSpan={4} className="text-right font-bold">
                  TOTAL REPUESTOS:
                </td>
                <td className="font-bold text-primary text-lg">
                  ${total.toLocaleString('es-CL')}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {selectedRepuestos.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          Busca y agrega repuestos utilizados en la reparación
        </p>
      )}
    </div>
  );
};

export default RepuestosSelector;
