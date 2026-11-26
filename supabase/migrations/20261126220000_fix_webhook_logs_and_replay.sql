-- Corrige a cadeia de logs e reenvio de webhooks.
--
-- 1) A edge webhook-dispatch grava colunas de diagnostico que nunca
--    existiram em public.webhook_logs (attempts/duration_ms), e por isso
--    o INSERT falhava silenciosamente: a tabela ficou sempre vazia e a
--    tela "Historico de Envios" nunca mostrava nada.
-- 2) public.replay_failed_webhooks referenciava wl.status_code e
--    wl.request_payload, colunas que tambem nao existem (os nomes reais
--    sao response_status e payload). A funcao quebrava em runtime com
--    42703, entao a fila webhook_retry_queue nunca era alimentada.

ALTER TABLE public.webhook_logs
  ADD COLUMN IF NOT EXISTS attempts integer,
  ADD COLUMN IF NOT EXISTS duration_ms integer;

CREATE OR REPLACE FUNCTION public.replay_failed_webhooks(
  _webhook_id uuid,
  _limit int DEFAULT 50
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_owner uuid;
  v_enqueued int := 0;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  SELECT user_id INTO v_owner FROM public.webhook_configs WHERE id = _webhook_id;
  IF v_owner IS NULL OR v_owner <> v_user THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  WITH candidates AS (
    SELECT wl.id, wl.webhook_id, wl.user_id, wl.event_type, wl.payload
    FROM public.webhook_logs wl
    WHERE wl.webhook_id = _webhook_id
      AND wl.user_id = v_user
      AND wl.success = false
      AND (wl.response_status IS NULL OR wl.response_status >= 500)
      AND wl.created_at >= now() - interval '24 hours'
      AND NOT EXISTS (
        SELECT 1 FROM public.webhook_retry_queue wrq
        WHERE wrq.source_log_id = wl.id
      )
    ORDER BY wl.created_at DESC
    LIMIT greatest(1, least(_limit, 200))
  ), inserted AS (
    INSERT INTO public.webhook_retry_queue (
      webhook_id, user_id, event_type, payload, source_log_id
    )
    SELECT webhook_id, user_id, event_type, COALESCE(payload, '{}'::jsonb), id FROM candidates
    RETURNING 1
  )
  SELECT count(*)::int INTO v_enqueued FROM inserted;

  RETURN jsonb_build_object(
    'webhook_id', _webhook_id,
    'enqueued', v_enqueued
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.replay_failed_webhooks(uuid, int) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.replay_failed_webhooks(uuid, int) FROM anon, PUBLIC;