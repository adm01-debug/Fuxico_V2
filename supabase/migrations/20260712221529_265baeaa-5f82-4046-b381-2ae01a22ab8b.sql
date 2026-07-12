-- Onda 34: Drop função legada get_emails_with_stats (offset-based).
-- A versão keyset (p_last_id, p_last_timestamp) permanece.
DROP FUNCTION IF EXISTS public.get_emails_with_stats(
  uuid, integer, integer, text, text, timestamp with time zone, timestamp with time zone
);

COMMENT ON FUNCTION public.get_emails_with_stats(
  uuid, integer, uuid, timestamp with time zone, text, text, timestamp with time zone, timestamp with time zone
) IS 'Keyset pagination — única versão suportada. A versão offset foi removida na Onda 34 (2026-07-12).';