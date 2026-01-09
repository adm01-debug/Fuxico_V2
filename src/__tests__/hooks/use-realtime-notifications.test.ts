import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('@/integrations/supabase/client', () => ({ supabase: { channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })), removeChannel: vi.fn(), auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test' } }, error: null })) } } }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
describe('useRealtimeNotifications', () => {
  beforeEach(() => vi.clearAllMocks());
  it('returns notifications', async () => { const { useRealtimeNotifications } = await import('@/hooks/use-realtime-notifications'); const { result } = renderHook(() => useRealtimeNotifications()); await waitFor(() => expect(Array.isArray(result.current.notifications)).toBe(true)); });
  it('has unreadCount', async () => { const { useRealtimeNotifications } = await import('@/hooks/use-realtime-notifications'); const { result } = renderHook(() => useRealtimeNotifications()); await waitFor(() => expect(typeof result.current.unreadCount).toBe('number')); });
});
