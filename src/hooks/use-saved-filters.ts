// =============================================================================
// FUXICO - Hook: useSavedFilters
// Persiste os filtros salvos por usuário na tabela public.saved_filters
// (RLS "own" + trigger de filtro padrão único por entidade).
// =============================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { log } from '@/lib/logger';

export interface SavedFilter {
  id: string;
  user_id: string;
  name: string;
  entity_type: string;
  filters: Record<string, unknown>;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface SaveFilterInput {
  name: string;
  filters: Record<string, unknown>;
  is_default?: boolean;
}

export interface UpdateFilterInput {
  id: string;
  name?: string;
  filters?: Record<string, unknown>;
  is_default?: boolean;
}

export const SAVED_FILTERS_QUERY_KEY = 'saved-filters';
export const SAVED_FILTERS_COLUMNS =
  'id, user_id, name, entity_type, filters, is_default, created_at, updated_at';
export const MAX_SAVED_FILTERS = 20;

/** Chave de cache por entidade e usuário; a lista nunca é compartilhada entre contas. */
export function savedFiltersQueryKey(entityType: string, userId: string | null | undefined) {
  return [SAVED_FILTERS_QUERY_KEY, entityType, userId ?? 'anon'] as const;
}

/** Converte o erro do PostgREST em mensagem amigável para o usuário. */
function savedFilterErrorMessage(error: { code?: string; message?: string }): string {
  if (error.code === '23505') return 'Já existe um filtro com esse nome';
  if (error.code === '23503') return 'Sessão expirada. Entre novamente para salvar filtros.';
  return error.message || 'Não foi possível concluir a operação';
}

export function useSavedFilters(entityType: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = savedFiltersQueryKey(entityType, user?.id);
  const enabled = Boolean(user?.id) && Boolean(entityType);

  const listQuery = useQuery({
    queryKey,
    enabled,
    queryFn: async (): Promise<SavedFilter[]> => {
      const { data, error } = await supabase
        .from('saved_filters')
        .select(SAVED_FILTERS_COLUMNS)
        .eq('entity_type', entityType)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as SavedFilter[];
    },
  });

  const filters = listQuery.data ?? [];
  const defaultFilter = filters.find((f) => f.is_default);

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: [SAVED_FILTERS_QUERY_KEY, entityType],
    });

  const createMutation = useMutation({
    mutationFn: async (input: SaveFilterInput): Promise<SavedFilter> => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      const { data, error } = await supabase
        .from('saved_filters')
        .insert({
          user_id: user.id,
          entity_type: entityType,
          name: input.name.trim(),
          filters: input.filters,
          is_default: input.is_default ?? false,
        })
        .select(SAVED_FILTERS_COLUMNS)
        .single();
      if (error) throw error;
      return data as SavedFilter;
    },
    onSuccess: () => {
      toast.success('Filtro salvo com sucesso!');
    },
    onError: (error: { code?: string; message?: string }) => {
      log.error('Erro ao salvar filtro:', error);
      toast.error(savedFilterErrorMessage(error));
    },
    onSettled: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: async (input: UpdateFilterInput): Promise<SavedFilter> => {
      const { id, ...changes } = input;
      const payload: { name?: string; filters?: Record<string, unknown>; is_default?: boolean } =
        {};
      if (changes.name !== undefined) payload.name = changes.name.trim();
      if (changes.filters !== undefined) payload.filters = changes.filters;
      if (changes.is_default !== undefined) payload.is_default = changes.is_default;

      const { data, error } = await supabase
        .from('saved_filters')
        .update(payload)
        .eq('id', id)
        .select(SAVED_FILTERS_COLUMNS)
        .single();
      if (error) throw error;
      return data as SavedFilter;
    },
    onError: (error: { code?: string; message?: string }) => {
      log.error('Erro ao atualizar filtro:', error);
      toast.error(savedFilterErrorMessage(error));
    },
    onSettled: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('saved_filters').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      toast.success('Filtro removido');
    },
    onError: (error: { code?: string; message?: string }) => {
      log.error('Erro ao remover filtro:', error);
      toast.error(savedFilterErrorMessage(error));
    },
    onSettled: invalidate,
  });

  /** Salva um novo filtro; devolve o registro criado ou null quando falha. */
  const saveFilter = async (input: SaveFilterInput): Promise<SavedFilter | null> => {
    if (!input.name.trim()) {
      toast.error('Informe um nome para o filtro');
      return null;
    }
    if (filters.length >= MAX_SAVED_FILTERS) {
      toast.error(`Limite de ${MAX_SAVED_FILTERS} filtros salvos atingido`);
      return null;
    }
    try {
      return await createMutation.mutateAsync(input);
    } catch {
      return null;
    }
  };

  /** Atualiza nome, conteúdo ou marcação de padrão de um filtro existente. */
  const updateFilter = async (input: UpdateFilterInput): Promise<SavedFilter | null> => {
    if (input.name !== undefined && !input.name.trim()) {
      toast.error('Informe um nome para o filtro');
      return null;
    }
    try {
      return await updateMutation.mutateAsync(input);
    } catch {
      return null;
    }
  };

  const deleteFilter = async (id: string): Promise<boolean> => {
    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
  };

  /** Marca como padrão; o trigger do banco desmarca os demais da mesma entidade. */
  const setDefault = async (id: string): Promise<SavedFilter | null> => {
    const updated = await updateFilter({ id, is_default: true });
    if (updated) toast.success('Filtro padrão definido');
    return updated;
  };

  return {
    filters,
    defaultFilter,
    isLoading: enabled ? listQuery.isLoading : false,
    error: listQuery.error ? savedFilterErrorMessage(listQuery.error) : null,
    saveFilter,
    updateFilter,
    deleteFilter,
    setDefault,
    isSaving: createMutation.isPending || updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export default useSavedFilters;
