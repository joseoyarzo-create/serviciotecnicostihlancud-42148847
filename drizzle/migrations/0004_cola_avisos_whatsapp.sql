CREATE TABLE public.avisos_whatsapp (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ficha_id uuid NOT NULL UNIQUE REFERENCES public.fichas(id) ON DELETE CASCADE,
  cliente_nombre text NOT NULL DEFAULT '',
  telefono text NOT NULL DEFAULT '',
  modelo text NOT NULL DEFAULT '',
  mensaje text NOT NULL DEFAULT '',
  estado text NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE','ENVIANDO','ENVIADO','ERROR')),
  intentos integer NOT NULL DEFAULT 0,
  error text,
  enviado_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.avisos_whatsapp TO authenticated;
GRANT ALL ON public.avisos_whatsapp TO service_role;
ALTER TABLE public.avisos_whatsapp ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Personal gestiona avisos" ON public.avisos_whatsapp FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX avisos_whatsapp_estado_idx ON public.avisos_whatsapp (estado, created_at);
CREATE TRIGGER avisos_whatsapp_updated BEFORE UPDATE ON public.avisos_whatsapp FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.encolar_aviso_listo()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_total numeric := 0;
  v_msg text;
BEGIN
  IF NEW.cliente_direccion IS DISTINCT FROM 'LISTO' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.cliente_direccion IS NOT DISTINCT FROM 'LISTO' THEN RETURN NEW; END IF;
  SELECT COALESCE(SUM(COALESCE((r->>'precioEditado')::numeric, (r->>'precio')::numeric, 0) * COALESCE((r->>'cantidad')::numeric, 1)), 0)
    INTO v_total FROM jsonb_array_elements(COALESCE(NEW.repuestos, '[]'::jsonb)) r;
  v_msg := 'Estimado/a ' || NEW.cliente_nombre || ', le informamos que su equipo *' || NEW.modelo_maquina ||
    '* (Servicio N° ' || NEW.numero_boleta || ') se encuentra *listo para retirar* en nuestro taller.' || E'\n\n' ||
    CASE WHEN v_total > 0 THEN '💰 *Valor total a cancelar: $' || replace(to_char(v_total, 'FM999G999G999'), ',', '.') || '*' || E'\n\n' ELSE '' END ||
    '📍 Pudeto 351, Ancud' || E'\n' || '📞 +56 65 2622214' || E'\n\n' ||
    'Horario de atención:' || E'\n' || 'Lunes a Viernes: 09:00 - 13:00 | 14:30 - 18:30 hrs.' || E'\n' || 'Sábado: 09:00 - 13:00 hrs.' || E'\n\n' ||
    'Recuerde que la reparación cuenta con garantía de 20 días desde la fecha de retiro.' || E'\n\n' ||
    'STIHL ANCUD - Comercial Sotavento Ltda.' || E'\n\n' ||
    '📄 Vea su ficha técnica aquí:' || E'\n' || 'https://serviciotecnicostihlancud.lovable.app/f/' || NEW.public_token;
  INSERT INTO public.avisos_whatsapp (ficha_id, cliente_nombre, telefono, modelo, mensaje)
  VALUES (NEW.id, NEW.cliente_nombre, COALESCE(NEW.cliente_telefono, ''), NEW.modelo_maquina, v_msg)
  ON CONFLICT (ficha_id) DO NOTHING;
  RETURN NEW;
END $$;

CREATE TRIGGER fichas_encolar_aviso_listo AFTER INSERT OR UPDATE OF cliente_direccion ON public.fichas
FOR EACH ROW EXECUTE FUNCTION public.encolar_aviso_listo();