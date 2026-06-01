
-- 1) Normalize fichas.cliente_nombre first so they keep matching
UPDATE public.fichas
SET cliente_nombre = upper(btrim(cliente_nombre))
WHERE cliente_nombre IS NOT NULL
  AND cliente_nombre <> upper(btrim(cliente_nombre));

-- 2) Normalize clientes.nombre
UPDATE public.clientes
SET nombre = upper(btrim(nombre))
WHERE nombre <> upper(btrim(nombre));

-- 3) For each group, pick a "keeper" (oldest created_at), aggregate puntos/telefono/direccion onto it,
--    then delete the rest.
WITH grouped AS (
  SELECT
    nombre,
    (ARRAY_AGG(id ORDER BY created_at ASC))[1] AS keep_id,
    ARRAY_AGG(id) AS all_ids,
    SUM(COALESCE(puntos, 0)) AS total_puntos,
    -- first non-empty telefono
    (ARRAY_AGG(telefono ORDER BY (CASE WHEN telefono IS NULL OR btrim(telefono) = '' THEN 1 ELSE 0 END), created_at ASC))[1] AS best_telefono,
    (ARRAY_AGG(direccion ORDER BY (CASE WHEN direccion IS NULL OR btrim(direccion) = '' THEN 1 ELSE 0 END), created_at ASC))[1] AS best_direccion
  FROM public.clientes
  GROUP BY nombre
  HAVING COUNT(*) > 1
)
UPDATE public.clientes c
SET
  puntos = g.total_puntos,
  telefono = g.best_telefono,
  direccion = g.best_direccion
FROM grouped g
WHERE c.id = g.keep_id;

-- 4) Delete duplicates (everything not in keep_id)
DELETE FROM public.clientes c
USING (
  SELECT
    nombre,
    (ARRAY_AGG(id ORDER BY created_at ASC))[1] AS keep_id
  FROM public.clientes
  GROUP BY nombre
  HAVING COUNT(*) > 1
) g
WHERE c.nombre = g.nombre
  AND c.id <> g.keep_id;

-- 5) Add a unique index on normalized name to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS clientes_nombre_unique_idx
  ON public.clientes (nombre);
