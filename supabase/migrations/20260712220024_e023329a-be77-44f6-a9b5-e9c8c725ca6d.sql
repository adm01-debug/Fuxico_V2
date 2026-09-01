-- Onda 29: Normalizar + restringir security_events.severity
UPDATE public.security_events
SET severity = CASE lower(severity)
  WHEN 'warning' THEN 'medium'
  WHEN 'error' THEN 'high'
  WHEN 'fatal' THEN 'critical'
  WHEN 'notice' THEN 'info'
  WHEN 'debug' THEN 'info'
  ELSE lower(severity)
END
WHERE severity IS NOT NULL
  AND lower(severity) NOT IN ('info','low','medium','high','critical');

-- Coloca default e NOT NULL de forma segura
UPDATE public.security_events SET severity = 'info' WHERE severity IS NULL;

ALTER TABLE public.security_events
  ALTER COLUMN severity SET DEFAULT 'info',
  ALTER COLUMN severity SET NOT NULL;

ALTER TABLE public.security_events
  DROP CONSTRAINT IF EXISTS security_events_severity_check;

ALTER TABLE public.security_events
  ADD CONSTRAINT security_events_severity_check
  CHECK (severity IN ('info','low','medium','high','critical'));