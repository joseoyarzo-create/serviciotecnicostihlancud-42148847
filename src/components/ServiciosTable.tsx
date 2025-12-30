import { ServicioItem } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';

interface Props {
  servicios: ServicioItem[];
  onServiciosChange: (servicios: ServicioItem[]) => void;
}

const DEFAULT_SERVICIOS: ServicioItem[] = [
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

export { DEFAULT_SERVICIOS };

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

  return (
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
  );
};

export default ServiciosTable;
