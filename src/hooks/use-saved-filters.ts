// =============================================================================
// FUXICO - Hook: useSavedFilters
// Gerencia filtros salvos pelo usuário (usa localStorage como fallback)
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { log } from '@/lib/logger';

export interface SavedFilter {
  id: string;
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

export function useSavedFilters(entityType: string) {
  const storageKey = `fuxico_filters_${entityType}`;
  const [filters, setFilters] = useState<SavedFilter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setFilters(JSON.parse(stored));
      }
    } catch (e) {
      log.error('Error loading saved filters:', e);
    }
    setIsLoading(false);
  }, [storageKey]);

  // Save to localStorage
  const persist = useCallback((newFilters: SavedFilter[]) => {
    setFilters(newFilters);
    localStorage.setItem(storageKey, JSON.stringify(newFilters));
  }, [storageKey]);

  // Buscar filtro padrão
  const defaultFilter = filters.find(f => f.is_default);

  // Salvar novo filtro
  const saveFilter = useCallback((input: SaveFilterInput) => {
    const newFilter: SavedFilter = {
      id: crypto.randomUUID(),
      name: input.name,
      entity_type: entityType,
      filters: input.filters,
      is_default: input.is_default || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    persist([...filters, newFilter]);
    toast.success('Filtro salvo com sucesso!');
  }, [filters, persist, entityType]);

  // Deletar filtro
  const deleteFilter = useCallback((id: string) => {
    persist(filters.filter(f => f.id !== id));
    toast.success('Filtro removido');
  }, [filters, persist]);

  // Definir como padrão
  const setDefault = useCallback((id: string) => {
    const updated = filters.map(f => ({
      ...f,
      is_default: f.id === id,
    }));
    persist(updated);
    toast.success('Filtro padrão definido');
  }, [filters, persist]);

  return {
    filters,
    defaultFilter,
    isLoading,
    error: null,
    saveFilter,
    updateFilter: () => {},
    deleteFilter,
    setDefault,
    isSaving: false,
    isDeleting: false,
  };
}

export default useSavedFilters;
