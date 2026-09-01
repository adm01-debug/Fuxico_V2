
-- Onda 112 — Worker automático para webhook_retry_queue
-- Marca itens elegíveis como 'processing' (SKIP LOCKED), incrementa attempts,
-- calcula exponential backoff. O envio HTTP real é feito por edge function
-- dedicada (invocada pelo cron via pg_net) — esta função apenas seleciona
-- e persiste estado. Suporta idempotência via advisory lock.

CREATE OR REPLACE FUNCTION public.claim_webhook_retries(p_batch_size int DEFAULT 25)
RETURNS TABLE (
  id uuid,
  webhook_id uuid,
  user_id uuid,
  event_type text,
  payload jsonb,
  attempts int,
  max_attempts int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Advisory lock global evita duas execuções concorrentes do worker
  IF NOT pg_try_advisory_xact_lock(hashtext('webhook_retry_worker')) THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH claimed AS (
    SELECT q.id
    FROM public.webhook_retry_queue q
    WHERE q.status = 'pending'
      AND q.next_attempt_at <= now()
      AND q.attempts < q.max_attempts
    ORDER BY q.next_attempt_at ASC
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.webhook_retry_queue q
  SET status = 'processing',
      attempts = q.attempts + 1,
      updated_at = now()
  FROM claimed c
  WHERE q.id = c.id
  RETURNING q.id, q.webhook_id, q.user_id, q.event_type, q.payload, q.attempts, q.max_attempts;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_webhook_retries(int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_webhook_retries(int) TO service_role;

-- Marca resultado final ou reagenda backoff exponencial (base 2^attempts min, cap 60min)
CREATE OR REPLACE FUNCTION public.finalize_webhook_retry(
  p_id uuid,
  p_success boolean,
  p_error text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.webhook_retry_queue%ROWTYPE;
  v_delay_min int;
BEGIN
  SELECT * INTO v_row FROM public.webhook_retry_queue WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;

  IF p_success THEN
    UPDATE public.webhook_retry_queue
    SET status = 'delivered', last_error = NULL, updated_at = now()
    WHERE id = p_id;
    RETURN;
  END IF;

  IF v_row.attempts >= v_row.max_attempts THEN
    UPDATE public.webhook_retry_queue
    SET status = 'abandoned', last_error = p_error, updated_at = now()
    WHERE id = p_id;
    -- Registra evento crítico para observabilidade
    INSERT INTO public.security_events (user_id, event_type, severity, description, metadata)
    VALUES (v_row.user_id, 'webhook_abandoned', 'warning',
            'Webhook abandoned after max retries',
            jsonb_build_object('webhook_id', v_row.webhook_id, 'event', v_row.event_type, 'error', p_error));
    RETURN;
  END IF;

  -- Backoff: 2^attempts minutos, cap 60min, jitter ±15%
  v_delay_min := LEAST(60, POWER(2, v_row.attempts)::int);
  v_delay_min := v_delay_min + ((random() - 0.5) * v_delay_min * 0.3)::int;

  UPDATE public.webhook_retry_queue
  SET status = 'pending',
      next_attempt_at = now() + make_interval(mins => GREATEST(1, v_delay_min)),
      last_error = p_error,
      updated_at = now()
  WHERE id = p_id;
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_webhook_retry(uuid, boolean, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_webhook_retry(uuid, boolean, text) TO service_role;

-- Cron: dispara worker a cada 2 minutos, chamando edge function `webhook-retry-worker`
-- Usa pg_net + internal_config para não hardcodar URL/anon key
DO $$
DECLARE v_url text; v_anon text;
BEGIN
  SELECT value INTO v_url FROM public.internal_config WHERE key = 'functions_base_url';
  SELECT value INTO v_anon FROM public.internal_config WHERE key = 'anon_key';
  IF v_url IS NULL OR v_anon IS NULL THEN
    RAISE NOTICE 'internal_config missing functions_base_url or anon_key; cron skipped';
    RETURN;
  END IF;

  PERFORM cron.unschedule('webhook-retry-worker-2min')
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'webhook-retry-worker-2min');

  PERFORM cron.schedule(
    'webhook-retry-worker-2min',
    '*/2 * * * *',
    format($cron$
      SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer %s'),
        body := '{}'::jsonb,
        timeout_milliseconds := 25000
      );
    $cron$, v_url || '/webhook-retry-worker', v_anon)
  );
END $$;
