
-- Onda 104: Dispatcher de alertas críticos
CREATE OR REPLACE FUNCTION public.dispatch_critical_alerts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_events_count int := 0;
  v_notifications_created int := 0;
  v_admin_ids uuid[];
  v_admin_id uuid;
  v_event record;
BEGIN
  -- Get all admin user IDs
  SELECT array_agg(user_id) INTO v_admin_ids
  FROM public.user_roles
  WHERE role = 'admin';

  IF v_admin_ids IS NULL OR array_length(v_admin_ids, 1) IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'no_admins',
      'events_scanned', 0,
      'notifications_created', 0
    );
  END IF;

  -- Scan critical events from last 24h that haven't been alerted yet
  FOR v_event IN
    SELECT id, event_type, description, severity, metadata, created_at
    FROM public.security_events
    WHERE severity IN ('critical', 'high')
      AND created_at >= now() - interval '24 hours'
      AND NOT EXISTS (
        SELECT 1 FROM public.alert_dispatch_log adl
        WHERE adl.event_id = security_events.id
      )
    ORDER BY created_at DESC
    LIMIT 200
  LOOP
    v_events_count := v_events_count + 1;

    -- Create in-app notification for each admin
    FOREACH v_admin_id IN ARRAY v_admin_ids LOOP
      INSERT INTO public.notification_history (
        user_id, notification_type, title, message, metadata, read_at
      ) VALUES (
        v_admin_id,
        'security_alert',
        format('[%s] %s', upper(v_event.severity), v_event.event_type),
        coalesce(v_event.description, 'Evento crítico detectado'),
        jsonb_build_object(
          'event_id', v_event.id,
          'severity', v_event.severity,
          'occurred_at', v_event.created_at
        ) || coalesce(v_event.metadata, '{}'::jsonb),
        NULL
      );
      v_notifications_created := v_notifications_created + 1;
    END LOOP;

    -- Mark event as dispatched
    INSERT INTO public.alert_dispatch_log (event_id, dispatched_at, channels, admin_count)
    VALUES (v_event.id, now(), ARRAY['in_app'], array_length(v_admin_ids, 1))
    ON CONFLICT (event_id) DO NOTHING;
  END LOOP;

  RETURN jsonb_build_object(
    'status', 'ok',
    'events_scanned', v_events_count,
    'notifications_created', v_notifications_created,
    'admin_count', array_length(v_admin_ids, 1),
    'ran_at', now()
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.dispatch_critical_alerts() FROM PUBLIC, anon, authenticated;

-- Ensure alert_dispatch_log has needed shape (idempotent guard)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='alert_dispatch_log' AND column_name='event_id'
  ) THEN
    ALTER TABLE public.alert_dispatch_log ADD COLUMN event_id uuid;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='alert_dispatch_log' AND column_name='channels'
  ) THEN
    ALTER TABLE public.alert_dispatch_log ADD COLUMN channels text[] DEFAULT '{}';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='alert_dispatch_log' AND column_name='admin_count'
  ) THEN
    ALTER TABLE public.alert_dispatch_log ADD COLUMN admin_count int DEFAULT 0;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_alert_dispatch_log_event_id
  ON public.alert_dispatch_log(event_id)
  WHERE event_id IS NOT NULL;
