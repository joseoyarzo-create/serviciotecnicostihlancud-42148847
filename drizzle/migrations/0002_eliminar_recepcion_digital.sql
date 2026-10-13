CREATE OR REPLACE FUNCTION public.eliminar_recepcion_digital(_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE r public.recepciones;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Debe iniciar sesión' USING ERRCODE='42501'; END IF;
  SELECT * INTO r FROM public.recepciones WHERE id = _id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Recepción no encontrada'; END IF;
  DELETE FROM public.recepciones WHERE id = r.id;
  DELETE FROM public.fichas WHERE id = r.ficha_id AND origen = 'digital';
END;
$function$;
GRANT EXECUTE ON FUNCTION public.eliminar_recepcion_digital(uuid) TO authenticated;