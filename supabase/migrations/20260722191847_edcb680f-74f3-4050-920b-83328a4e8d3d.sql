CREATE TABLE IF NOT EXISTS public.webhook_idempotency (
  webhook_id uuid NOT NULL,
  idempotency_key text NOT NULL,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (webhook_id, idempotency_key)
);

GRANT ALL ON public.webhook_idempotency TO service_role;
REVOKE ALL ON public.webhook_idempotency FROM anon, authenticated, PUBLIC;

ALTER TABLE public.webhook_idempotency ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "no public access" ON public.webhook_idempotency;
CREATE POLICY "no public access" ON public.webhook_idempotency FOR ALL USING (false) WITH CHECK (false);

CREATE INDEX IF NOT EXISTS idx_webhook_idempotency_first_seen
  ON public.webhook_idempotency (first_seen_at);

CREATE OR REPLACE FUNCTION public.try_claim_webhook_idempotency(_webhook_id uuid, _key text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _webhook_id IS NULL OR _key IS NULL OR length(_key) = 0 THEN
    RETURN true; -- sem chave => segue normal
  END IF;
  BEGIN
    INSERT INTO public.webhook_idempotency (webhook_id, idempotency_key)
    VALUES (_webhook_id, _key);
    RETURN true;
  EXCEPTION WHEN unique_violation THEN
    RETURN false;
  END;
END;
$$;

REVOKE ALL ON FUNCTION public.try_claim_webhook_idempotency(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.try_claim_webhook_idempotency(uuid, text) TO service_role;

CREATE OR REPLACE FUNCTION public.cleanup_webhook_idempotency()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_count integer;
BEGIN
  WITH d AS (
    DELETE FROM public.webhook_idempotency WHERE first_seen_at < now() - interval '7 days' RETURNING 1
  )
  SELECT count(*) INTO v_count FROM d;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_webhook_idempotency() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_webhook_idempotency() TO service_role;