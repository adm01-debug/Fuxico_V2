-- =============================================================================
-- FUXICO - Security Audit Round 5 Migration
-- Data: 2026-03-27
-- Descricao: RPC para vote-poll atomic increment
-- =============================================================================

-- Atomic increment for poll_options vote count
CREATE OR REPLACE FUNCTION public.increment_poll_option_votes(p_option_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.poll_options
  SET votes_count = COALESCE(votes_count, 0) + 1
  WHERE id = p_option_id;
$$;

GRANT EXECUTE ON FUNCTION public.increment_poll_option_votes(UUID) TO anon, authenticated, service_role;
