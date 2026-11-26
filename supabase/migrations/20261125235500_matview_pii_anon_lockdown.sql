-- =============================================================================
-- Fecha a leitura anonima de PII nas materialized views de tracking.
--
-- Projeto: xmyvefffgltlrobazrmg
--
-- Materialized view NAO suporta RLS nem `security_invoker`. O unico controle de
-- acesso possivel e o GRANT. Enquanto a tabela base `tracked_emails` respeita a
-- RLS e devolve [] para anon, `email_stats_mv` e uma copia fisica sem policy.
--
-- Evidencia coletada por probe real com a chave publica, SEM login, ANTES do fix:
--   GET /rest/v1/email_stats_mv?select=id,recipient_email,sender_email,subject&limit=3
--     -> HTTP 200 com PII de todos os tenants:
--        [{"id":"1d6a4c54-...","recipient_email":"cliente1@empresa.com",
--          "sender_email":"ti@promobrindes.com.br","subject":"Proposta Comercial Q4"}, ...]
--   GET /rest/v1/tracked_emails?select=id,recipient_email&limit=3
--     -> [] (RLS da tabela base funcionando)
--
-- As migrations 20260712191806 (email_stats_mv) e 20260712221858
-- (tracking_events_monthly_agg) ja executavam este REVOKE, mas o estado real do
-- banco divergiu do historico (o objeto foi recriado depois e o DROP leva os
-- grants embora). Por isso a correcao e reaplicada aqui de forma idempotente.
-- =============================================================================

DO $mig$
DECLARE
  v_obj text;
BEGIN
  FOREACH v_obj IN ARRAY ARRAY[
    'email_stats_mv',
    'tracking_events_monthly_agg'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = v_obj AND c.relkind = 'm'
    ) THEN
      EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon, authenticated', v_obj);
      EXECUTE format('GRANT SELECT ON public.%I TO service_role', v_obj);
    END IF;
  END LOOP;
END $mig$;

-- v_tracking_summary ja tem security_invoker=on (respeita a RLS e devolve [] para
-- anon), mas nao existe consumidor anonimo legitimo: o front passa pelas RPCs
-- auto-escopadas. Revogar reduz a superficie sem mudar comportamento.
REVOKE ALL ON public.v_tracking_summary FROM PUBLIC, anon;
GRANT SELECT ON public.v_tracking_summary TO authenticated, service_role;
