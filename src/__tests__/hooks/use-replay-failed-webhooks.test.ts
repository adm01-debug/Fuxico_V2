import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useReplayFailedWebhooks } from '@/hooks/use-webhook';

const rpcMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpcMock(...args),
    from: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useReplayFailedWebhooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('chama a RPC replay_failed_webhooks com o webhook e o limite padrao', async () => {
    rpcMock.mockResolvedValue({ data: { webhook_id: 'w1', enqueued: 3 }, error: null });

    const { result } = renderHook(() => useReplayFailedWebhooks(), { wrapper: createWrapper() });
    result.current.mutate({ webhookId: 'w1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(rpcMock).toHaveBeenCalledWith('replay_failed_webhooks', {
      _webhook_id: 'w1',
      _limit: 50,
    });
    expect(result.current.data).toEqual({ webhook_id: 'w1', enqueued: 3 });
  });

  it('propaga o erro da RPC quando o webhook nao pertence ao usuario', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: 'not_authorized' } });

    const { result } = renderHook(() => useReplayFailedWebhooks(), { wrapper: createWrapper() });
    result.current.mutate({ webhookId: 'w-alheio' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('not_authorized');
  });
});
