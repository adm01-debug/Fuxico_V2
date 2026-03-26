-- =============================================================================
-- FUXICO - Security Audit Fixes Migration
-- Data: 2026-03-26
-- Descricao: Correcoes identificadas na auditoria de seguranca do sistema
-- =============================================================================

-- =========================================================================
-- 1. Atomic increment functions (prevent race conditions)
-- =========================================================================

-- Atomic increment for tracked_links click count
CREATE OR REPLACE FUNCTION public.increment_link_click_count(p_link_id TEXT)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.tracked_links
  SET click_count = COALESCE(click_count, 0) + 1
  WHERE link_id = p_link_id;
$$;

-- Atomic increment for email_sequences total_enrolled
CREATE OR REPLACE FUNCTION public.increment_sequence_enrolled(p_sequence_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.email_sequences
  SET total_enrolled = COALESCE(total_enrolled, 0) + 1
  WHERE id = p_sequence_id;
$$;

-- =========================================================================
-- 2. CHECK constraints for data integrity
-- =========================================================================

-- Bounce rate must be between 0 and 1
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_valid_bounce_rate'
  ) THEN
    ALTER TABLE public.bounce_alerts
      ADD CONSTRAINT check_valid_bounce_rate
      CHECK (bounce_rate >= 0 AND bounce_rate <= 1);
  END IF;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Sequence steps delays must be non-negative
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_positive_delay'
  ) THEN
    ALTER TABLE public.sequence_steps
      ADD CONSTRAINT check_positive_delay
      CHECK (delay_days >= 0 AND delay_hours >= 0);
  END IF;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- =========================================================================
-- 3. Missing indexes for common query patterns
-- =========================================================================

CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_user_status
  ON public.sequence_enrollments(user_id, status);

CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_sequence_status
  ON public.sequence_enrollments(sequence_id, status);

CREATE INDEX IF NOT EXISTS idx_password_reset_requests_user_status
  ON public.password_reset_requests(user_id, status);

CREATE INDEX IF NOT EXISTS idx_tracked_emails_campaign_id
  ON public.tracked_emails(campaign_id)
  WHERE campaign_id IS NOT NULL;

-- =========================================================================
-- 4. Fix orphaned foreign key references
-- =========================================================================

-- entity_versions.changed_by -> SET NULL on user delete
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entity_versions' AND column_name = 'changed_by'
  ) THEN
    -- Drop existing FK if any, then recreate with ON DELETE SET NULL
    ALTER TABLE public.entity_versions
      DROP CONSTRAINT IF EXISTS entity_versions_changed_by_fkey;
    ALTER TABLE public.entity_versions
      ADD CONSTRAINT entity_versions_changed_by_fkey
      FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- fraud_alerts.resolved_by -> SET NULL on user delete
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fraud_alerts' AND column_name = 'resolved_by'
  ) THEN
    ALTER TABLE public.fraud_alerts
      DROP CONSTRAINT IF EXISTS fraud_alerts_resolved_by_fkey;
    ALTER TABLE public.fraud_alerts
      ADD CONSTRAINT fraud_alerts_resolved_by_fkey
      FOREIGN KEY (resolved_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- geo_whitelist.added_by -> SET NULL on user delete
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'geo_whitelist' AND column_name = 'added_by'
  ) THEN
    ALTER TABLE public.geo_whitelist
      DROP CONSTRAINT IF EXISTS geo_whitelist_added_by_fkey;
    ALTER TABLE public.geo_whitelist
      ADD CONSTRAINT geo_whitelist_added_by_fkey
      FOREIGN KEY (added_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =========================================================================
-- 5. Tighten RLS on password_reset_requests
-- =========================================================================

DO $$
BEGIN
  -- Drop overly permissive policy if it exists
  DROP POLICY IF EXISTS "Anyone can request password reset" ON public.password_reset_requests;

  -- Create validated policy
  CREATE POLICY "Validated password reset requests only"
    ON public.password_reset_requests
    FOR INSERT
    WITH CHECK (
      email IS NOT NULL
      AND email <> ''
      AND status = 'pending'
    );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- =========================================================================
-- 6. Grant execute on new functions
-- =========================================================================

GRANT EXECUTE ON FUNCTION public.increment_link_click_count(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_sequence_enrolled(UUID) TO authenticated, service_role;
