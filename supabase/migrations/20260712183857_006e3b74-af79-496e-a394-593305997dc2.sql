
-- =============================================================================
-- Onda 2 — Optimistic Locking (version columns) + EXCLUDE constraints
-- =============================================================================
-- Adiciona coluna `version INT NOT NULL DEFAULT 1` + trigger de incremento
-- automático em tabelas críticas mutáveis que ainda não possuíam.
-- Reaproveita a função pública `public.increment_version_column()` já existente.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Tabelas alvo (mutáveis, críticas, com risco de escrita concorrente)
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'scheduled_emails',
    'sequence_enrollments',
    'sequence_steps',
    'ab_tests',
    'tracked_documents',
    'webhook_configs',
    'whitelabel_config',
    'user_preferences',
    'bitrix24_config',
    'whatsapp_configs',
    'gmail_configurations',
    'alert_thresholds',
    'feature_flags',
    'mfa_settings',
    'audit_config',
    'contact_scores',
    'domain_reputation'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    -- 1) Adicionar coluna version se não existir
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name=t AND column_name='version'
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN version INTEGER NOT NULL DEFAULT 1', t);
    END IF;

    -- 2) Criar trigger de incremento se não existir
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = format('trg_%s_increment_version', t)
        AND tgrelid = format('public.%I', t)::regclass
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER trg_%s_increment_version BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.increment_version_column()',
        t, t
      );
    END IF;
  END LOOP;
END$$;

-- =============================================================================
-- EXCLUDE constraint: impedir DOIS envios agendados pendentes para o
-- mesmo (user_id, recipient_email, scheduled_at) — protege contra
-- duplo-clique/dupla-inscrição no mesmo instante.
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'scheduled_emails_no_duplicate_pending'
  ) THEN
    ALTER TABLE public.scheduled_emails
      ADD CONSTRAINT scheduled_emails_no_duplicate_pending
      EXCLUDE USING gist (
        user_id WITH =,
        recipient_email WITH =,
        scheduled_at WITH =
      ) WHERE (status = 'pending');
  END IF;
END$$;

-- =============================================================================
-- EXCLUDE constraint: impedir dois enrollments ATIVOS do mesmo contato na
-- mesma sequência (sequence_id, contact/email) simultaneamente.
-- Detecta a coluna de e-mail dinamicamente (contact_email OU recipient_email).
-- =============================================================================
DO $$
DECLARE
  email_col text;
BEGIN
  SELECT column_name INTO email_col
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='sequence_enrollments'
    AND column_name IN ('contact_email','recipient_email','email')
  ORDER BY CASE column_name
    WHEN 'contact_email' THEN 1
    WHEN 'recipient_email' THEN 2
    WHEN 'email' THEN 3 END
  LIMIT 1;

  IF email_col IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sequence_enrollments_no_duplicate_active'
  ) THEN
    EXECUTE format($f$
      ALTER TABLE public.sequence_enrollments
        ADD CONSTRAINT sequence_enrollments_no_duplicate_active
        EXCLUDE USING gist (
          sequence_id WITH =,
          %I WITH =
        ) WHERE (status = 'active')
    $f$, email_col);
  END IF;
END$$;

COMMENT ON EXTENSION btree_gist IS 'Habilita EXCLUDE constraints com igualdade — usado para prevenir duplicatas concorrentes';
