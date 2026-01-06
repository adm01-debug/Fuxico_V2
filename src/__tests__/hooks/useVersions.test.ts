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
      insert: vi.fn(() => Promise.resolve({ error: null })),
    })),
  },
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));

const wrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
};

describe('useVersions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should return versions state', async () => {
    const { useVersions } = await import('@/hooks/useVersions');
    const { result } = renderHook(() => useVersions('test-entity', 'test-id'), { wrapper: wrapper() });
    expect(result.current).toBeDefined();
  });

  it('should have versions array', async () => {
    const { useVersions } = await import('@/hooks/useVersions');
    const { result } = renderHook(() => useVersions('test-entity', 'test-id'), { wrapper: wrapper() });
    await waitFor(() => expect(Array.isArray(result.current.versions)).toBe(true));
  });

  it('should have createVersion function', async () => {
    const { useVersions } = await import('@/hooks/useVersions');
    const { result } = renderHook(() => useVersions('test-entity', 'test-id'), { wrapper: wrapper() });
    expect(typeof result.current.createVersion).toBe('function');
  });
});
