import { supabase } from '@/integrations/supabase/client';
import { Cliente, Repuesto, FichaTecnica, ServicioItem, RepuestoFicha } from '@/types';
import type { Json } from '@/integrations/supabase/types';

// Configuración
export interface ConfigSistema {
  sistema_puntos_activo: boolean;
  puntos_por_cada_clp: number;
  puntos_meta_afilado: number;
  puntos_meta_plata: number;
  puntos_meta_oro: number;
  puntos_meta_diamante: number;
  puntos_meta_carburacion: number;
  puntos_meta_ultrasonido: number;
  puntos_meta_inspeccion: number;
  puntos_meta_aceite_cadena: number;
  puntos_meta_garantia_extendida: number;
  valor_base_mantencion: number;
}

export const getConfigSistema = async (): Promise<ConfigSistema> => {
  const { data, error } = await supabase
    .from('configuracion')
    .select('*');
  
  const config: ConfigSistema = {
    sistema_puntos_activo: false,
    puntos_por_cada_clp: 5000,
    puntos_meta_afilado: 16,
    puntos_meta_plata: 30,
    puntos_meta_oro: 50,
    puntos_meta_diamante: 100,
    puntos_meta_carburacion: 10,
    puntos_meta_ultrasonido: 25,
    puntos_meta_inspeccion: 5,
    puntos_meta_aceite_cadena: 15,
    puntos_meta_garantia_extendida: 40,
    valor_base_mantencion: 20000,
  };

  if (error || !data) return config;

  data.forEach(item => {
    if (item.id === 'sistema_puntos_activo') config.sistema_puntos_activo = item.valor;
    if (item.id === 'puntos_por_cada_clp') config.puntos_por_cada_clp = item.valor_numerico || 5000;
    if (item.id === 'puntos_meta_afilado') config.puntos_meta_afilado = item.valor_numerico || 16;
    if (item.id === 'puntos_meta_plata') config.puntos_meta_plata = item.valor_numerico || 30;
    if (item.id === 'puntos_meta_oro') config.puntos_meta_oro = item.valor_numerico || 50;
    if (item.id === 'puntos_meta_diamante') config.puntos_meta_diamante = item.valor_numerico || 100;
    if (item.id === 'puntos_meta_carburacion') config.puntos_meta_carburacion = item.valor_numerico || 10;
    if (item.id === 'puntos_meta_ultrasonido') config.puntos_meta_ultrasonido = item.valor_numerico || 25;
    if (item.id === 'puntos_meta_inspeccion') config.puntos_meta_inspeccion = item.valor_numerico || 5;
    if (item.id === 'puntos_meta_aceite_cadena') config.puntos_meta_aceite_cadena = item.valor_numerico || 15;
    if (item.id === 'puntos_meta_garantia_extendida') config.puntos_meta_garantia_extendida = item.valor_numerico || 40;
    if (item.id === 'valor_base_mantencion') config.valor_base_mantencion = item.valor_numerico || 20000;
  });

  return config;
};

export const updateConfigParam = async (id: string, updates: { valor?: boolean, valor_numerico?: number }): Promise<void> => {
  const { error } = await supabase
    .from('configuracion')
    .update(updates)
    .eq('id', id);
  
  if (error) throw error;
};

export const isSistemaPuntosActivo = async (): Promise<boolean> => {
  const config = await getConfigSistema();
  return config.sistema_puntos_activo;
};

export const setSistemaPuntosActivo = async (activo: boolean): Promise<void> => {
  await updateConfigParam('sistema_puntos_activo', { valor: activo });
};

// Clientes
export const getClientes = async (): Promise<Cliente[]> => {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('nombre');
  
  if (error) {
    console.error('Error fetching clientes:', error);
    return [];
  }
  
  return data.map(c => ({
    id: c.id,
    nombre: c.nombre,
    telefono: c.telefono || '',
    puntos: c.puntos || 0,
  }));
};

export const saveCliente = async (cliente: Cliente): Promise<void> => {
  // Primero buscamos si ya existe un cliente con ese mismo nombre (ignorado mayúsculas/minúsculas)
  const { data: existingClients } = await supabase
    .from('clientes')
    .select('id, nombre, telefono')
    .ilike('nombre', cliente.nombre.trim());

  let targetId = cliente.id;
  
  if (existingClients && existingClients.length > 0) {
    // Si existe uno con el mismo nombre, usamos su ID para actualizarlo en lugar de crear uno nuevo
    targetId = existingClients[0].id;
  }

  const { error } = await supabase
    .from('clientes')
    .upsert({
      id: targetId,
      nombre: cliente.nombre.trim().toUpperCase(),
      telefono: cliente.telefono,
    }, { onConflict: 'id' });
  
  if (error) {
    console.error('Error saving cliente:', error);
    throw error;
  }
};

