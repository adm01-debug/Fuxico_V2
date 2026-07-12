-- Onda 23: Cron job para dispatch de alertas via Slack a cada 5 minutos
DO $$
DECLARE
  v_project_ref text := 'blopallcxuotfutblkoe';
  v_anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsb3BhbGxjeHVvdGZ1dGJsa29lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODE2MzUsImV4cCI6MjA5NDI1NzYzNX0.UllwdgdAAE-9gqQiAmq4yKkdDxcSnPT9pma7aPRms9U';
BEGIN
  -- Remove job antigo se existir (idempotente)
  PERFORM cron.unschedule('fuxico-dispatch-alerts')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'fuxico-dispatch-alerts');

  PERFORM cron.schedule(
    'fuxico-dispatch-alerts',
    '*/5 * * * *',
    format($cron$
      SELECT net.http_post(
        url := 'https://%s.supabase.co/functions/v1/alert-dispatcher',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'apikey', '%s',
          'Authorization', 'Bearer %s'
        ),
        body := jsonb_build_object('trigger', 'cron', 'ts', now())
      ) AS request_id;
    $cron$, v_project_ref, v_anon_key, v_anon_key)
  );
END $$;