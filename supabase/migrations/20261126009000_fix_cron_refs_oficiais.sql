-- Fixa o ref de projeto nos cron jobs de alerta (Slack) e de cold-archive.
--
-- Os dois jobs nasceram em migrations antigas apontando para o ref 'blopallcxuotfutblkoe',
-- que hoje nao resolve no DNS. O banco de producao ja foi corrigido a mao; esta migration
-- versiona o estado correto para que um ambiente novo (ou um `supabase db reset`) nao
-- recrie os jobs apontando para um projeto morto.
--
-- Idempotente: unschedule antes de schedule. Seguro reexecutar.
DO $$
DECLARE
  v_ref  text := 'xmyvefffgltlrobazrmg';
  v_anon text := 'sb_publishable_vqZFXcaDwwXEy5XSldvTeg_Zn6lp-AQ';
BEGIN
  PERFORM cron.unschedule(jobname)
  FROM cron.job
  WHERE jobname IN ('fuxico-dispatch-alerts', 'cold-archive-verifier');

  PERFORM cron.schedule('cold-archive-verifier', '*/15 * * * *', format($cron$
    SELECT net.http_post(
      url := 'https://%s.supabase.co/functions/v1/cold-archive-verifier',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', '%s'
      ),
      body := jsonb_build_object('trigger', 'cron', 'ts', now())
    );
  $cron$, v_ref, v_anon));

  PERFORM cron.schedule('fuxico-dispatch-alerts', '*/5 * * * *', format($cron$
    SELECT public.safe_http_post(
      _job_name := 'fuxico-dispatch-alerts',
      _url := 'https://%s.supabase.co/functions/v1/alert-dispatcher',
      _headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', '%s'
      ),
      _body := jsonb_build_object('trigger', 'cron', 'at', now())
    );
  $cron$, v_ref, v_anon));
END $$;