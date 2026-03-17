
-- FIX: document_events - require document_id and event_type
DROP POLICY IF EXISTS "Allow public insert on document_events" ON public.document_events;
CREATE POLICY "Allow public insert on document_events" ON public.document_events
FOR INSERT TO public
WITH CHECK (
  document_id IS NOT NULL
  AND document_id <> ''
  AND event_type IS NOT NULL
  AND event_type <> ''
  AND EXISTS (SELECT 1 FROM public.tracked_documents td WHERE td.document_id = document_events.document_id)
);

-- FIX: link_click_events - require link_id exists
DROP POLICY IF EXISTS "Allow public insert on link_click_events" ON public.link_click_events;
CREATE POLICY "Allow public insert on link_click_events" ON public.link_click_events
FOR INSERT TO public
WITH CHECK (
  link_id IS NOT NULL
  AND link_id <> ''
);

-- FIX: tracking_events - require tracking_id exists
DROP POLICY IF EXISTS "Allow public insert on tracking_events" ON public.tracking_events;
CREATE POLICY "Allow public insert on tracking_events" ON public.tracking_events
FOR INSERT TO anon, authenticated
WITH CHECK (
  tracking_id IS NOT NULL
  AND tracking_id <> ''
  AND event_type IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.tracked_emails te WHERE te.tracking_id = tracking_events.tracking_id)
);
