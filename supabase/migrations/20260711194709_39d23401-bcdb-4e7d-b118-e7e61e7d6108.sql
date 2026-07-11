
REVOKE EXECUTE ON FUNCTION public.run_retention_cleanup() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.run_tracking_events_retention() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.run_retention_cleanup() TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.run_tracking_events_retention() TO postgres, service_role;
