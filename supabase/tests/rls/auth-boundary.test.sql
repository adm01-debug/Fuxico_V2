-- =============================================================================
-- FUXICO — pgTAP Auth Boundary Tests
-- Valida que usuários autenticados só enxergam seus próprios registros
-- em tabelas críticas de tenant (multi-user isolation).
-- =============================================================================

BEGIN;
SELECT plan(12);

-- Simula dois usuários distintos
DO $$
DECLARE
  u1 UUID := gen_random_uuid();
  u2 UUID := gen_random_uuid();
BEGIN
  -- Setup: registros de dois usuários em tabelas críticas
  INSERT INTO public.campaigns (id, user_id, name)
    VALUES (gen_random_uuid(), u1, 'c-u1'), (gen_random_uuid(), u2, 'c-u2');
  INSERT INTO public.email_sequences (id, user_id, name)
    VALUES (gen_random_uuid(), u1, 's-u1'), (gen_random_uuid(), u2, 's-u2');
  INSERT INTO public.tracked_emails (id, user_id, tracking_id, recipient_email, subject)
    VALUES
      (gen_random_uuid(), u1, 'trk-u1', 'a@x.com', 't1'),
      (gen_random_uuid(), u2, 'trk-u2', 'b@x.com', 't2');

  -- Assume role authenticated + set JWT claim para u1
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', u1::text, 'role', 'authenticated')::text, true);
  PERFORM set_config('role', 'authenticated', true);
END$$;

-- U1 só vê os seus
SELECT is(
  (SELECT count(*)::int FROM public.campaigns WHERE name = 'c-u2'),
  0, 'U1 não enxerga campaigns de U2'
);
SELECT is(
  (SELECT count(*)::int FROM public.campaigns WHERE name = 'c-u1'),
  1, 'U1 enxerga suas próprias campaigns'
);
SELECT is(
  (SELECT count(*)::int FROM public.email_sequences WHERE name = 's-u2'),
  0, 'U1 não enxerga sequences de U2'
);
SELECT is(
  (SELECT count(*)::int FROM public.email_sequences WHERE name = 's-u1'),
  1, 'U1 enxerga suas próprias sequences'
);
SELECT is(
  (SELECT count(*)::int FROM public.tracked_emails WHERE tracking_id = 'trk-u2'),
  0, 'U1 não enxerga tracked_emails de U2'
);
SELECT is(
  (SELECT count(*)::int FROM public.tracked_emails WHERE tracking_id = 'trk-u1'),
  1, 'U1 enxerga seus próprios tracked_emails'
);

-- Anon não enxerga nada em nenhuma tabela sensível
RESET ROLE;
SET LOCAL role TO anon;

SELECT is(
  (SELECT count(*)::int FROM public.campaigns), 0,
  'anon: 0 campaigns'
);
SELECT is(
  (SELECT count(*)::int FROM public.email_sequences), 0,
  'anon: 0 email_sequences'
);
SELECT is(
  (SELECT count(*)::int FROM public.contact_scores), 0,
  'anon: 0 contact_scores'
);
SELECT is(
  (SELECT count(*)::int FROM public.webhook_logs), 0,
  'anon: 0 webhook_logs'
);
SELECT is(
  (SELECT count(*)::int FROM public.sequence_step_executions), 0,
  'anon: 0 sequence_step_executions'
);
SELECT is(
  (SELECT count(*)::int FROM public.audit_logs), 0,
  'anon: 0 audit_logs'
);

SELECT * FROM finish();
ROLLBACK;
