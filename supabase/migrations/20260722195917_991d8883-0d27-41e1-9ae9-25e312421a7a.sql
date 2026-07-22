
CREATE TABLE IF NOT EXISTS public.webhook_circuit_state (
  webhook_id UUID PRIMARY KEY REFERENCES public.webhook_configs(id) ON DELETE CASCADE,
  state TEXT NOT NULL DEFAULT 'closed' CHECK (state IN ('closed','open','half_open')),
  consecutive_failures INT NOT NULL DEFAULT 0,
  opened_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  next_probe_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.webhook_circuit_state TO authenticated;
GRANT ALL ON public.webhook_circuit_state TO service_role;

ALTER TABLE public.webhook_circuit_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own circuit state"
  ON public.webhook_circuit_state FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.webhook_configs wc
    WHERE wc.id = webhook_circuit_state.webhook_id
      AND wc.user_id = auth.uid()
  ));

CREATE POLICY "Service role manages circuit state"
  ON public.webhook_circuit_state FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Can we dispatch? Returns true/false; transitions open->half_open when cooldown elapsed.
CREATE OR REPLACE FUNCTION public.wcb_can_dispatch(_webhook_id UUID, _cooldown_seconds INT DEFAULT 600)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  st RECORD;
BEGIN
  SELECT * INTO st FROM public.webhook_circuit_state WHERE webhook_id = _webhook_id FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.webhook_circuit_state(webhook_id) VALUES (_webhook_id)
    ON CONFLICT DO NOTHING;
    RETURN TRUE;
  END IF;
  IF st.state = 'closed' OR st.state = 'half_open' THEN
    RETURN TRUE;
  END IF;
  -- open: check cooldown
  IF st.opened_at IS NOT NULL AND st.opened_at + make_interval(secs => _cooldown_seconds) <= now() THEN
    UPDATE public.webhook_circuit_state
      SET state = 'half_open', next_probe_at = now(), updated_at = now()
      WHERE webhook_id = _webhook_id;
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.wcb_record_result(
  _webhook_id UUID,
  _success BOOLEAN,
  _failure_threshold INT DEFAULT 5,
  _failure_window_seconds INT DEFAULT 300
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  st RECORD;
BEGIN
  INSERT INTO public.webhook_circuit_state(webhook_id) VALUES (_webhook_id)
  ON CONFLICT (webhook_id) DO NOTHING;

  SELECT * INTO st FROM public.webhook_circuit_state WHERE webhook_id = _webhook_id FOR UPDATE;

  IF _success THEN
    UPDATE public.webhook_circuit_state
      SET state = 'closed',
          consecutive_failures = 0,
          last_success_at = now(),
          opened_at = NULL,
          next_probe_at = NULL,
          updated_at = now()
      WHERE webhook_id = _webhook_id;
  ELSE
    DECLARE
      new_count INT;
    BEGIN
      -- Reset failure counter if last failure is outside the window.
      IF st.last_failure_at IS NULL
         OR st.last_failure_at + make_interval(secs => _failure_window_seconds) < now() THEN
        new_count := 1;
      ELSE
        new_count := st.consecutive_failures + 1;
      END IF;
      UPDATE public.webhook_circuit_state
        SET consecutive_failures = new_count,
            last_failure_at = now(),
            state = CASE WHEN new_count >= _failure_threshold THEN 'open' ELSE state END,
            opened_at = CASE
              WHEN new_count >= _failure_threshold AND state <> 'open' THEN now()
              ELSE opened_at
            END,
            updated_at = now()
        WHERE webhook_id = _webhook_id;
    END;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.wcb_can_dispatch(UUID, INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.wcb_record_result(UUID, BOOLEAN, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.wcb_can_dispatch(UUID, INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.wcb_record_result(UUID, BOOLEAN, INT, INT) TO service_role;
