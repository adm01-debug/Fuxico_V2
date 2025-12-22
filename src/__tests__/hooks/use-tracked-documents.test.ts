import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTrackedDocuments } from '../hooks/use-tracked-documents';
import React from 'react';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useTrackedDocuments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return documents list', async () => {
    const { result } = renderHook(() => useTrackedDocuments(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.documents).toBeDefined();
      expect(Array.isArray(result.current.documents)).toBe(true);
    });
  });

  it('should handle loading state', async () => {
    const { result } = renderHook(() => useTrackedDocuments(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBeDefined();
  });
});
