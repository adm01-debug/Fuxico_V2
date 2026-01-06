import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ order: vi.fn(() => Promise.resolve({ data: [], error: null })) })),
      })),
    })),
    auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test' } }, error: null })) },
  },
}));

const wrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
};

describe('useTrackedLinks', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should return links array', async () => {
    const { useTrackedLinks } = await import('@/hooks/use-tracked-links');
    const { result } = renderHook(() => useTrackedLinks(), { wrapper: wrapper() });
    await waitFor(() => expect(Array.isArray(result.current.links)).toBe(true));
  });

  it('should have loading state', async () => {
    const { useTrackedLinks } = await import('@/hooks/use-tracked-links');
    const { result } = renderHook(() => useTrackedLinks(), { wrapper: wrapper() });
    expect(typeof result.current.isLoading).toBe('boolean');
  });
});
