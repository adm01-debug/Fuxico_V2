import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';

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
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

describe('useInfiniteScroll', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it('starts with empty data', async () => {
    const { result } = renderHook(
      () => useInfiniteScroll({ table: 'tracked_emails' }),
      { wrapper }
    );
    
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual([]);
  });

  it('provides load more ref', () => {
    const { result } = renderHook(
      () => useInfiniteScroll({ table: 'tracked_emails' }),
      { wrapper }
    );
    
    expect(result.current.loadMoreRef).toBeDefined();
  });

  it('tracks total loaded', () => {
    const { result } = renderHook(
      () => useInfiniteScroll({ table: 'tracked_emails' }),
      { wrapper }
    );
    
    expect(result.current.totalLoaded).toBe(0);
  });

  it('accepts custom page size', () => {
    const { result } = renderHook(
      () => useInfiniteScroll({ table: 'tracked_emails', pageSize: 50 }),
      { wrapper }
    );
    
    expect(result.current).toBeDefined();
  });

  it('accepts filters', () => {
    const { result } = renderHook(
      () => useInfiniteScroll({
        table: 'tracked_emails',
        filters: { status: 'active' }
      }),
      { wrapper }
    );
    
    expect(result.current).toBeDefined();
  });
});
