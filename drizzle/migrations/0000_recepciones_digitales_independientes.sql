ALTER TABLE public.fichas ADD COLUMN origen text NOT NULL DEFAULT 'historico', ADD COLUMN boleta_fisica text;
ALTER TABLE public.fichas ADD CONSTRAINT fichas_origen_valido CHECK (origen IN ('historico','fisica','digital'));
CREATE SEQUENCE public.boletas_digitales_seq;
REVOKE ALL ON SEQUENCE public.boletas_digitales_seq FROM PUBLIC, anon, authenticated;
CREATE TABLE public.recepciones (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 solicitud_id uuid NOT NULL UNIQUE,
 ficha_id uuid NOT NULL UNIQUE REFERENCES public.fichas(id) ON DELETE RESTRICT,
 numero text NOT NULL UNIQUE,
 cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
 cadena boolean NOT NULL DEFAULT false,
 espada boolean NOT NULL DEFAULT false,
 funda boolean NOT NULL DEFAULT false,
 observaciones text NOT NULL DEFAULT '',
 fecha_estimada date,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT recepcion_observaciones_longitud CHECK (length(observaciones) <= 2000)
);
GRANT SELECT ON public.recepciones TO authenticated;
GRANT ALL ON public.recepciones TO service_role;
ALTER TABLE public.recepciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Personal consulta recepciones" ON public.recepciones FOR SELECT TO authenticated USING (true);
CREATE TRIGGER update_recepciones_updated_at BEFORE UPDATE ON public.recepciones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE FUNCTION public.crear_recepcion_digital(_solicitud uuid, _nombre text, _telefono text, _modelo text, _serie text, _motivo text, _observaciones text, _cadena boolean, _espada boolean, _funda boolean, _fecha timestamptz, _fecha_estimada date DEFAULT NULL)
RETURNS public.recepciones LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.recepciones; c uuid; f uuid; n text; nombre text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Debe iniciar sesión' USING ERRCODE='42501'; END IF;
 IF _solicitud IS NULL OR _fecha IS NULL OR _nombre IS NULL OR _modelo IS NULL OR _motivo IS NULL OR length(trim(_nombre)) NOT BETWEEN 1 AND 100 OR length(trim(_modelo)) NOT BETWEEN 1 AND 100 OR length(trim(_motivo)) NOT BETWEEN 1 AND 2000 OR length(coalesce(_telefono,'')) > 40 OR length(coalesce(_serie,'')) > 100 OR length(coalesce(_observaciones,'')) > 2000 THEN RAISE EXCEPTION 'Datos de recepción inválidos'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(_solicitud::text,0));
 SELECT * INTO r FROM public.recepciones WHERE solicitud_id=_solicitud;
 IF FOUND THEN RETURN r; END IF;
 nombre := upper(regexp_replace(trim(_nombre),'\s+',' ','g'));
 PERFORM pg_advisory_xact_lock(hashtextextended(nombre,1));
 SELECT id INTO c FROM public.clientes WHERE upper(trim(public.clientes.nombre))=nombre ORDER BY created_at LIMIT 1;
 IF c IS NULL THEN INSERT INTO public.clientes(nombre,telefono) VALUES(nombre,trim(coalesce(_telefono,''))) RETURNING id INTO c;
 ELSE UPDATE public.clientes SET telefono=CASE WHEN trim(coalesce(_telefono,''))<>'' THEN trim(_telefono) ELSE telefono END WHERE id=c; END IF;
 n := 'D-' || lpad(nextval('public.boletas_digitales_seq')::text,6,'0');
 INSERT INTO public.fichas(numero_boleta,fecha_ingreso,cliente_nombre,cliente_telefono,modelo_maquina,numero_serie,mecanico,observaciones,cliente_direccion,origen)
 VALUES(n,_fecha,nombre,trim(coalesce(_telefono,'')),trim(_modelo),trim(coalesce(_serie,'')),'',trim(_motivo),'TALLER','digital') RETURNING id INTO f;
 INSERT INTO public.recepciones(solicitud_id,ficha_id,numero,cliente_id,cadena,espada,funda,observaciones,fecha_estimada)
 VALUES(_solicitud,f,n,c,coalesce(_cadena,false),coalesce(_espada,false),coalesce(_funda,false),coalesce(_observaciones,''),_fecha_estimada) RETURNING * INTO r;
 RETURN r;
END; $$;
REVOKE ALL ON FUNCTION public.crear_recepcion_digital(uuid,text,text,text,text,text,text,boolean,boolean,boolean,timestamptz,date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crear_recepcion_digital(uuid,text,text,text,text,text,text,boolean,boolean,boolean,timestamptz,date) TO authenticated;
CREATE OR REPLACE FUNCTION public.validar_origen_ficha() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF NEW.origen='fisica' AND (length(coalesce(NEW.boleta_fisica,''))>100 OR length(NEW.cliente_nombre) NOT BETWEEN 1 AND 100 OR length(NEW.modelo_maquina) NOT BETWEEN 1 AND 100 OR length(coalesce(NEW.observaciones,''))>6000 OR length(coalesce(NEW.cliente_telefono,''))>40 OR length(coalesce(NEW.numero_serie,''))>100 OR NEW.mecanico NOT IN ('JORGE','JEAN')) THEN RAISE EXCEPTION 'Datos de reparación inválidos'; END IF;
 IF TG_OP='UPDATE' AND (OLD.origen <> NEW.origen OR (OLD.origen='digital' AND OLD.numero_boleta <> NEW.numero_boleta)) THEN RAISE EXCEPTION 'El origen y número digital no pueden cambiar'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER validar_origen_ficha BEFORE INSERT OR UPDATE ON public.fichas FOR EACH ROW EXECUTE FUNCTION public.validar_origen_ficha();
COMMENT ON TABLE public.recepciones IS 'Recepción digital independiente; la máquina y la reparación se representan en la ficha vinculada. Numeración solo por RPC transaccional.';