
-- Add puntos column to clientes
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS puntos INTEGER NOT NULL DEFAULT 0;

-- Create configuracion table
CREATE TABLE IF NOT EXISTS public.configuracion (
  id TEXT PRIMARY KEY,
  valor BOOLEAN,
  valor_numerico NUMERIC
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.configuracion TO authenticated;
GRANT ALL ON public.configuracion TO service_role;

ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read configuracion"
  ON public.configuracion FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert configuracion"
  ON public.configuracion FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update configuracion"
  ON public.configuracion FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Seed default config keys used by the app
INSERT INTO public.configuracion (id, valor, valor_numerico) VALUES
  ('sistema_puntos_activo', false, NULL),
  ('puntos_por_cada_clp', NULL, 5000),
  ('puntos_meta_afilado', NULL, 16),
  ('puntos_meta_plata', NULL, 30),
  ('puntos_meta_oro', NULL, 50),
  ('puntos_meta_diamante', NULL, 100),
  ('puntos_meta_carburacion', NULL, 10),
  ('puntos_meta_ultrasonido', NULL, 25),
  ('puntos_meta_inspeccion', NULL, 5),
  ('puntos_meta_aceite_cadena', NULL, 15),
  ('puntos_meta_garantia_extendida', NULL, 40),
  ('valor_base_mantencion', NULL, 20000)
ON CONFLICT (id) DO NOTHING;
