import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEmailAudit } from '../hooks/use-email-audit';
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
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
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

describe('useEmailAudit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return audit logs', async () => {
    const { result } = renderHook(() => useEmailAudit(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.logs).toBeDefined();
      expect(Array.isArray(result.current.logs)).toBe(true);
    });
  });

  it('should have fraud alerts', async () => {
    const { result } = renderHook(() => useEmailAudit(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.fraudAlerts).toBeDefined();
    });
  });
});
