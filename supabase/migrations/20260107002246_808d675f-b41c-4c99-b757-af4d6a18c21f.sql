-- Tabla de Clientes
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  telefono TEXT,
  direccion TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de Repuestos
CREATE TABLE public.repuestos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  precio NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de Modelos de Máquinas
CREATE TABLE public.modelos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de Fichas Técnicas
CREATE TABLE public.fichas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_boleta TEXT NOT NULL,
  fecha_ingreso TIMESTAMP WITH TIME ZONE NOT NULL,
  fecha_reparacion TIMESTAMP WITH TIME ZONE,
  fecha_entrega TIMESTAMP WITH TIME ZONE,
  cliente_nombre TEXT NOT NULL,
  cliente_telefono TEXT,
  cliente_direccion TEXT,
  modelo_maquina TEXT NOT NULL,
  numero_serie TEXT,
  mecanico TEXT NOT NULL,
  repuestos JSONB DEFAULT '[]'::jsonb,
  servicios JSONB DEFAULT '[]'::jsonb,
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de Contador para números de boleta
CREATE TABLE public.contador (
  id TEXT PRIMARY KEY DEFAULT 'boleta',
  valor INTEGER NOT NULL DEFAULT 0
);

-- Insertar valor inicial del contador
INSERT INTO public.contador (id, valor) VALUES ('boleta', 0);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modelos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fichas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contador ENABLE ROW LEVEL SECURITY;

-- Políticas públicas para acceso sin autenticación (datos compartidos entre dispositivos)
CREATE POLICY "Acceso público lectura clientes" ON public.clientes FOR SELECT USING (true);
CREATE POLICY "Acceso público escritura clientes" ON public.clientes FOR INSERT WITH CHECK (true);
CREATE POLICY "Acceso público actualización clientes" ON public.clientes FOR UPDATE USING (true);
CREATE POLICY "Acceso público eliminación clientes" ON public.clientes FOR DELETE USING (true);

CREATE POLICY "Acceso público lectura repuestos" ON public.repuestos FOR SELECT USING (true);
CREATE POLICY "Acceso público escritura repuestos" ON public.repuestos FOR INSERT WITH CHECK (true);
CREATE POLICY "Acceso público actualización repuestos" ON public.repuestos FOR UPDATE USING (true);
CREATE POLICY "Acceso público eliminación repuestos" ON public.repuestos FOR DELETE USING (true);

CREATE POLICY "Acceso público lectura modelos" ON public.modelos FOR SELECT USING (true);
CREATE POLICY "Acceso público escritura modelos" ON public.modelos FOR INSERT WITH CHECK (true);
CREATE POLICY "Acceso público actualización modelos" ON public.modelos FOR UPDATE USING (true);
CREATE POLICY "Acceso público eliminación modelos" ON public.modelos FOR DELETE USING (true);

CREATE POLICY "Acceso público lectura fichas" ON public.fichas FOR SELECT USING (true);
CREATE POLICY "Acceso público escritura fichas" ON public.fichas FOR INSERT WITH CHECK (true);
CREATE POLICY "Acceso público actualización fichas" ON public.fichas FOR UPDATE USING (true);
CREATE POLICY "Acceso público eliminación fichas" ON public.fichas FOR DELETE USING (true);

CREATE POLICY "Acceso público lectura contador" ON public.contador FOR SELECT USING (true);
CREATE POLICY "Acceso público actualización contador" ON public.contador FOR UPDATE USING (true);

-- Trigger para actualizar updated_at en fichas
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_fichas_updated_at
  BEFORE UPDATE ON public.fichas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();