// Repuestos
export const getRepuestos = async (): Promise<Repuesto[]> => {
  const { data, error } = await supabase
    .from('repuestos')
    .select('*')
    .order('nombre');
  
  if (error) {
    console.error('Error fetching repuestos:', error);
    return [];
  }
  
  return data.map(r => ({
    id: r.id,
    codigo: r.codigo,
    nombre: r.nombre,
    precio: Number(r.precio),
  }));
};

export const saveRepuesto = async (repuesto: Repuesto): Promise<void> => {
  const { error } = await supabase
    .from('repuestos')
    .upsert({
      id: repuesto.id,
      codigo: repuesto.codigo,
      nombre: repuesto.nombre,
      precio: repuesto.precio,
    }, { onConflict: 'id' });
  
  if (error) {
    console.error('Error saving repuesto:', error);
    throw error;
  }
};

export const saveRepuestosBulk = async (nuevosRepuestos: Repuesto[]): Promise<void> => {
  for (const repuesto of nuevosRepuestos) {
    const { data: existing } = await supabase
      .from('repuestos')
      .select('id')
      .eq('codigo', repuesto.codigo)
      .maybeSingle();
    
    if (existing) {
      await supabase
        .from('repuestos')
        .update({
          nombre: repuesto.nombre,
          precio: repuesto.precio,
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('repuestos')
        .insert({
          id: repuesto.id,
          codigo: repuesto.codigo,
          nombre: repuesto.nombre,
          precio: repuesto.precio,
        });
    }
  }
};

export const deleteRepuesto = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('repuestos')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting repuesto:', error);
    throw error;
  }
};

// Modelos
export const getModelos = async (): Promise<{ id: string; modelo: string }[]> => {
  const { data, error } = await supabase
    .from('modelos')
    .select('*')
    .order('nombre');
  
  if (error) {
    console.error('Error fetching modelos:', error);
    return [];
  }
  
  return data.map(m => ({
    id: m.id,
    modelo: m.nombre,
  }));
};

export const saveModelo = async (modelo: { id: string; modelo: string }): Promise<void> => {
  const { error } = await supabase
    .from('modelos')
    .upsert({
      id: modelo.id,
      nombre: modelo.modelo,
    }, { onConflict: 'id' });
  
  if (error) {
    console.error('Error saving modelo:', error);
    throw error;
  }
};

// Fichas Técnicas
export const getFichas = async (): Promise<FichaTecnica[]> => {
  const { data, error } = await supabase
    .from('fichas')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching fichas:', error);
    return [];
  }
  
  return data.map(f => ({
    id: f.id,
    numeroBoleta: f.numero_boleta,
    numeroServicio: f.numero_boleta,
    fechaIngreso: new Date(f.fecha_ingreso),
    fechaReparacion: f.fecha_reparacion ? new Date(f.fecha_reparacion) : null,
    fechaEntrega: f.fecha_entrega ? new Date(f.fecha_entrega) : null,
    cliente: {
      id: f.id,
      nombre: f.cliente_nombre,
      telefono: f.cliente_telefono || '',
    },
    modeloMaquina: f.modelo_maquina,
    numeroSerie: f.numero_serie || '',
    tipoAveria: f.observaciones || '',
    repuestos: (Array.isArray(f.repuestos) ? f.repuestos : []) as unknown as RepuestoFicha[],
    servicios: (Array.isArray(f.servicios) ? f.servicios : []) as unknown as ServicioItem[],
    recomendaciones: 'REPARACIÓN GARANTIZADA POR 20 DÍAS DE LA FECHA DE RETIRO',
    tecnico: f.mecanico as 'JORGE' | 'JEAN',
    estado: (f.cliente_direccion === 'ENTREGADA' ? 'ENTREGADA' : 'TALLER') as 'TALLER' | 'ENTREGADA',
  }));
};

export const getFichaById = async (id: string): Promise<FichaTecnica | null> => {
  const { data, error } = await supabase
    .from('fichas')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching ficha:', error);
    return null;
  }
  
  return {
    id: data.id,
    numeroBoleta: data.numero_boleta,
    numeroServicio: data.numero_boleta,
    fechaIngreso: new Date(data.fecha_ingreso),
    fechaReparacion: data.fecha_reparacion ? new Date(data.fecha_reparacion) : null,
    fechaEntrega: data.fecha_entrega ? new Date(data.fecha_entrega) : null,
    cliente: {
      id: data.id,
      nombre: data.cliente_nombre,
      telefono: data.cliente_telefono || '',
    },
    modeloMaquina: data.modelo_maquina,
    numeroSerie: data.numero_serie || '',
    tipoAveria: data.observaciones || '',
    repuestos: (Array.isArray(data.repuestos) ? data.repuestos : []) as unknown as RepuestoFicha[],
    servicios: (Array.isArray(data.servicios) ? data.servicios : []) as unknown as ServicioItem[],
    recomendaciones: 'REPARACIÓN GARANTIZADA POR 20 DÍAS DE LA FECHA DE RETIRO',
    tecnico: data.mecanico as 'JORGE' | 'JEAN',
    estado: (data.cliente_direccion === 'ENTREGADA' ? 'ENTREGADA' : 'TALLER') as 'TALLER' | 'ENTREGADA',
  };
};

