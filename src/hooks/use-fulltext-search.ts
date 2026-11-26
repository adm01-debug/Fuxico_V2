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
 * Divide `text` em segmentos marcando as ocorrências de `term`.
 * Retorna dados (nunca HTML) para o React renderizar sem risco de XSS.
 */
export function highlightSegments(
  text: string,
  term: string,
  minChars = 2
): Array<{ text: string; highlighted: boolean }> {
  if (!term || term.length < minChars) {
    return [{ text, highlighted: false }];
  }
  if (text === '') {
    return [{ text: '', highlighted: false }];
  }

  const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedTerm})`, 'gi');
  const parts = text.split(regex);

  return parts.filter(Boolean).map((part) => ({
    text: part,
    highlighted: new RegExp(`^${escapedTerm}$`, 'i').test(part),
  }));
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
      const orFilter = searchColumns.map((col) => `${col}.ilike.%${debouncedTerm}%`).join(',');

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
  const getHighlightSegments = useCallback(
    (text: string): Array<{ text: string; highlighted: boolean }> =>
      highlightSegments(text, debouncedTerm, minChars),
    [debouncedTerm, minChars]
  );

  // Legacy highlightText kept for backward compatibility but escapes output
  const highlightText = useCallback(
    (text: string): string => {
      if (!debouncedTerm || debouncedTerm.length < minChars) return text;

      const escapedTerm = debouncedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedTerm})`, 'gi');
      // Escape HTML entities to prevent XSS when used with dangerouslySetInnerHTML
      const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return escaped.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
    },
    [debouncedTerm, minChars]
  );

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

// ---------------------------------------------------------------------------
// Busca global por dados reais (usada pelo GlobalSearchDialog / Ctrl+K)
// Cobre as 5 tabelas que o usuario enxerga no painel. A RLS de cada tabela
// garante o recorte por dono (tracked_links via EXISTS em tracked_emails).
// ---------------------------------------------------------------------------

export type GlobalSearchTable =
  'tracked_emails' | 'tracked_documents' | 'tracked_links' | 'email_templates' | 'campaigns';

export interface GlobalSearchHit {
  id: string;
  table: GlobalSearchTable;
  label: string;
  sublabel?: string;
  /** Texto pesquisável (colunas casadas no servidor) para o filtro local do cmdk. */
  match: string;
}

interface GlobalSearchSource {
  table: GlobalSearchTable;
  columns: string;
  searchColumns: string[];
  toHit: (row: Record<string, unknown>) => GlobalSearchHit;
}

const texto = (valor: unknown): string => (typeof valor === 'string' ? valor : '');

const GLOBAL_SEARCH_SOURCES: GlobalSearchSource[] = [
  {
    table: 'tracked_emails',
    columns: 'id,subject,recipient_email,sender_email',
    searchColumns: ['subject', 'recipient_email', 'sender_email'],
    toHit: (row) => ({
      id: String(row.id),
      table: 'tracked_emails',
      label: texto(row.subject) || '(sem assunto)',
      sublabel: texto(row.recipient_email) || undefined,
      match: [row.subject, row.recipient_email, row.sender_email].map(texto).join(' '),
    }),
  },
  {
    table: 'tracked_documents',
    columns: 'id,file_name,recipient_email,description',
    searchColumns: ['file_name', 'recipient_email', 'description'],
    toHit: (row) => ({
      id: String(row.id),
      table: 'tracked_documents',
      label: texto(row.file_name) || '(documento sem nome)',
      sublabel: texto(row.recipient_email) || undefined,
      match: [row.file_name, row.recipient_email, row.description].map(texto).join(' '),
    }),
  },
  {
    table: 'tracked_links',
    columns: 'id,original_url',
    searchColumns: ['original_url'],
    toHit: (row) => ({
      id: String(row.id),
      table: 'tracked_links',
      label: texto(row.original_url) || '(link sem url)',
      match: texto(row.original_url),
    }),
  },
  {
    table: 'email_templates',
    columns: 'id,name,subject,category',
    searchColumns: ['name', 'subject', 'category'],
    toHit: (row) => ({
      id: String(row.id),
      table: 'email_templates',
      label: texto(row.name) || '(modelo sem nome)',
      sublabel: texto(row.subject) || undefined,
      match: [row.name, row.subject, row.category].map(texto).join(' '),
    }),
  },
  {
    table: 'campaigns',
    columns: 'id,name,description,status',
    searchColumns: ['name', 'description'],
    toHit: (row) => ({
      id: String(row.id),
      table: 'campaigns',
      label: texto(row.name) || '(campanha sem nome)',
      sublabel: texto(row.status) || undefined,
      match: [row.name, row.description].map(texto).join(' '),
    }),
  },
];

/** `%` `,` `(` `)` e `\` quebrariam o filtro `or=(col.ilike.%term%)` do PostgREST. */
const termoParaFiltro = (term: string): string => term.replace(/[%(),\\]/g, '');

async function searchSource(source: GlobalSearchSource, term: string): Promise<GlobalSearchHit[]> {
  const safeTerm = termoParaFiltro(term);
  if (!safeTerm) return [];

  const orFilter = source.searchColumns.map((col) => `${col}.ilike.%${safeTerm}%`).join(',');

  const { data, error } = await supabase
    .from(source.table)
    .select(source.columns)
    .or(orFilter)
    .limit(6);

  if (error) throw error;
  if (!Array.isArray(data)) return [];

  return (data as unknown as Record<string, unknown>[]).map((row) => source.toHit(row));
}

/** Busca o termo (min. 2 caracteres) em emails, documentos, links, modelos e campanhas. */
export function useGlobalDataSearch(term: string) {
  const query = term.trim();
  const enabled = query.length >= 2;

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['global-data-search', query],
    queryFn: async () => {
      const groups = await Promise.all(
        GLOBAL_SEARCH_SOURCES.map((source) => searchSource(source, query))
      );
      return groups.flat();
    },
    enabled,
    staleTime: 30000, // 30s
  });

  return {
    hits: enabled ? (data ?? []) : [],
    isSearching: enabled && (isLoading || isFetching),
    error: (error as Error | null) ?? null,
  };
}

export default useFulltextSearch;
