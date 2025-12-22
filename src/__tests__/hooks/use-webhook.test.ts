import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useWebhook } from '../hooks/use-webhook';
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
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
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

describe('useWebhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return webhook config', async () => {
    const { result } = renderHook(() => useWebhook(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.config).toBeDefined();
    });
  });

  it('should have save function', async () => {
    const { result } = renderHook(() => useWebhook(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(typeof result.current.saveConfig).toBe('function');
    });
  });
});
