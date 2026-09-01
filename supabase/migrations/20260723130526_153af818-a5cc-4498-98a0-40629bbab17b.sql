
-- Onda 115: Agenda o verificador de cold-archive a cada 15 minutos.
DO $$
DECLARE
  v_url text;
  v_anon text;
BEGIN
  SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name = 'project_url' LIMIT 1;
  SELECT decrypted_secret INTO v_anon FROM vault.decrypted_secrets WHERE name = 'anon_key' LIMIT 1;

  PERFORM cron.unschedule('cold-archive-verifier');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'cold-archive-verifier',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://blopallcxuotfutblkoe.supabase.co/functions/v1/cold-archive-verifier',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'apikey','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsb3BhbGxjeHVvdGZ1dGJsa29lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODE2MzUsImV4cCI6MjA5NDI1NzYzNX0.UllwdgdAAE-9gqQiAmq4yKkdDxcSnPT9pma7aPRms9U'
    ),
    body := jsonb_build_object('trigger','cron','ts',now())
  );
  $$
);
