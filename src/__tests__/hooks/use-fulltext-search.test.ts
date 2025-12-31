import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFulltextSearch, useEmailSearch } from '@/hooks/use-fulltext-search';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

describe('useFulltextSearch', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it('starts with empty search term', () => {
    const { result } = renderHook(
      () => useFulltextSearch({
        table: 'tracked_emails',
        columns: ['id', 'subject'],
        searchColumns: ['subject'],
      }),
      { wrapper }
    );
    expect(result.current.searchTerm).toBe('');
    expect(result.current.results).toEqual([]);
  });

  it('updates search term', () => {
    const { result } = renderHook(
      () => useFulltextSearch({
        table: 'tracked_emails',
        columns: ['id', 'subject'],
        searchColumns: ['subject'],
      }),
      { wrapper }
    );
    
    act(() => {
      result.current.setSearchTerm('test');
    });
    
    expect(result.current.searchTerm).toBe('test');
  });

  it('requires minimum characters', () => {
    const { result } = renderHook(
      () => useFulltextSearch({
        table: 'tracked_emails',
        columns: ['id'],
        searchColumns: ['subject'],
        minChars: 3,
      }),
      { wrapper }
    );
    
    act(() => {
      result.current.setSearchTerm('ab');
    });
    
    expect(result.current.hasMinChars).toBe(false);
  });

  it('provides highlight function', () => {
    const { result } = renderHook(
      () => useFulltextSearch({
        table: 'tracked_emails',
        columns: ['id'],
        searchColumns: ['subject'],
      }),
      { wrapper }
    );
    
    expect(typeof result.current.highlightText).toBe('function');
  });
});

describe('useEmailSearch', () => {
  it('returns search interface', () => {
    const { result } = renderHook(() => useEmailSearch(), { wrapper });
    expect(result.current.searchTerm).toBeDefined();
    expect(result.current.setSearchTerm).toBeDefined();
  });
});
