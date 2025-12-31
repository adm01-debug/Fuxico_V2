// =============================================================================
// FUXICO - Hook: useFulltextSearch
// Busca fulltext em múltiplas colunas com debounce
// =============================================================================

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseFulltextSearchOptions<T> {
  table: string;
  columns: string[];
  searchColumns: string[];
  enabled?: boolean;
  debounceMs?: number;
  minChars?: number;
}

export function useFulltextSearch<T>({
  table,
  columns,
  searchColumns,
  enabled = true,
  debounceMs = 300,
  minChars = 2,
}: UseFulltextSearchOptions<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');

  // Debounce do termo de busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs]);

  // Query de busca
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['fulltext-search', table, debouncedTerm],
    queryFn: async () => {
      if (debouncedTerm.length < minChars) {
        return [];
      }

      // Construir filtro OR para múltiplas colunas
      const orFilter = searchColumns
        .map(col => `${col}.ilike.%${debouncedTerm}%`)
        .join(',');

      const { data, error } = await supabase
        .from(table)
        .select(columns.join(','))
        .or(orFilter)
        .limit(100);

      if (error) throw error;
      return data as T[];
    },
    enabled: enabled && debouncedTerm.length >= minChars,
    staleTime: 30000, // 30s
  });

  // Highlight do texto encontrado
  const highlightText = useMemo(() => {
    return (text: string) => {
      if (!debouncedTerm || debouncedTerm.length < minChars) return text;
      
      const regex = new RegExp(`(${debouncedTerm})`, 'gi');
      return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
    };
  }, [debouncedTerm, minChars]);

  return {
    searchTerm,
    setSearchTerm,
    results: data ?? [],
    isSearching: isLoading,
    error,
    highlightText,
    hasMinChars: searchTerm.length >= minChars,
    refetch,
  };
}

// Hook simplificado para emails
export function useEmailSearch() {
  return useFulltextSearch<{
    id: string;
    subject: string;
    recipient_email: string;
    sender_email: string;
  }>({
    table: 'tracked_emails',
    columns: ['id', 'subject', 'recipient_email', 'sender_email', 'created_at', 'tracking_id'],
    searchColumns: ['subject', 'recipient_email', 'sender_email'],
  });
}

// Hook simplificado para documentos
export function useDocumentSearch() {
  return useFulltextSearch<{
    id: string;
    filename: string;
    title: string;
  }>({
    table: 'tracked_documents',
    columns: ['id', 'filename', 'title', 'created_at', 'tracking_id'],
    searchColumns: ['filename', 'title'],
  });
}

export default useFulltextSearch;
