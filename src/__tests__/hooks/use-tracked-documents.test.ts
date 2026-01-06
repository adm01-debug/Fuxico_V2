import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
    auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test-user' } }, error: null })) },
  },
}));

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
};

describe('useTrackedDocuments', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should return documents array', async () => {
    const { useTrackedDocuments } = await import('@/hooks/use-tracked-documents');
    const { result } = renderHook(() => useTrackedDocuments(), { wrapper: createWrapper() });
    await waitFor(() => expect(Array.isArray(result.current.documents)).toBe(true));
  });

  it('should have loading state', async () => {
    const { useTrackedDocuments } = await import('@/hooks/use-tracked-documents');
    const { result } = renderHook(() => useTrackedDocuments(), { wrapper: createWrapper() });
    expect(typeof result.current.isLoading).toBe('boolean');
  });
});
