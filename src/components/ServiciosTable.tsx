import { Fragment } from 'react';
import { ServicioItem } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { CheckSquare } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { MOTIVOS_NO_CAMBIO } from '@/types';

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

  const update = (index: number, patch: Partial<ServicioItem>) => {
    const updated = [...servicios];
    updated[index] = { ...updated[index], ...patch };
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
              <th className="text-center">REVISIÓN</th>
              <th className="text-center">NECESITA CAMBIO</th>
              <th className="text-center">REPARACIÓN/CAMBIO</th>
            </tr>
          </thead>
          <tbody>
            {servicios.map((servicio, index) => (
              <Fragment key={index}>
              <tr>
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
                      checked={!!servicio.necesitaCambio}
                      onCheckedChange={(v) => update(index, { necesitaCambio: !!v })}
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
              {servicio.necesitaCambio && !servicio.reparacion && (
                <tr className="bg-primary/5">
                  <td colSpan={4}>
                    <div className="flex flex-wrap items-center gap-2 py-1">
                      <span className="text-sm font-medium">Motivo por el que no se realizó el cambio:</span>
                      <Select
                        value={servicio.motivoNoCambio || ''}
                        onValueChange={(v) => update(index, { motivoNoCambio: v })}
                      >
                        <SelectTrigger className="w-64 h-8"><SelectValue placeholder="Seleccionar motivo" /></SelectTrigger>
                        <SelectContent>
                          {MOTIVOS_NO_CAMBIO.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {servicio.motivoNoCambio === 'Otro' && (
                        <Input
                          className="h-8 w-64"
                          placeholder="Escribe el motivo"
                          value={servicio.motivoOtro || ''}
                          onChange={(e) => update(index, { motivoOtro: e.target.value })}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ServiciosTable;
