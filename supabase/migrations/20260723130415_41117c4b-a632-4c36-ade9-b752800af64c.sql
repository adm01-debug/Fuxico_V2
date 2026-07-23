
ALTER TABLE public.partition_archive_log
  ADD COLUMN IF NOT EXISTS checksum_sha256 TEXT,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_status TEXT
    CHECK (verification_status IN ('pending','verified','failed','missing'));

UPDATE public.partition_archive_log
  SET verification_status = 'pending'
  WHERE verification_status IS NULL;

CREATE OR REPLACE FUNCTION public.verify_partition_archive(
  _archive_id UUID,
  _checksum_sha256 TEXT,
  _row_count BIGINT,
  _object_exists BOOLEAN
)
RETURNS TABLE(archive_id UUID, status TEXT, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _rec RECORD;
  _new_status TEXT;
  _msg TEXT;
BEGIN
  SELECT * INTO _rec FROM public.partition_archive_log WHERE id = _archive_id;
  IF NOT FOUND THEN
    RETURN QUERY SELECT _archive_id, 'not_found'::TEXT, 'archive_id inexistente'::TEXT;
    RETURN;
  END IF;

  IF NOT _object_exists THEN
    _new_status := 'missing';
    _msg := 'Objeto ausente no bucket cold-archive';
  ELSIF _rec.row_count IS NOT NULL AND _rec.row_count <> _row_count THEN
    _new_status := 'failed';
    _msg := format('row_count mismatch esperado=%s obtido=%s', _rec.row_count, _row_count);
  ELSE
    _new_status := 'verified';
    _msg := 'ok';
  END IF;

  UPDATE public.partition_archive_log
    SET checksum_sha256 = _checksum_sha256,
        row_count = COALESCE(row_count, _row_count),
        verified_at = now(),
        verification_status = _new_status
    WHERE id = _archive_id;

  IF _new_status <> 'verified' THEN
    INSERT INTO public.security_events (event_type, severity, metadata)
    VALUES (
      'partition_archive_verification_failure',
      'critical',
      jsonb_build_object(
        'archive_id', _archive_id,
        'partition_name', _rec.partition_name,
        'status', _new_status,
        'message', _msg
      )
    );
  END IF;

  RETURN QUERY SELECT _archive_id, _new_status, _msg;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_partition_archive(UUID, TEXT, BIGINT, BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_partition_archive(UUID, TEXT, BIGINT, BOOLEAN) TO service_role;

CREATE OR REPLACE FUNCTION public.admin_stale_archive_verifications()
RETURNS TABLE(
  archive_id UUID,
  partition_name TEXT,
  archived_at TIMESTAMPTZ,
  age_hours NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id, partition_name, archived_at,
    ROUND(EXTRACT(EPOCH FROM (now() - archived_at)) / 3600.0, 2)
  FROM public.partition_archive_log
  WHERE verification_status = 'pending'
    AND archived_at < now() - INTERVAL '1 hour'
  ORDER BY archived_at ASC;
$$;

REVOKE ALL ON FUNCTION public.admin_stale_archive_verifications() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_stale_archive_verifications() TO service_role;
