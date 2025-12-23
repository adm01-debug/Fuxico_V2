-- Tabela para monitorar reputação de domínios
CREATE TABLE public.domain_reputation (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  domain text NOT NULL,
  reputation_score integer DEFAULT 50 CHECK (reputation_score >= 0 AND reputation_score <= 100),
  total_sent integer DEFAULT 0,
  total_delivered integer DEFAULT 0,
  total_bounced integer DEFAULT 0,
  total_opened integer DEFAULT 0,
  bounce_rate numeric(5,2) DEFAULT 0,
  open_rate numeric(5,2) DEFAULT 0,
  last_checked_at timestamp with time zone,
  spf_valid boolean,
  dkim_valid boolean,
  dmarc_valid boolean,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, domain)
);

-- Tabela para histórico de métricas de deliverability
CREATE TABLE public.deliverability_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  domain text NOT NULL,
  period_start timestamp with time zone NOT NULL,
  period_end timestamp with time zone NOT NULL,
  emails_sent integer DEFAULT 0,
  emails_delivered integer DEFAULT 0,
  emails_bounced integer DEFAULT 0,
  emails_opened integer DEFAULT 0,
  hard_bounces integer DEFAULT 0,
  soft_bounces integer DEFAULT 0,
  delivery_rate numeric(5,2) DEFAULT 0,
  reputation_score integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.domain_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverability_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for domain_reputation
CREATE POLICY "Users can view their own domain reputation"
  ON public.domain_reputation FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own domain reputation"
  ON public.domain_reputation FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own domain reputation"
  ON public.domain_reputation FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own domain reputation"
  ON public.domain_reputation FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for deliverability_logs
CREATE POLICY "Users can view their own deliverability logs"
  ON public.deliverability_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own deliverability logs"
  ON public.deliverability_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_domain_reputation_updated_at
  BEFORE UPDATE ON public.domain_reputation
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para calcular métricas de deliverability por domínio
CREATE OR REPLACE FUNCTION public.calculate_domain_deliverability(p_user_id uuid)
RETURNS TABLE(
  domain text,
  total_sent bigint,
  total_delivered bigint,
  total_bounced bigint,
  total_opened bigint,
  bounce_rate numeric,
  open_rate numeric,
  delivery_rate numeric,
  reputation_score integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH domain_stats AS (
    SELECT 
      LOWER(SPLIT_PART(te.sender_email, '@', 2)) as sender_domain,
      COUNT(*)::bigint as sent,
      COUNT(*) FILTER (WHERE te.delivery_status = 'delivered' OR te.delivery_status = 'sent')::bigint as delivered,
      COUNT(*) FILTER (WHERE te.delivery_status = 'bounced')::bigint as bounced,
      COALESCE(SUM(esm.open_count), 0)::bigint as opened
    FROM tracked_emails te
    LEFT JOIN email_stats_mv esm ON te.tracking_id = esm.tracking_id
    WHERE te.user_id = p_user_id
      AND te.sender_email IS NOT NULL
    GROUP BY LOWER(SPLIT_PART(te.sender_email, '@', 2))
  )
  SELECT 
    ds.sender_domain as domain,
    ds.sent as total_sent,
    ds.delivered as total_delivered,
    ds.bounced as total_bounced,
    ds.opened as total_opened,
    CASE WHEN ds.sent > 0 THEN ROUND((ds.bounced::numeric / ds.sent) * 100, 2) ELSE 0 END as bounce_rate,
    CASE WHEN ds.delivered > 0 THEN ROUND((ds.opened::numeric / ds.delivered) * 100, 2) ELSE 0 END as open_rate,
    CASE WHEN ds.sent > 0 THEN ROUND((ds.delivered::numeric / ds.sent) * 100, 2) ELSE 0 END as delivery_rate,
    -- Reputation score calculation
    CASE 
      WHEN ds.sent = 0 THEN 50
      ELSE GREATEST(0, LEAST(100, 
        50 + 
        (CASE WHEN ds.sent > 0 THEN ((ds.delivered::numeric / ds.sent) * 25) ELSE 0 END) +
        (CASE WHEN ds.delivered > 0 THEN ((ds.opened::numeric / ds.delivered) * 15) ELSE 0 END) -
        (CASE WHEN ds.sent > 0 THEN ((ds.bounced::numeric / ds.sent) * 40) ELSE 0 END)
      ))::integer
    END as reputation_score
  FROM domain_stats ds
  WHERE ds.sender_domain IS NOT NULL AND ds.sender_domain != ''
  ORDER BY ds.sent DESC;
END;
$$;