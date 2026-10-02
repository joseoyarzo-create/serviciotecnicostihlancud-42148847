DROP FUNCTION IF EXISTS public.get_ficha_publica(uuid);
CREATE FUNCTION public.get_ficha_publica(_token uuid)
RETURNS TABLE (
  numero_boleta text, fecha_ingreso timestamptz, fecha_reparacion timestamptz, fecha_entrega timestamptz,
  cliente_nombre text, cliente_telefono text, modelo_maquina text, numero_serie text, mecanico text,
  repuestos jsonb, servicios jsonb, observaciones text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT numero_boleta, fecha_ingreso, fecha_reparacion, fecha_entrega, cliente_nombre, cliente_telefono,
         modelo_maquina, numero_serie, mecanico, repuestos, servicios, observaciones
  FROM public.fichas WHERE public_token = _token LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.get_ficha_publica(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_ficha_publica(uuid) TO anon, authenticated;