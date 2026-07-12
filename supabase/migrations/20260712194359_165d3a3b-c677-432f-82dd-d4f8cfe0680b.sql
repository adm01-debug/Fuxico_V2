
-- =====================================================================
-- Onda 7: BRIN indexes + statistics tuning para tabelas time-series
-- BRIN é ~1000x menor que btree para colunas correlacionadas com heap
-- (append-only). Statistics target elevado melhora planner em colunas
-- de alta cardinalidade usadas em joins e filtros.
-- =====================================================================

-- BRIN em created_at das tabelas particionadas (append-only por natureza)
DO $$
DECLARE
  parent_table TEXT;
  part RECORD;
BEGIN
  FOREACH parent_table IN ARRAY ARRAY[
    'webhook_logs','audit_logs','rate_limit_logs',
    'security_events','login_attempts','tracking_events'
  ] LOOP
    FOR part IN
      SELECT c.relname
      FROM pg_inherits i
      JOIN pg_class c ON c.oid = i.inhrelid
      WHERE i.inhparent = ('public.'||parent_table)::regclass
    LOOP
      EXECUTE format(
        'CREATE INDEX IF NOT EXISTS %I ON public.%I USING brin (created_at) WITH (pages_per_range = 32)',
        part.relname || '_created_at_brin',
        part.relname
      );
    END LOOP;
  END LOOP;
END$$;

-- Statistics target elevado para colunas de alta cardinalidade
-- (planner amostra mais valores → estimativas melhores → planos melhores)
ALTER TABLE public.tracked_emails ALTER COLUMN tracking_id SET STATISTICS 1000;
ALTER TABLE public.tracked_emails ALTER COLUMN user_id SET STATISTICS 500;
ALTER TABLE public.tracked_emails ALTER COLUMN recipient_email SET STATISTICS 500;

ALTER TABLE public.sequence_enrollments ALTER COLUMN sequence_id SET STATISTICS 500;
ALTER TABLE public.sequence_enrollments ALTER COLUMN user_id SET STATISTICS 500;

ALTER TABLE public.campaigns ALTER COLUMN user_id SET STATISTICS 500;
ALTER TABLE public.email_sequences ALTER COLUMN user_id SET STATISTICS 500;
ALTER TABLE public.contact_scores ALTER COLUMN user_id SET STATISTICS 500;
ALTER TABLE public.domain_reputation ALTER COLUMN user_id SET STATISTICS 500;

-- ANALYZE para propagar novas estatísticas imediatamente
ANALYZE public.tracked_emails;
ANALYZE public.sequence_enrollments;
ANALYZE public.campaigns;
ANALYZE public.email_sequences;
ANALYZE public.contact_scores;
ANALYZE public.domain_reputation;
