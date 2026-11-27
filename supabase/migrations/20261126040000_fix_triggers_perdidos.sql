-- Restaura dois triggers que existem nas migrations mas estao ausentes no banco.
--
-- 1) update_sequence_on_tracking_event (criado em 20260110151034)
--    Foi perdido no DROP TABLE public.tracking_events CASCADE da migration
--    20260712113043 (reparticionamento da tabela), que recriou tabela, indices
--    e policies mas nao o trigger. Sem ele, opened_at/clicked_at de
--    sequence_step_executions nunca sao preenchidos pelos eventos de tracking.
--
-- 2) on_auth_user_created_prefs (criado em 20260522142735)
--    Nao existe no banco: usuarios novos nao recebem linha em user_preferences,
--    o que deixa o DSAR export e as preferencias de notificacao incompletos.
--
-- O trigger notify_tracking_event() -> pg_notify('webhook_event') da migration
-- 20251219173000 nao e restaurado: aquele canal nao tem consumidor e o disparo
-- de webhooks hoje usa webhook_configs + webhook_retry_queue + edge webhook-dispatch.

BEGIN;

DROP TRIGGER IF EXISTS update_sequence_on_tracking_event ON public.tracking_events;
CREATE TRIGGER update_sequence_on_tracking_event
  AFTER INSERT ON public.tracking_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_sequence_on_email_event();

DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_created_prefs'
      AND tgrelid = 'auth.users'::regclass
  ) THEN
    CREATE TRIGGER on_auth_user_created_prefs
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_preferences();
  END IF;
END
$do$;

-- Backfill dos usuarios criados enquanto o trigger estava ausente
INSERT INTO public.user_preferences (user_id)
SELECT u.id
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_preferences p WHERE p.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;

COMMIT;