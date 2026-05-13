-- Atualização da função para Keyset Pagination
CREATE OR REPLACE FUNCTION public.get_emails_with_stats(
  p_user_id uuid,
  p_limit integer DEFAULT 100,
  p_last_id uuid DEFAULT NULL,
  p_last_timestamp timestamp with time zone DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_start_date timestamp with time zone DEFAULT NULL,
  p_end_date timestamp with time zone DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  tracking_id text,
  recipient_email text,
  sender_email text,
  subject text,
  created_at timestamp with time zone,
  user_id uuid,
  delivery_status text,
  bounce_type text,
  bounce_reason text,
  bounce_detected_at timestamp with time zone,
  metadata jsonb,
  open_count bigint,
  click_count bigint,
  unique_opens bigint,
  first_opened_at timestamp with time zone,
  last_opened_at timestamp with time zone,
  total_link_clicks bigint,
  unique_links_clicked bigint,
  total_count bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total_count BIGINT;
BEGIN
  -- Contar total de registros (aproximado ou filtrado)
  SELECT COUNT(*) INTO v_total_count
  FROM email_stats_mv esm
  WHERE esm.user_id = p_user_id
    AND (p_status IS NULL OR esm.delivery_status = p_status)
    AND (p_search IS NULL OR 
         esm.recipient_email ILIKE '%' || p_search || '%' OR 
         esm.subject ILIKE '%' || p_search || '%')
    AND (p_start_date IS NULL OR esm.created_at >= p_start_date)
    AND (p_end_date IS NULL OR esm.created_at <= p_end_date);

  RETURN QUERY
  SELECT 
    esm.id,
    esm.tracking_id,
    esm.recipient_email,
    esm.sender_email,
    esm.subject,
    esm.created_at,
    esm.user_id,
    esm.delivery_status,
    esm.bounce_type,
    esm.bounce_reason,
    esm.bounce_detected_at,
    esm.metadata,
    esm.open_count,
    esm.click_count,
    esm.unique_opens,
    esm.first_opened_at,
    esm.last_opened_at,
    esm.total_link_clicks,
    esm.unique_links_clicked,
    v_total_count AS total_count
  FROM email_stats_mv esm
  WHERE esm.user_id = p_user_id
    AND (p_status IS NULL OR esm.delivery_status = p_status)
    AND (p_search IS NULL OR 
         esm.recipient_email ILIKE '%' || p_search || '%' OR 
         esm.subject ILIKE '%' || p_search || '%')
    AND (p_start_date IS NULL OR esm.created_at >= p_start_date)
    AND (p_end_date IS NULL OR esm.created_at <= p_end_date)
    -- Keyset logic:
    AND (
      p_last_timestamp IS NULL 
      OR (esm.created_at < p_last_timestamp)
      OR (esm.created_at = p_last_timestamp AND esm.id < p_last_id)
    )
  ORDER BY esm.created_at DESC, esm.id DESC
  LIMIT p_limit;
END;
$$;

-- Estratégia de Particionamento (Documentação via Comentários)
-- Para particionar tracking_events, deve-se:
-- 1. Renomear tracking_events atual para tracking_events_old
-- 2. Criar nova tabela tracking_events PARTITION BY RANGE (created_at)
-- 3. Criar partições mensais: tracking_events_y2026m01, etc.
-- 4. Migrar dados em batches da _old para a nova.
-- 5. Recriar índices e constraints.
COMMENT ON TABLE tracking_events IS 'Estratégia de particionamento mensal planejada para Q3/2026.';
