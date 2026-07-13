
-- email_audit_logs: consolidar SELECT
DROP POLICY IF EXISTS "Users can view their own logs" ON public.email_audit_logs;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.email_audit_logs;
CREATE POLICY "View own or admin all audit logs"
  ON public.email_audit_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- unsubscribed_emails: consolidar INSERT
DROP POLICY IF EXISTS "Allow public unsubscribe via link" ON public.unsubscribed_emails;
DROP POLICY IF EXISTS "Users can insert their own unsubscribed emails" ON public.unsubscribed_emails;
CREATE POLICY "Insert own or public unsubscribe"
  ON public.unsubscribed_emails FOR INSERT TO public
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR (
      source = 'link'
      AND tracking_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.tracked_emails te
        WHERE te.tracking_id = unsubscribed_emails.tracking_id
          AND te.recipient_email = unsubscribed_emails.email
      )
    )
  );
