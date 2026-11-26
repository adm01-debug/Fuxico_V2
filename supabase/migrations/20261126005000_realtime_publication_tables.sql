-- =============================================================================
-- Funcionalidade morta: o Realtime do front nunca recebeu um unico evento porque
-- a publication `supabase_realtime` estava VAZIA em producao (0 tabelas).
--
-- Projeto de producao: xmyvefffgltlrobazrmg
--
-- Sintoma medido em producao ANTES do fix:
--   SELECT count(*) FROM pg_publication_tables WHERE pubname='supabase_realtime'
--   -> 0
--
-- O repositorio, no entanto, declara 8 `ALTER PUBLICATION ... ADD TABLE` em
-- migrations antigas (20251217174110 tracking_events, 20251217181541
-- document_events, 20251217182226 link_click_events, 20251218124752
-- fraud_alerts, 20251220143355 follow_up_reminders, 20251223005640
-- bounce_alerts, 20251231120131 security_events + rate_limit_logs). O banco
-- divergiu do repositorio e o trabalho nunca chegou em producao.
--
-- A nona tabela, `tracked_emails`, nao aparece em nenhuma migration, mas e
-- consumida por `src/components/dashboard/RealtimeAnalyticsTab.tsx:85`.
--
-- Consumidores no front (todos com `.on('postgres_changes', ...)`):
--   src/components/dashboard/DashboardHome.tsx:172        -> tracking_events
--   src/components/dashboard/RealtimeAnalyticsTab.tsx:85  -> tracked_emails
--   src/components/dashboard/RealtimeAnalyticsTab.tsx:103 -> link_click_events
--   src/hooks/use-realtime-notifications.ts:213           -> tracking_events
--   src/hooks/use-realtime-notifications.ts:242           -> fraud_alerts
--
-- Sem as tabelas na publication esses tres recursos ficam silenciosamente
-- mortos: o canal abre, o `subscribe()` responde SUBSCRIBED e nada chega nunca.
--
-- `publish_via_partition_root = true` e obrigatorio para `tracking_events`,
-- `security_events` e `rate_limit_logs`, que sao tabelas PARTICIONADAS: sem essa
-- opcao o INSERT na particao nao e publicado em nome da tabela pai e o evento
-- nao sai com `table = 'tracking_events'`, que e o nome que o front escuta.
--
-- Entrega respeita RLS: as 9 tabelas tem `relrowsecurity = true` e exatamente
-- 1 policy de SELECT escopada por `auth.uid()` ou `has_role(auth.uid(),'admin')`
-- (verificado em pg_policies). O Realtime do Supabase aplica essa mesma RLS
-- antes de entregar o evento, entao publicar nao amplia visibilidade.
--
-- DEPOIS do fix: pg_publication_tables -> 9 tabelas; pg_publication.pubviaroot
-- -> true. Subscribe real no websocket (apikey publica) confirmou "Subscribed to
-- PostgreSQL" nos 9 topicos.
--
-- Idempotente: o bloco DO so adiciona o que ainda nao esta na publication.
-- =============================================================================

ALTER PUBLICATION supabase_realtime SET (publish_via_partition_root = true);

DO $pub$
DECLARE
  t text;
  tabelas text[] := ARRAY[
    'tracking_events',
    'tracked_emails',
    'link_click_events',
    'fraud_alerts',
    'document_events',
    'follow_up_reminders',
    'bounce_alerts',
    'security_events',
    'rate_limit_logs'
  ];
BEGIN
  FOREACH t IN ARRAY tabelas LOOP
    IF EXISTS (
      SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = t
    ) AND NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END
$pub$;