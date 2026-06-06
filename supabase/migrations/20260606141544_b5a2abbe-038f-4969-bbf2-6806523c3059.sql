DROP POLICY IF EXISTS "Despieces lectura publica" ON storage.objects;
CREATE POLICY "Despieces lectura autenticada"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'despieces');