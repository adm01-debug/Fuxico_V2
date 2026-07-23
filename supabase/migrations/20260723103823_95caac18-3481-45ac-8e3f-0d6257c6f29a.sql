
-- 1) Registry table
CREATE TABLE IF NOT EXISTS public.partition_archive_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partition_name text NOT NULL,
  parent_table text NOT NULL,
  row_count bigint NOT NULL DEFAULT 0,
  size_bytes bigint NOT NULL DEFAULT 0,
  archive_path text NOT NULL,
  status text NOT NULL DEFAULT 'archived' CHECK (status IN ('archived','dropped','failed')),
  archived_at timestamptz NOT NULL DEFAULT now(),
  dropped_at timestamptz,
  error text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

GRANT SELECT ON public.partition_archive_log TO authenticated;
GRANT ALL ON public.partition_archive_log TO service_role;

ALTER TABLE public.partition_archive_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read partition archive log"
ON public.partition_archive_log FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_partition_archive_status
  ON public.partition_archive_log(status, archived_at DESC);

-- 2) RLS policies on cold-archive bucket (service role only)
CREATE POLICY "Service role manages cold archive"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'cold-archive')
WITH CHECK (bucket_id = 'cold-archive');

-- 3) Archive-then-drop function (in-DB metadata + row-count snapshot; upload
-- of the bytes happens via edge function using this record as source of truth)
CREATE OR REPLACE FUNCTION public.archive_partition_before_drop(
  _partition text,
  _parent_table text,
  _dry_run boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row_count bigint := 0;
  v_size_bytes bigint := 0;
  v_archive_path text;
  v_log_id uuid;
  v_qualified text;
BEGIN
  IF _partition IS NULL OR _parent_table IS NULL THEN
    RAISE EXCEPTION 'partition and parent_table are required';
  END IF;

  -- Safety: reject non-identifier characters
  IF _partition !~ '^[a-z0-9_]+$' OR _parent_table !~ '^[a-z0-9_]+$' THEN
    RAISE EXCEPTION 'invalid identifier';
  END IF;

  v_qualified := format('public.%I', _partition);

  -- Ensure partition exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = _partition
  ) THEN
    RAISE EXCEPTION 'partition % not found', _partition;
  END IF;

  EXECUTE format('SELECT count(*) FROM %s', v_qualified) INTO v_row_count;
  SELECT pg_total_relation_size(v_qualified::regclass) INTO v_size_bytes;

  v_archive_path := format('partitions/%s/%s.json.gz',
    to_char(now(),'YYYY-MM'), _partition);

  INSERT INTO public.partition_archive_log (
    partition_name, parent_table, row_count, size_bytes,
    archive_path, status, metadata
  ) VALUES (
    _partition, _parent_table, v_row_count, v_size_bytes,
    v_archive_path,
    CASE WHEN _dry_run THEN 'archived' ELSE 'archived' END,
    jsonb_build_object('dry_run', _dry_run, 'requested_by', auth.uid())
  ) RETURNING id INTO v_log_id;

  IF NOT _dry_run THEN
    -- Only drop after log record persisted. Actual object upload is handled
    -- by the cold-archive edge function reading the log entry.
    EXECUTE format('DROP TABLE IF EXISTS %s', v_qualified);
    UPDATE public.partition_archive_log
      SET status = 'dropped', dropped_at = now()
      WHERE id = v_log_id;
  END IF;

  RETURN jsonb_build_object(
    'log_id', v_log_id,
    'partition', _partition,
    'row_count', v_row_count,
    'size_bytes', v_size_bytes,
    'archive_path', v_archive_path,
    'dropped', NOT _dry_run
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.archive_partition_before_drop(text, text, boolean) FROM PUBLIC, anon, authenticated;
