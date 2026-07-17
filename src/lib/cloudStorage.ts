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

export const deleteCliente = async (id: string): Promise<void> => {
  const { error } = await supabase.from('clientes').delete().eq('id', id);
  if (error) {
    console.error('Error deleting cliente:', error);
    throw error;
  }
};

export const getFichasByClienteNombre = async (nombre: string): Promise<FichaTecnica[]> => {
  const { data, error } = await supabase
    .from('fichas')
    .select('*')
    .ilike('cliente_nombre', nombre.trim())
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((f: any) => ({
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
    repuestos: (Array.isArray(f.repuestos) ? f.repuestos : []) as RepuestoFicha[],
    servicios: (Array.isArray(f.servicios) ? f.servicios : []) as ServicioItem[],
    recomendaciones: 'REPARACIÓN GARANTIZADA POR 20 DÍAS DE LA FECHA DE RETIRO',
    tecnico: f.mecanico as 'JORGE' | 'JEAN',
    estado: (['TALLER','ESPERA_REPUESTO','LISTO','ENTREGADA'].includes(f.cliente_direccion ?? '') ? f.cliente_direccion! : 'TALLER') as import('@/types').EstadoFicha,
  }));
};

// Repuestos
export const getRepuestos = async (): Promise<Repuesto[]> => {
  const pageSize = 1000;
  let from = 0;
  const all: Repuesto[] = [];

  while (true) {
    const { data, error } = await supabase
      .from('repuestos')
      .select('*')
      .order('nombre')
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('Error fetching repuestos:', error);
      return all;
    }
    if (!data || data.length === 0) break;

    all.push(...data.map(r => ({
      id: r.id,
      codigo: r.codigo,
      nombre: r.nombre,
      precio: Number(r.precio),
    })));

    if (data.length < pageSize) break;
    from += pageSize;
  }

  return all;
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
export interface ModeloRow { id: string; modelo: string; despieceUrl?: string | null; }

export const getModelos = async (): Promise<ModeloRow[]> => {
  const { data, error } = await supabase
    .from('modelos')
    .select('*')
    .order('nombre');

  if (error) {
    console.error('Error fetching modelos:', error);
    return [];
  }

  return data.map((m: any) => ({
    id: m.id,
    modelo: m.nombre,
    despieceUrl: m.despiece_url ?? null,
  }));
};

export const saveModelo = async (modelo: { id: string; modelo: string; despieceUrl?: string | null }): Promise<void> => {
  const payload: any = { id: modelo.id, nombre: modelo.modelo };
  if (modelo.despieceUrl !== undefined) payload.despiece_url = modelo.despieceUrl;
  const { error } = await supabase.from('modelos').upsert(payload, { onConflict: 'id' });
  if (error) { console.error('Error saving modelo:', error); throw error; }
};

export const deleteModelo = async (id: string): Promise<void> => {
  const { error } = await supabase.from('modelos').delete().eq('id', id);
  if (error) throw error;
};

