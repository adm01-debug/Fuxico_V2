-- Onda 36: função de sanity check para operador
CREATE OR REPLACE FUNCTION public.admin_alert_sanity_check()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
    'generated_at', now(),
    'alerts_last_24h', jsonb_build_object(
      'skipped',
        COALESCE((SELECT COUNT(*) FROM public.alert_dispatch_log
                   WHERE status='skipped' AND dispatched_at > now() - interval '24 hours'), 0),
      'failed',
        COALESCE((SELECT COUNT(*) FROM public.alert_dispatch_log
                   WHERE status='failed' AND dispatched_at > now() - interval '24 hours'), 0),
      'sent',
        COALESCE((SELECT COUNT(*) FROM public.alert_dispatch_log
                   WHERE status='sent' AND dispatched_at > now() - interval '24 hours'), 0)
    ),
    'cron_dlq_pending',
      COALESCE((SELECT COUNT(*) FROM public.cron_job_failures
                 WHERE resolved_at IS NULL), 0),
    'cron_dlq_last_24h',
      COALESCE((SELECT COUNT(*) FROM public.cron_job_failures
                 WHERE created_at > now() - interval '24 hours'), 0),
    'stuck_scheduled_emails',
      COALESCE((SELECT COUNT(*) FROM public.scheduled_emails
                 WHERE status = 'pending'
                   AND scheduled_at < now() - interval '1 hour'), 0)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_alert_sanity_check() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_alert_sanity_check() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_alert_sanity_check() TO service_role;

COMMENT ON FUNCTION public.admin_alert_sanity_check() IS
  'Retorna health-check consolidado de alertas e crons (Onda 36). Apenas service_role via admin-rpc.';