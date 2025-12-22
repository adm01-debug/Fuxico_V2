import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCampaigns } from '../hooks/use-campaigns';
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
      insert: vi.fn().mockResolvedValue({ data: { id: '1' }, error: null }),
      update: vi.fn().mockResolvedValue({ data: null, error: null }),
      delete: vi.fn().mockResolvedValue({ data: null, error: null }),
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

describe('useCampaigns', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return campaigns list', async () => {
    const { result } = renderHook(() => useCampaigns(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.campaigns).toBeDefined();
    });
  });

  it('should have CRUD functions', async () => {
    const { result } = renderHook(() => useCampaigns(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(typeof result.current.createCampaign).toBe('function');
      expect(typeof result.current.updateCampaign).toBe('function');
      expect(typeof result.current.deleteCampaign).toBe('function');
    });
  });
});