export const saveFicha = async (ficha: FichaTecnica): Promise<void> => {
  const fichaData = {
    numero_boleta: ficha.numeroBoleta,
    fecha_ingreso: ficha.fechaIngreso.toISOString(),
    fecha_reparacion: ficha.fechaReparacion?.toISOString() || null,
    fecha_entrega: ficha.fechaEntrega?.toISOString() || null,
    cliente_nombre: ficha.cliente.nombre,
    cliente_telefono: ficha.cliente.telefono,
    modelo_maquina: ficha.modeloMaquina,
    numero_serie: ficha.numeroSerie,
    mecanico: ficha.tecnico,
    repuestos: JSON.parse(JSON.stringify(ficha.repuestos)) as Json,
    servicios: JSON.parse(JSON.stringify(ficha.servicios)) as Json,
    observaciones: ficha.tipoAveria,
    cliente_direccion: ficha.estado,
    // firma_cliente: ficha.firmaCliente || null, -- Reverted as requested before
  };

  // Logic for points if system is active
  if (ficha.estado === 'ENTREGADA') {
    const config = await getConfigSistema();
    if (config.sistema_puntos_activo) {
      const totalRepuestos = ficha.repuestos.reduce(
        (sum, r) => sum + (r.precioEditado ?? r.precio) * r.cantidad,
        0
      );
      
      const pointsToEarn = Math.floor((totalRepuestos + config.valor_base_mantencion) / config.puntos_por_cada_clp);
      
      if (pointsToEarn > 0) {
        const { data: clientData } = await supabase
          .from('clientes')
          .select('puntos')
          .eq('id', ficha.cliente.id)
          .single();
        
        const currentPoints = clientData?.puntos || 0;
        await supabase
          .from('clientes')
          .update({ puntos: currentPoints + pointsToEarn })
          .eq('id', ficha.cliente.id);
      }
    }
  }

  // Check if ficha exists
  const { data: existing } = await supabase
    .from('fichas')
    .select('id')
    .eq('id', ficha.id)
    .maybeSingle();

  let error;
  if (existing) {
    const result = await supabase
      .from('fichas')
      .update(fichaData)
      .eq('id', ficha.id);
    error = result.error;
  } else {
    const insertData = { ...fichaData } as Record<string, unknown>;
    insertData.id = ficha.id;
    const result = await supabase
      .from('fichas')
      .insert(insertData as never);
    error = result.error;
  }
  
  if (error) {
    console.error('Error saving ficha:', error);
    throw error;
  }
};

export const updateFichaEstado = async (id: string, estado: 'TALLER' | 'ENTREGADA'): Promise<void> => {
  const updateData: Record<string, unknown> = { cliente_direccion: estado };
  
  // Si se cambia a ENTREGADA, establecemos la fecha de entrega
  // Si se cambia a TALLER, la limpiamos
  if (estado === 'ENTREGADA') {
    updateData.fecha_entrega = new Date().toISOString();
  } else {
    updateData.fecha_entrega = null;
  }

  const { error } = await supabase
    .from('fichas')
    .update(updateData)
    .eq('id', id);
  
  if (error) {
    console.error('Error updating ficha estado:', error);
    throw error;
  }
};

export const deleteFicha = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('fichas')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting ficha:', error);
    throw error;
  }
};

// Contador
export const getNextNumero = async (): Promise<number> => {
  const { data, error } = await supabase
    .from('contador')
    .select('valor')
    .eq('id', 'boleta')
    .single();
  
  if (error) {
    console.error('Error fetching contador:', error);
    return 1;
  }
  
  return (data?.valor || 0) + 1;
};

export const incrementContador = async (): Promise<void> => {
  const nextValue = await getNextNumero();
  
  const { error } = await supabase
    .from('contador')
    .update({ valor: nextValue })
    .eq('id', 'boleta');
  
  if (error) {
    console.error('Error incrementing contador:', error);
    throw error;
  }
};

// Generate ID helper
export const generateId = (): string => {
  return crypto.randomUUID();
};

export const getNextFolio = async (): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('fichas')
      .select('numero_boleta')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching last folio:', error);
      return '';
    }

    if (data && data.length > 0) {
      const lastBoleta = data[0].numero_boleta;
      // Try to extract the last sequence of digits
      const match = lastBoleta.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        return (num + 1).toString();
      }
      // If it's a number but parsed simply
      const simpleNum = parseInt(lastBoleta, 10);
      if (!isNaN(simpleNum)) {
        return (simpleNum + 1).toString();
      }
    }
    
    return '1';
  } catch (error) {
    console.error('Error in getNextFolio:', error);
    return '';
  }
};
