// FUXICO - Hook: useVersionHistory
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Version {
  id: string;
  entity_type: string;
  entity_id: string;
  version_number: number;
  data: Record<string, unknown>;
  changed_by: string;
  changed_at: string;
  change_summary: string;
}

export function useVersionHistory(entityType: string, entityId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['versions', entityType, entityId];

  const { data: versions, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entity_versions')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('version_number', { ascending: false });
      
      if (error) throw error;
      return data as Version[];
    },
    enabled: !!entityId,
  });

  const restoreMutation = useMutation({
    mutationFn: async (versionId: string) => {
      const version = versions?.find(v => v.id === versionId);
      if (!version) throw new Error('Versao nao encontrada');

      const { error } = await supabase
        .from(entityType)
        .update(version.data)
        .eq('id', entityId);

      if (error) throw error;
      return version;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Versao restaurada com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao restaurar: ${error.message}`);
    },
  });

  const compareMutation = useMutation({
    mutationFn: async ({ v1, v2 }: { v1: string; v2: string }) => {
      const version1 = versions?.find(v => v.id === v1);
      const version2 = versions?.find(v => v.id === v2);
      
      if (!version1 || !version2) throw new Error('Versoes nao encontradas');
      
      return {
        version1: version1.data,
        version2: version2.data,
        diff: computeDiff(version1.data, version2.data),
      };
    },
  });

  return {
    versions: versions ?? [],
    currentVersion: versions?.[0],
    versionCount: versions?.length ?? 0,
    isLoading,
    error,
    restore: restoreMutation.mutate,
    compare: compareMutation.mutate,
    isRestoring: restoreMutation.isPending,
  };
}

function computeDiff(
  obj1: Record<string, unknown>,
  obj2: Record<string, unknown>
): { field: string; old: unknown; new: unknown }[] {
  const diff: { field: string; old: unknown; new: unknown }[] = [];
  const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
  
  allKeys.forEach(key => {
    if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
      diff.push({ field: key, old: obj1[key], new: obj2[key] });
    }
  });
  
  return diff;
}

export default useVersionHistory;
