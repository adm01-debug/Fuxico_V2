-- Guarda de autenticacao nos endpoints disparados por cron.
--
-- alert-dispatcher, cold-archive-verifier e webhook-retry-worker rodam com
-- service_role e respondiam 200 para qualquer requisicao anonima. Verificado em
-- producao antes desta migration:
--   GET /functions/v1/alert-dispatcher        (sem header) -> 200
--   GET /functions/v1/cold-archive-verifier    (sem header) -> 200
--   GET /functions/v1/webhook-retry-worker     (sem header) -> 200
-- Ou seja: qualquer pessoa na internet podia disparar o envio de alertas para o
-- Slack e o reenvio de webhooks.
--
-- Esta migration:
--   1. cria o token `cron_secret` em public.internal_config (tabela com
--      relrowsecurity e policy "no public access", so service_role le);
--   2. reagenda os jobs de cron existentes para enviarem o header
--      x-cron-secret resolvido do banco em tempo de execucao -- o mesmo padrao
--      que o job `fuxico-ab-test-dispatch` ja usava;
--   3. cria o job `webhook-retry-worker-2min`, documentado desde a migration
--      20260723120808 mas nunca criado (internal_config nao tinha
--      functions_base_url/anon_key), o que deixava o worker orfao: a fila
--      webhook_retry_queue nunca era drenada.
--
-- A partir daqui as edge functions recusam chamadas sem o header (401) e
-- recusam tudo (503) se o token nao estiver configurado -- fail-closed.
--
-- Idempotente: INSERT ... ON CONFLICT DO NOTHING e unschedule antes de schedule.

INSERT INTO public.internal_config (key, value)
VALUES ('cron_secret', encode(extensions.gen_random_bytes(32), 'hex'))
ON CONFLICT (key) DO NOTHING;

DO $$
DECLARE
  v_ref text := 'xmyvefffgltlrobazrmg';
BEGIN
  PERFORM cron.unschedule(jobname)
  FROM cron.job
  WHERE jobname IN ('fuxico-dispatch-alerts', 'cold-archive-verifier', 'webhook-retry-worker-2min');

  PERFORM cron.schedule('cold-archive-verifier', '*/15 * * * *', format($cron$
    SELECT net.http_post(
      url := 'https://%s.supabase.co/functions/v1/cold-archive-verifier',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (SELECT value FROM public.internal_config WHERE key = 'cron_secret')
      ),
      body := jsonb_build_object('trigger', 'cron', 'ts', now()),
      timeout_milliseconds := 25000
    );
  $cron$, v_ref));

  PERFORM cron.schedule('fuxico-dispatch-alerts', '*/5 * * * *', format($cron$
    SELECT public.safe_http_post(
      _job_name := 'fuxico-dispatch-alerts',
      _url := 'https://%s.supabase.co/functions/v1/alert-dispatcher',
      _headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (SELECT value FROM public.internal_config WHERE key = 'cron_secret')
      ),
      _body := jsonb_build_object('trigger', 'cron', 'at', now())
    );
  $cron$, v_ref));

  PERFORM cron.schedule('webhook-retry-worker-2min', '*/2 * * * *', format($cron$
    SELECT net.http_post(
      url := 'https://%s.supabase.co/functions/v1/webhook-retry-worker',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (SELECT value FROM public.internal_config WHERE key = 'cron_secret')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 25000
    );
  $cron$, v_ref));
END $$;