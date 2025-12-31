-- ============================================================================
-- FUXICO - Migration: Saved Filters
-- Permite que usuários salvem filtros personalizados
-- ============================================================================

-- Tabela para salvar filtros por usuário
CREATE TABLE IF NOT EXISTS public.saved_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  name TEXT NOT NULL,
  filters JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_filter_name_per_user UNIQUE (user_id, entity_type, name)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_saved_filters_user ON public.saved_filters(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_filters_entity ON public.saved_filters(entity_type);
CREATE INDEX IF NOT EXISTS idx_saved_filters_default ON public.saved_filters(is_default) WHERE is_default = true;

-- RLS
ALTER TABLE public.saved_filters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own filters"
ON public.saved_filters FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own filters"
ON public.saved_filters FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own filters"
ON public.saved_filters FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own filters"
ON public.saved_filters FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_saved_filters_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER saved_filters_updated
BEFORE UPDATE ON public.saved_filters
FOR EACH ROW EXECUTE FUNCTION update_saved_filters_timestamp();
