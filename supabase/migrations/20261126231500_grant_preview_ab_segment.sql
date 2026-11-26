-- preview_ab_segment nunca teve EXECUTE para authenticated, entao nenhuma tela
-- conseguia pre-visualizar o publico do teste A/B. A funcao e SECURITY DEFINER
-- e ja barra quem nao for o dono (auth.uid() <> p_user_id => 42501).
GRANT EXECUTE ON FUNCTION public.preview_ab_segment(uuid, jsonb) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.preview_ab_segment(uuid, jsonb) FROM anon, PUBLIC;