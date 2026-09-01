
CREATE TABLE IF NOT EXISTS public.webhook_retry_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid NOT NULL REFERENCES public.webhook_configs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  max_attempts int NOT NULL DEFAULT 5,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','delivered','abandoned')),
  last_error text,
  source_log_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE, DELETE ON public.webhook_retry_queue TO authenticated;
GRANT ALL ON public.webhook_retry_queue TO service_role;

ALTER TABLE public.webhook_retry_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own webhook retry queue"
ON public.webhook_retry_queue FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_wrq_pending
  ON public.webhook_retry_queue(next_attempt_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_wrq_webhook_user
  ON public.webhook_retry_queue(webhook_id, user_id, created_at DESC);

CREATE TRIGGER trg_wrq_updated_at
  BEFORE UPDATE ON public.webhook_retry_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Replay function: enqueue recent 5xx failures for a webhook owned by caller
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
    SELECT wl.id, wl.webhook_id, wl.user_id, wl.event_type, wl.request_payload
    FROM public.webhook_logs wl
    WHERE wl.webhook_id = _webhook_id
      AND wl.user_id = v_user
      AND wl.success = false
      AND wl.status_code >= 500
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
    SELECT webhook_id, user_id, event_type, request_payload, id FROM candidates
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
