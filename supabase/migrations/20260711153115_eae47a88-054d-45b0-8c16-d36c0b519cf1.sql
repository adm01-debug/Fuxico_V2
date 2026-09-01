
-- Optimistic locking: adiciona coluna `version` e trigger de auto-incremento
-- em tabelas críticas onde conflitos de edição concorrente são possíveis.

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

ALTER TABLE public.email_sequences
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

ALTER TABLE public.tracked_emails
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

ALTER TABLE public.email_templates
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- Trigger genérico para incrementar `version` a cada UPDATE.
CREATE OR REPLACE FUNCTION public.increment_version_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.version IS NULL OR NEW.version = OLD.version THEN
    NEW.version = OLD.version + 1;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS increment_version_campaigns ON public.campaigns;
CREATE TRIGGER increment_version_campaigns
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.increment_version_column();

DROP TRIGGER IF EXISTS increment_version_email_sequences ON public.email_sequences;
CREATE TRIGGER increment_version_email_sequences
  BEFORE UPDATE ON public.email_sequences
  FOR EACH ROW EXECUTE FUNCTION public.increment_version_column();

DROP TRIGGER IF EXISTS increment_version_tracked_emails ON public.tracked_emails;
CREATE TRIGGER increment_version_tracked_emails
  BEFORE UPDATE ON public.tracked_emails
  FOR EACH ROW EXECUTE FUNCTION public.increment_version_column();

DROP TRIGGER IF EXISTS increment_version_email_templates ON public.email_templates;
CREATE TRIGGER increment_version_email_templates
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.increment_version_column();
