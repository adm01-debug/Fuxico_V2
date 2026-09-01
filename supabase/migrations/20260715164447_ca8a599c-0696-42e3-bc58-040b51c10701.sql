DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'security_events_severity_ck') THEN
    ALTER TABLE public.security_events
      ADD CONSTRAINT security_events_severity_ck
      CHECK (severity IN ('info','low','medium','high','critical')) NOT VALID;
    ALTER TABLE public.security_events VALIDATE CONSTRAINT security_events_severity_ck;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contact_scores_engagement_range_ck') THEN
    ALTER TABLE public.contact_scores
      ADD CONSTRAINT contact_scores_engagement_range_ck
      CHECK (engagement_score IS NULL OR (engagement_score >= 0 AND engagement_score <= 100)) NOT VALID;
    ALTER TABLE public.contact_scores VALIDATE CONSTRAINT contact_scores_engagement_range_ck;
  END IF;
END $$;