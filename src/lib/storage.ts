import { Cliente, Repuesto, ModeloMaquina, FichaTecnica } from '@/types';

const STORAGE_KEYS = {
  CLIENTES: 'stihl_clientes',
  REPUESTOS: 'stihl_repuestos',
  MODELOS: 'stihl_modelos',
  FICHAS: 'stihl_fichas',
  CONTADOR: 'stihl_contador',
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Clientes
export const getClientes = (): Cliente[] => {
  const data = localStorage.getItem(STORAGE_KEYS.CLIENTES);
  return data ? JSON.parse(data) : [];
};

export const saveCliente = (cliente: Cliente): void => {
  const clientes = getClientes();
  const existingIndex = clientes.findIndex(c => c.id === cliente.id);
  if (existingIndex >= 0) {
    clientes[existingIndex] = cliente;
  } else {
    clientes.push(cliente);
  }
  localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(clientes));
};

// Repuestos
export const getRepuestos = (): Repuesto[] => {
  const data = localStorage.getItem(STORAGE_KEYS.REPUESTOS);
  return data ? JSON.parse(data) : [];
};

export const saveRepuesto = (repuesto: Repuesto): void => {
  const repuestos = getRepuestos();
  const existingIndex = repuestos.findIndex(r => r.id === repuesto.id);
  if (existingIndex >= 0) {
    repuestos[existingIndex] = repuesto;
  } else {
    repuestos.push(repuesto);
  }
  localStorage.setItem(STORAGE_KEYS.REPUESTOS, JSON.stringify(repuestos));
};

export const saveRepuestosBulk = (nuevosRepuestos: Repuesto[]): void => {
  const repuestos = getRepuestos();
  nuevosRepuestos.forEach(nuevo => {
    const existingIndex = repuestos.findIndex(r => r.codigo === nuevo.codigo);
    if (existingIndex >= 0) {
      repuestos[existingIndex] = nuevo;
    } else {
      repuestos.push(nuevo);
    }
  });
  localStorage.setItem(STORAGE_KEYS.REPUESTOS, JSON.stringify(repuestos));
};

export const deleteRepuesto = (id: string): void => {
  const repuestos = getRepuestos().filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEYS.REPUESTOS, JSON.stringify(repuestos));
};

// Modelos
export const getModelos = (): ModeloMaquina[] => {
  const data = localStorage.getItem(STORAGE_KEYS.MODELOS);
  return data ? JSON.parse(data) : [];
};

export const saveModelo = (modelo: ModeloMaquina): void => {
  const modelos = getModelos();
  const existingIndex = modelos.findIndex(m => m.id === modelo.id);
  if (existingIndex >= 0) {
    modelos[existingIndex] = modelo;
  } else {
    modelos.push(modelo);
  }
  localStorage.setItem(STORAGE_KEYS.MODELOS, JSON.stringify(modelos));
};

// Fichas Técnicas
export const getFichas = (): FichaTecnica[] => {
  const data = localStorage.getItem(STORAGE_KEYS.FICHAS);
  if (!data) return [];
  const fichas = JSON.parse(data);
  return fichas.map((f: FichaTecnica) => ({
    ...f,
    fechaIngreso: new Date(f.fechaIngreso),
    fechaReparacion: f.fechaReparacion ? new Date(f.fechaReparacion) : null,
    fechaEntrega: f.fechaEntrega ? new Date(f.fechaEntrega) : null,
  }));
};

export const saveFicha = (ficha: FichaTecnica): void => {
  const fichas = getFichas();
  const existingIndex = fichas.findIndex(f => f.id === ficha.id);
  if (existingIndex >= 0) {
    fichas[existingIndex] = ficha;
  } else {
    fichas.push(ficha);
  }
  localStorage.setItem(STORAGE_KEYS.FICHAS, JSON.stringify(fichas));
};

export const deleteFicha = (id: string): void => {
  const fichas = getFichas().filter(f => f.id !== id);
  localStorage.setItem(STORAGE_KEYS.FICHAS, JSON.stringify(fichas));
};

// Contador
export const getNextNumero = (): number => {
  const data = localStorage.getItem(STORAGE_KEYS.CONTADOR);
  const contador = data ? parseInt(data, 10) : 0;
  return contador + 1;
};

export const incrementContador = (): void => {
  const next = getNextNumero();
  localStorage.setItem(STORAGE_KEYS.CONTADOR, next.toString());
};