export const uploadDespiece = async (modeloId: string, file: File): Promise<string> => {
  const ext = (file.name.split('.').pop() || 'pdf').toLowerCase();
  const path = `${modeloId}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('despieces').upload(path, file, {
    upsert: true,
    contentType: file.type || 'application/pdf',
  });
  if (error) throw error;
  // Store the storage path (not a URL). We'll generate signed URLs on demand.
  return path;
};

/**
 * Returns a temporary signed URL for a despiece. Accepts either a stored path
 * or a legacy full URL (returns it as-is for backwards compatibility).
 */
export const getDespieceUrl = async (pathOrUrl: string, expiresInSec = 3600): Promise<string> => {
  if (!pathOrUrl) return '';
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const { data, error } = await supabase.storage
    .from('despieces')
    .createSignedUrl(pathOrUrl, expiresInSec);
  if (error || !data) throw error || new Error('No se pudo generar URL del despiece');
  return data.signedUrl;
};

// Cliente helpers extra
const normalizeName = (s: string) => s.trim().toUpperCase().replace(/\s+/g, ' ');
const stripDiacritics = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

export const findSimilarClientes = (target: string, clientes: Cliente[]): Cliente[] => {
  const t = stripDiacritics(normalizeName(target));
  if (!t) return [];
  return clientes.filter((c) => {
    const n = stripDiacritics(normalizeName(c.nombre));
    if (!n) return false;
    if (n === t) return true;
    if (n.includes(t) || t.includes(n)) return true;
    if (Math.abs(n.length - t.length) <= 2 && levenshtein(n, t) <= 2) return true;
    return false;
  });
};

export const findDuplicateGroups = (clientes: Cliente[]): Cliente[][] => {
  const seen = new Set<string>();
  const groups: Cliente[][] = [];
  for (const c of clientes) {
    if (seen.has(c.id)) continue;
    const group = findSimilarClientes(c.nombre, clientes);
    if (group.length > 1) {
      group.forEach((g) => seen.add(g.id));
      groups.push(group);
    } else {
      seen.add(c.id);
    }
  }
  return groups;
};

/**
 * Fusiona varios clientes en uno: reasigna fichas por nombre y elimina duplicados.
 */
export const mergeClientes = async (keepId: string, mergeIds: string[]): Promise<void> => {
  if (!mergeIds.length) return;
  const { data: keep } = await supabase.from('clientes').select('*').eq('id', keepId).single();
  if (!keep) throw new Error('Cliente principal no encontrado');

  const { data: others } = await supabase.from('clientes').select('*').in('id', mergeIds);
  const nombresOrigen = (others || []).map((c: any) => c.nombre).filter(Boolean);

  for (const nombre of nombresOrigen) {
    await supabase
      .from('fichas')
      .update({ cliente_nombre: keep.nombre, cliente_telefono: keep.telefono || null })
      .ilike('cliente_nombre', nombre);
  }

  const sumaPuntos = (others || []).reduce((s: number, c: any) => s + (c.puntos || 0), 0);
  if (sumaPuntos > 0) {
    await supabase.from('clientes').update({ puntos: (keep.puntos || 0) + sumaPuntos }).eq('id', keepId);
  }

  await supabase.from('clientes').delete().in('id', mergeIds);
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
    estado: (['TALLER','ESPERA_REPUESTO','LISTO','ENTREGADA'].includes(f.cliente_direccion ?? '') ? f.cliente_direccion! : 'TALLER') as import('@/types').EstadoFicha,
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
    estado: (['TALLER','ESPERA_REPUESTO','LISTO','ENTREGADA'].includes(data.cliente_direccion ?? '') ? data.cliente_direccion! : 'TALLER') as import('@/types').EstadoFicha,
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

export const updateFichaEstado = async (id: string, estado: import('@/types').EstadoFicha): Promise<void> => {
  const updateData: { cliente_direccion: string; fecha_entrega: string | null } = {
    cliente_direccion: estado,
    fecha_entrega: estado === 'ENTREGADA' ? new Date().toISOString() : null,
  };

  const { error } = await supabase
    .from('fichas')
    .update(updateData)
    .eq('id', id);
  
  if (error) {
    console.error('Error updating ficha estado:', error);
    throw error;
  }
};

/**
 * Marca varias fichas con el mismo estado en una sola llamada (hasta cientos a la vez).
 */
export const bulkUpdateFichaEstado = async (
  ids: string[],
  estado: import('@/types').EstadoFicha,
): Promise<void> => {
  if (!ids.length) return;
  const updateData: { cliente_direccion: string; fecha_entrega: string | null } = {
    cliente_direccion: estado,
    fecha_entrega: estado === 'ENTREGADA' ? new Date().toISOString() : null,
  };
  // Particionar en lotes por si la URL crece demasiado
  const chunkSize = 200;
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const { error } = await supabase
      .from('fichas')
      .update(updateData)
      .in('id', chunk);
    if (error) {
      console.error('Error bulk updating fichas:', error);
      throw error;
    }
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
