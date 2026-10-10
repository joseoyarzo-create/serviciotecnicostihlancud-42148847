ALTER TABLE public.recepciones ADD COLUMN motivo_ingreso text NOT NULL DEFAULT '';
CREATE OR REPLACE FUNCTION public.crear_recepcion_digital(_solicitud uuid, _nombre text, _telefono text, _modelo text, _serie text, _motivo text, _observaciones text, _cadena boolean, _espada boolean, _funda boolean, _fecha timestamptz, _fecha_estimada date DEFAULT NULL)
RETURNS public.recepciones LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.recepciones; c uuid; f uuid; n text; v_nombre text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Debe iniciar sesión' USING ERRCODE='42501'; END IF;
 IF _solicitud IS NULL OR _fecha IS NULL OR _nombre IS NULL OR _modelo IS NULL OR _motivo IS NULL OR length(trim(_nombre)) NOT BETWEEN 1 AND 100 OR length(trim(_modelo)) NOT BETWEEN 1 AND 100 OR length(trim(_motivo)) NOT BETWEEN 1 AND 2000 OR length(coalesce(_telefono,'')) > 40 OR length(coalesce(_serie,'')) > 100 OR length(coalesce(_observaciones,'')) > 2000 THEN RAISE EXCEPTION 'Datos de recepción inválidos'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(_solicitud::text,0));
 SELECT * INTO r FROM public.recepciones WHERE solicitud_id=_solicitud;
 IF FOUND THEN RETURN r; END IF;
 v_nombre := upper(regexp_replace(trim(_nombre),'\s+',' ','g'));
 PERFORM pg_advisory_xact_lock(hashtextextended(v_nombre,1));
 SELECT cl.id INTO c FROM public.clientes cl WHERE upper(trim(cl.nombre))=v_nombre ORDER BY cl.created_at LIMIT 1;
 IF c IS NULL THEN INSERT INTO public.clientes(nombre,telefono) VALUES(v_nombre,trim(coalesce(_telefono,''))) RETURNING id INTO c;
 ELSE UPDATE public.clientes SET telefono=CASE WHEN trim(coalesce(_telefono,''))<>'' THEN trim(_telefono) ELSE telefono END WHERE id=c; END IF;
 n := 'D-' || lpad(nextval('public.boletas_digitales_seq')::text,6,'0');
 INSERT INTO public.fichas(numero_boleta,fecha_ingreso,cliente_nombre,cliente_telefono,modelo_maquina,numero_serie,mecanico,observaciones,cliente_direccion,origen)
 VALUES(n,_fecha,v_nombre,trim(coalesce(_telefono,'')),trim(_modelo),trim(coalesce(_serie,'')),'',trim(_motivo),'TALLER','digital') RETURNING id INTO f;
 INSERT INTO public.recepciones(solicitud_id,ficha_id,numero,cliente_id,cadena,espada,funda,observaciones,fecha_estimada,motivo_ingreso)
 VALUES(_solicitud,f,n,c,coalesce(_cadena,false),coalesce(_espada,false),coalesce(_funda,false),coalesce(_observaciones,''),_fecha_estimada,trim(_motivo)) RETURNING * INTO r;
 RETURN r;
END; $$;