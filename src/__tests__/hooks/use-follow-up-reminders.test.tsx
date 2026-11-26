import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockRpc = vi.fn();
const mockInvoke = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: (...args: unknown[]) => mockRpc(...args),
    functions: { invoke: (...args: unknown[]) => mockInvoke(...args) },
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

import {
  useDueReminders,
  useCreateReminder,
  useUpdateReminderStatus,
  useDeleteReminder,
} from '@/hooks/use-follow-up-reminders';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function mockWriteChain(result: { error: unknown }) {
  const single = vi.fn().mockResolvedValue(result);
  const select = vi.fn(() => ({ single }));
  // `.eq()` é awaited direto (delete) e também encadeia `.select().single()` (update).
  const eq = vi.fn(() => ({
    select,
    then: (onFulfilled?: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) =>
      Promise.resolve(result).then(onFulfilled, onRejected),
  }));
  const update = vi.fn(() => ({ eq }));
  const del = vi.fn(() => ({ eq }));
  mockFrom.mockReturnValue({ update, delete: del });
  return { update, delete: del, eq, single };
}

describe('use-follow-up-reminders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses the create-reminder edge function instead of inserting directly', async () => {
    mockInvoke.mockResolvedValue({
      data: { success: true, reminder: { id: 'r1', reminder_days: 7 } },
      error: null,
    });

    const { result } = renderHook(() => useCreateReminder(), { wrapper: createWrapper() });
    const created = await result.current.mutateAsync({
      trackingId: 'track_001_abc',
      reminderDays: 7,
    });

    expect(mockInvoke).toHaveBeenCalledWith('create-reminder', {
      body: { trackingId: 'track_001_abc', reminderDays: 7 },
    });
    expect(mockFrom).not.toHaveBeenCalled();
    expect(created).toEqual({ id: 'r1', reminder_days: 7 });
  });

  it('surfaces the real error message returned by the edge function', async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: Object.assign(new Error('Edge Function returned a non-2xx status code'), {
        context: {
          json: () => Promise.resolve({ error: 'Tracking não pertence ao usuário' }),
        },
      }),
    });

    const { result } = renderHook(() => useCreateReminder(), { wrapper: createWrapper() });

    await expect(
      result.current.mutateAsync({ trackingId: 'track_001_abc', reminderDays: 3 })
    ).rejects.toThrow('Tracking não pertence ao usuário');
  });

  it('reads due reminders from the get_due_reminders RPC', async () => {
    mockRpc.mockResolvedValue({
      data: [
        {
          id: 'r1',
          user_id: 'user-123',
          tracking_id: 'track_001_abc',
          reminder_days: 3,
          recipient_email: 'cliente1@empresa.com',
          subject: 'Proposta Comercial Q4',
          created_at: '2026-11-01T00:00:00Z',
        },
        { id: 'r2', user_id: 'other-user', tracking_id: 'track_x', reminder_days: 3 },
      ],
      error: null,
    });

    const { result } = renderHook(() => useDueReminders(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRpc).toHaveBeenCalledWith('get_due_reminders');
    expect(result.current.data?.map((r) => r.id)).toEqual(['r1']);
  });

  it('marks a reminder as sent without using the unsupported "opened" status', async () => {
    const chain = mockWriteChain({ error: null });

    const { result } = renderHook(() => useUpdateReminderStatus(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ id: 'r1', status: 'sent' });

    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'sent', reminded_at: expect.any(String) })
    );
    expect(chain.eq).toHaveBeenCalledWith('id', 'r1');
    expect(chain.single).toHaveBeenCalled();
  });

  it('removes a reminder by id', async () => {
    const chain = mockWriteChain({ error: null });

    const { result } = renderHook(() => useDeleteReminder(), { wrapper: createWrapper() });
    await result.current.mutateAsync('r1');

    expect(chain.delete).toHaveBeenCalled();
    expect(chain.eq).toHaveBeenCalledWith('id', 'r1');
  });
});
