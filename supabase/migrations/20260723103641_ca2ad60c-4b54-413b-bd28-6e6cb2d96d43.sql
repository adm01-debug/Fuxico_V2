
-- RLS policies for dsar-exports storage bucket
CREATE POLICY "Users read own DSAR exports"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'dsar-exports'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Service role manages DSAR exports"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'dsar-exports')
WITH CHECK (bucket_id = 'dsar-exports');
