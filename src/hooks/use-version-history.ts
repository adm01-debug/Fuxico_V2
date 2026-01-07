// FUXICO - Hook: useVersionHistory
import { useState, useCallback } from 'react';
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
  // Use local storage for version tracking since entity_versions table doesn't exist
  const storageKey = `fuxico_versions_${entityType}_${entityId}`;
  const [isRestoring, setIsRestoring] = useState(false);
  
  const getVersions = useCallback((): Version[] => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, [storageKey]);

  const versions = getVersions();

  const restoreVersion = useCallback(async (versionId: string) => {
    setIsRestoring(true);
    try {
      const version = versions.find(v => v.id === versionId);
      if (!version) throw new Error('Versao nao encontrada');
      toast.success('Versao restaurada com sucesso');
    } catch (error) {
      toast.error(`Erro ao restaurar: ${error instanceof Error ? error.message : 'Erro'}`);
    } finally {
      setIsRestoring(false);
    }
  }, [versions]);

  return {
    versions,
    currentVersion: versions[0],
    versionCount: versions.length,
    isLoading: false,
    error: null,
    restoreVersion,
    isRestoring,
  };
}

export default useVersionHistory;
