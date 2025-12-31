import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSavedFilters } from '@/hooks/use-saved-filters';

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
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } } }),
    },
  },
}));

describe('useSavedFilters', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it('returns empty filters initially', async () => {
    const { result } = renderHook(() => useSavedFilters('emails'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.filters).toEqual([]);
  });

  it('provides save filter function', () => {
    const { result } = renderHook(() => useSavedFilters('emails'), { wrapper });
    expect(typeof result.current.saveFilter).toBe('function');
  });

  it('provides delete filter function', () => {
    const { result } = renderHook(() => useSavedFilters('emails'), { wrapper });
    expect(typeof result.current.deleteFilter).toBe('function');
  });

  it('provides set default function', () => {
    const { result } = renderHook(() => useSavedFilters('emails'), { wrapper });
    expect(typeof result.current.setDefault).toBe('function');
  });
});
