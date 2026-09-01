/**
 * FUXICO - Hook: useFulltextSearch
 * Busca fulltext em múltiplas colunas com debounce
 * @module hooks/use-fulltext-search
 */

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseFulltextSearchOptions {
  table: 'tracked_emails' | 'tracked_documents' | 'tracked_links' | 'email_templates' | 'campaigns';
  columns: string[];
  searchColumns: string[];
  enabled?: boolean;
  debounceMs?: number;
  minChars?: number;
}

interface SearchResult {
  id: string;
  [key: string]: unknown;
}

/**
 * Hook for full-text search across multiple columns with debounce
 */
export function useFulltextSearch({
  table,
  columns,
  searchColumns,
  enabled = true,
  debounceMs = 300,
  minChars = 2,
}: UseFulltextSearchOptions) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs]);

  // Search query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['fulltext-search', table, debouncedTerm],
    queryFn: async (): Promise<SearchResult[]> => {
      if (debouncedTerm.length < minChars) {
        return [];
      }

      // Build OR filter for multiple columns
      const orFilter = searchColumns
        .map(col => `${col}.ilike.%${debouncedTerm}%`)
        .join(',');

      const { data: result, error: queryError } = await supabase
        .from(table)
        .select(columns.join(','))
        .or(orFilter)
        .limit(100);

      if (queryError) throw queryError;
      
      // Type guard to ensure result is an array of valid objects
      if (!result || !Array.isArray(result)) {
        return [];
      }
      
      return result as unknown as SearchResult[];
    },
    enabled: enabled && debouncedTerm.length >= minChars,
    staleTime: 30000, // 30s
  });

  // Highlight matched text - returns segments for safe React rendering
  // SECURITY: Does NOT return HTML strings to prevent XSS injection
  const getHighlightSegments = useCallback((text: string): Array<{ text: string; highlighted: boolean }> => {
    if (!debouncedTerm || debouncedTerm.length < minChars) {
      return [{ text, highlighted: false }];
    }
    if (text === '') {
      return [{ text: '', highlighted: false }];
    }

    const escapedTerm = debouncedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedTerm})`, 'gi');
    const parts = text.split(regex);

    return parts.filter(Boolean).map(part => ({
      text: part,
      highlighted: new RegExp(`^${escapedTerm}$`, 'i').test(part),
    }));
  }, [debouncedTerm, minChars]);

  // Legacy highlightText kept for backward compatibility but escapes output
  const highlightText = useCallback((text: string): string => {
    if (!debouncedTerm || debouncedTerm.length < minChars) return text;

    const escapedTerm = debouncedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedTerm})`, 'gi');
    // Escape HTML entities to prevent XSS when used with dangerouslySetInnerHTML
    const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return escaped.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
  }, [debouncedTerm, minChars]);

  return {
    searchTerm,
    setSearchTerm,
    results: data ?? [],
    isSearching: isLoading,
    error,
    highlightText,
    getHighlightSegments,
    hasMinChars: searchTerm.length >= minChars,
    refetch,
  };
}

// Simplified hook for emails
export function useEmailSearch() {
  return useFulltextSearch({
    table: 'tracked_emails',
    columns: ['id', 'subject', 'recipient_email', 'sender_email', 'created_at', 'tracking_id'],
    searchColumns: ['subject', 'recipient_email', 'sender_email'],
  });
}

// Simplified hook for documents
export function useDocumentSearch() {
  return useFulltextSearch({
    table: 'tracked_documents',
    columns: ['id', 'file_name', 'description', 'created_at', 'document_id'],
    searchColumns: ['file_name', 'description'],
  });
}

export default useFulltextSearch;
