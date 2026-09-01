
DO $$
DECLARE
  r RECORD;
  keep_oid oid;
BEGIN
  FOR r IN
    SELECT indrelid, indkey::text AS key
    FROM pg_index
    WHERE indrelid IN (SELECT oid FROM pg_class WHERE relnamespace='public'::regnamespace AND relkind IN ('r','p'))
      AND NOT indisunique
      AND NOT indisprimary
    GROUP BY indrelid, indkey::text
    HAVING count(*) > 1
  LOOP
    SELECT indexrelid INTO keep_oid
    FROM pg_index
    WHERE indrelid = r.indrelid AND indkey::text = r.key
    ORDER BY indexrelid ASC
    LIMIT 1;

    FOR keep_oid IN
      SELECT indexrelid FROM pg_index
      WHERE indrelid = r.indrelid AND indkey::text = r.key AND indexrelid <> (
        SELECT MIN(indexrelid) FROM pg_index
        WHERE indrelid = r.indrelid AND indkey::text = r.key
      )
    LOOP
      EXECUTE format('DROP INDEX IF EXISTS public.%I', (SELECT relname FROM pg_class WHERE oid = keep_oid));
    END LOOP;
  END LOOP;
END $$;
