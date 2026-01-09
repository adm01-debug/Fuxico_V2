import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({ limit: vi.fn(() => Promise.resolve({ data: [], error: null })) })),
        })),
      })),
      insert: vi.fn(() => Promise.resolve({ data: { id: '1' }, error: null })),
    })),
    auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test' } }, error: null })) },
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })),
    functions: { invoke: vi.fn(() => Promise.resolve({ data: { tracking_id: 't1' }, error: null })) },
  },
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client: qc }, children);
};

describe('useTracking', () => {
  beforeEach(() => vi.clearAllMocks());
  it('returns initial state', async () => {
    const { useTracking } = await import('@/hooks/use-tracking');
    const { result } = renderHook(() => useTracking(), { wrapper });
    expect(result.current).toBeDefined();
    expect(typeof result.current.isLoading).toBe('boolean');
  });
  it('has emails array', async () => {
    const { useTracking } = await import('@/hooks/use-tracking');
    const { result } = renderHook(() => useTracking(), { wrapper });
    await waitFor(() => expect(Array.isArray(result.current.emails)).toBe(true));
  });
  it('has createTracking function', async () => {
    const { useTracking } = await import('@/hooks/use-tracking');
    const { result } = renderHook(() => useTracking(), { wrapper });
    expect(typeof result.current.createTracking).toBe('function');
  });
});
