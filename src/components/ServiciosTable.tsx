import { ServicioItem } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { CheckSquare } from 'lucide-react';

interface Props {
  servicios: ServicioItem[];
  onServiciosChange: (servicios: ServicioItem[]) => void;
}

export const DEFAULT_SERVICIOS: ServicioItem[] = [
  { nombre: 'LIMPIEZA DEL EQUIPO', revision: false, reparacion: false },
  { nombre: 'FILTRO AIRE', revision: false, reparacion: false },
  { nombre: 'FILTRO COMBUSTIBLE', revision: false, reparacion: false },
  { nombre: 'BUJÍA', revision: false, reparacion: false },
  { nombre: 'PISTÓN - ANILLOS', revision: false, reparacion: false },
  { nombre: 'EMBRAGUE', revision: false, reparacion: false },
  { nombre: 'SISTEMA ANTIVIBRATORIO', revision: false, reparacion: false },
  { nombre: 'SISTEMA ARRANQUE', revision: false, reparacion: false },
  { nombre: 'CARBURADOR', revision: false, reparacion: false },
  { nombre: 'SISTEMA LUBRICACIÓN', revision: false, reparacion: false },
  { nombre: 'SISTEMA FRENADO', revision: false, reparacion: false },
  { nombre: 'AJUSTE FIJACIONES DEL EQUIPO', revision: false, reparacion: false },
  { nombre: 'ESPADA', revision: false, reparacion: false },
  { nombre: 'CADENA', revision: false, reparacion: false },
  { nombre: 'PIÑÓN', revision: false, reparacion: false },
];



const ServiciosTable = ({ servicios, onServiciosChange }: Props) => {
  const toggleRevision = (index: number) => {
    const updated = [...servicios];
    updated[index] = { ...updated[index], revision: !updated[index].revision };
    onServiciosChange(updated);
  };

  const toggleReparacion = (index: number) => {
    const updated = [...servicios];
    updated[index] = { ...updated[index], reparacion: !updated[index].reparacion };
    onServiciosChange(updated);
  };

  const marcarTodasRevision = () => {
    const updated = servicios.map(s => ({ ...s, revision: true }));
    onServiciosChange(updated);
  };

  const marcarTodasReparacion = () => {
    const updated = servicios.map(s => ({ ...s, reparacion: true }));
    onServiciosChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={marcarTodasRevision}
          className="flex items-center gap-2"
        >
          <CheckSquare className="h-4 w-4" />
          Marcar todas Revisión
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={marcarTodasReparacion}
          className="flex items-center gap-2"
        >
          <CheckSquare className="h-4 w-4" />
          Marcar todas Reparación
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="stihl-table">
          <thead>
            <tr>
              <th className="w-2/5">SERVICIO</th>
              <th className="w-1/4 text-center">REVISIÓN</th>
              <th className="w-1/4 text-center">REPARACIÓN/CAMBIO</th>
            </tr>
          </thead>
          <tbody>
            {servicios.map((servicio, index) => (
              <tr key={index}>
                <td className="font-medium">{servicio.nombre}</td>
                <td className="text-center">
                  <div className="flex justify-center">
                    <Checkbox
                      checked={servicio.revision}
                      onCheckedChange={() => toggleRevision(index)}
                    />
                  </div>
                </td>
                <td className="text-center">
                  <div className="flex justify-center">
                    <Checkbox
                      checked={servicio.reparacion}
                      onCheckedChange={() => toggleReparacion(index)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ServiciosTable;
