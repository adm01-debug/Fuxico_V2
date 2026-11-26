import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockRpc = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: vi.fn(),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null }),
      getSession: vi
        .fn()
        .mockResolvedValue({ data: { session: { access_token: 'tok' } }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ user: { id: 'user-123' }, session: {}, loading: false }),
}));

import { useABSegmentPreview } from '@/hooks/use-ab-tests';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useABSegmentPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('previews the dispatch audience through preview_ab_segment', async () => {
    mockRpc.mockResolvedValue({
      data: [{ recipient_email: 'cliente1@empresa.com', engagement_score: 80, score_level: 'hot' }],
      error: null,
    });

    const { result } = renderHook(() => useABSegmentPreview({ min_score: 50, last_open_days: 7 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRpc).toHaveBeenCalledWith('preview_ab_segment', {
      p_user_id: 'user-123',
      p_filters: { min_score: 50, last_open_days: 7 },
    });
    expect(result.current.data).toHaveLength(1);
  });

  it('does not query while the create dialog is closed', async () => {
    const { result } = renderHook(() => useABSegmentPreview({ min_score: 0 }, false), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockRpc).not.toHaveBeenCalled();
  });
});
