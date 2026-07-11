-- =============================================================================
-- FUXICO — pgTAP: multi-tenant isolation em webhook_logs e sequence_step_executions
-- Complementa auth-boundary.test.sql cobrindo cadeias FK indiretas (via
-- webhook_configs → user_id e sequence_enrollments → user_id).
-- =============================================================================

BEGIN;
SELECT plan(8);

DO $$
DECLARE
  u1 UUID := gen_random_uuid();
  u2 UUID := gen_random_uuid();
  wc1 UUID; wc2 UUID;
  seq1 UUID; seq2 UUID;
  enr1 UUID; enr2 UUID;
BEGIN
  -- webhook_configs de dois tenants
  INSERT INTO public.webhook_configs (id, user_id, name, url, events, is_active)
    VALUES
      (gen_random_uuid(), u1, 'wc-u1', 'https://x.test/u1', ARRAY['open'], true),
      (gen_random_uuid(), u2, 'wc-u2', 'https://x.test/u2', ARRAY['open'], true)
  RETURNING id INTO wc1;

  SELECT id INTO wc1 FROM public.webhook_configs WHERE user_id = u1 LIMIT 1;
  SELECT id INTO wc2 FROM public.webhook_configs WHERE user_id = u2 LIMIT 1;

  INSERT INTO public.webhook_logs (id, webhook_config_id, event_type, payload, status_code, success)
    VALUES
      (gen_random_uuid(), wc1, 'open', '{"t":1}'::jsonb, 200, true),
      (gen_random_uuid(), wc2, 'open', '{"t":2}'::jsonb, 200, true);

  -- sequences + enrollments + executions
  INSERT INTO public.email_sequences (id, user_id, name)
    VALUES (gen_random_uuid(), u1, 'seq-u1'), (gen_random_uuid(), u2, 'seq-u2');
  SELECT id INTO seq1 FROM public.email_sequences WHERE user_id = u1 LIMIT 1;
  SELECT id INTO seq2 FROM public.email_sequences WHERE user_id = u2 LIMIT 1;

  INSERT INTO public.sequence_enrollments (id, user_id, sequence_id, recipient_email, status)
    VALUES
      (gen_random_uuid(), u1, seq1, 'a@x.test', 'active'),
      (gen_random_uuid(), u2, seq2, 'b@x.test', 'active');
  SELECT id INTO enr1 FROM public.sequence_enrollments WHERE user_id = u1 LIMIT 1;
  SELECT id INTO enr2 FROM public.sequence_enrollments WHERE user_id = u2 LIMIT 1;

  INSERT INTO public.sequence_step_executions (id, enrollment_id, tracking_id, status)
    VALUES
      (gen_random_uuid(), enr1, 'trk-u1', 'sent'),
      (gen_random_uuid(), enr2, 'trk-u2', 'sent');

  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', u1::text, 'role', 'authenticated')::text, true);
  PERFORM set_config('role', 'authenticated', true);
END$$;

-- U1 só vê seus webhook_logs (via join webhook_configs.user_id)
SELECT is(
  (SELECT count(*)::int FROM public.webhook_logs
    WHERE payload->>'t' = '2'),
  0, 'U1 não enxerga webhook_logs do U2'
);
SELECT is(
  (SELECT count(*)::int FROM public.webhook_logs
    WHERE payload->>'t' = '1'),
  1, 'U1 enxerga seus próprios webhook_logs'
);

-- U1 só vê suas próprias step executions
SELECT is(
  (SELECT count(*)::int FROM public.sequence_step_executions
    WHERE tracking_id = 'trk-u2'),
  0, 'U1 não enxerga step_executions do U2'
);
SELECT is(
  (SELECT count(*)::int FROM public.sequence_step_executions
    WHERE tracking_id = 'trk-u1'),
  1, 'U1 enxerga suas próprias step_executions'
);

-- Anon: bloqueio completo nessas tabelas indiretas
RESET ROLE;
SET LOCAL role TO anon;

SELECT is(
  (SELECT count(*)::int FROM public.webhook_logs), 0,
  'anon: 0 webhook_logs'
);
SELECT is(
  (SELECT count(*)::int FROM public.webhook_configs), 0,
  'anon: 0 webhook_configs'
);
SELECT is(
  (SELECT count(*)::int FROM public.sequence_step_executions), 0,
  'anon: 0 sequence_step_executions'
);
SELECT is(
  (SELECT count(*)::int FROM public.sequence_enrollments), 0,
  'anon: 0 sequence_enrollments'
);

SELECT * FROM finish();
ROLLBACK;
