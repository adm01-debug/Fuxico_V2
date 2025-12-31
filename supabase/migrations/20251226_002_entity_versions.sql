-- FUXICO - Migration: Entity Versions
-- Sistema de versionamento para entidades criticas

CREATE TABLE IF NOT EXISTS public.entity_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  version_number INT NOT NULL,
  data JSONB NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  change_summary TEXT,
  CONSTRAINT unique_version UNIQUE (entity_type, entity_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_versions_entity ON public.entity_versions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_versions_date ON public.entity_versions(changed_at DESC);

ALTER TABLE public.entity_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view versions"
ON public.entity_versions FOR SELECT
USING (true);

CREATE POLICY "Users can create versions"
ON public.entity_versions FOR INSERT
WITH CHECK (auth.uid() = changed_by);

-- Funcao para criar versao automaticamente
CREATE OR REPLACE FUNCTION create_entity_version()
RETURNS TRIGGER AS $$
DECLARE
  next_version INT;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1 INTO next_version
  FROM public.entity_versions
  WHERE entity_type = TG_TABLE_NAME AND entity_id = OLD.id;
  
  INSERT INTO public.entity_versions (
    entity_type,
    entity_id,
    version_number,
    data,
    changed_by,
    change_summary
  ) VALUES (
    TG_TABLE_NAME,
    OLD.id,
    next_version,
    row_to_json(OLD),
    auth.uid(),
    'Auto-save antes de update'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
