// FUXICO - Hook: useBulkActions
import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type BulkAction = 'delete' | 'archive' | 'restore' | 'export' | 'duplicate';

interface UseBulkActionsOptions {
  table: string;
  queryKey: string[];
  onSuccess?: () => void;
}

export function useBulkActions({ table, queryKey, onSuccess }: UseBulkActionsOptions) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(ids);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from(table)
        .update({ deleted_at: new Date().toISOString() })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      clearSelection();
      toast.success(`${selectedIds.length} itens removidos`);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from(table)
        .update({ deleted_at: null })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      clearSelection();
      toast.success(`${selectedIds.length} itens restaurados`);
      onSuccess?.();
    },
  });

  const executeAction = useCallback(async (action: BulkAction) => {
    if (selectedIds.length === 0) {
      toast.warning('Selecione ao menos um item');
      return;
    }

    switch (action) {
      case 'delete':
        deleteMutation.mutate(selectedIds);
        break;
      case 'restore':
        restoreMutation.mutate(selectedIds);
        break;
      default:
        toast.info(`Acao ${action} nao implementada`);
    }
  }, [selectedIds, deleteMutation, restoreMutation]);

  return {
    selectedIds,
    selectedCount: selectedIds.length,
    hasSelection: selectedIds.length > 0,
    toggleSelection,
    selectAll,
    clearSelection,
    executeAction,
    isProcessing: deleteMutation.isPending || restoreMutation.isPending,
    isSelected: (id: string) => selectedIds.includes(id),
  };
}

export default useBulkActions;
