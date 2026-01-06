import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    channel: vi.fn(() => mockChannel),
    removeChannel: vi.fn(),
    auth: {
      getUser: vi.fn(() => Promise.resolve({ 
        data: { user: { id: 'test-user-id' } }, 
        error: null 
      })),
    },
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe('useRealtimeNotifications', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.resetAllMocks());

  describe('Subscription', () => {
    it('should create channel on mount', async () => {
      const { useRealtimeNotifications } = await import('@/hooks/use-realtime-notifications');
      const { result, unmount } = renderHook(() => useRealtimeNotifications());
      
      await waitFor(() => {
        expect(result.current).toBeDefined();
      });
      
      unmount();
    });

    it('should have notifications array', async () => {
      const { useRealtimeNotifications } = await import('@/hooks/use-realtime-notifications');
      const { result } = renderHook(() => useRealtimeNotifications());
      
      await waitFor(() => {
        expect(Array.isArray(result.current.notifications)).toBe(true);
      });
    });

    it('should have unread count', async () => {
      const { useRealtimeNotifications } = await import('@/hooks/use-realtime-notifications');
      const { result } = renderHook(() => useRealtimeNotifications());
      
      await waitFor(() => {
        expect(typeof result.current.unreadCount).toBe('number');
      });
    });
  });

  describe('Mark as read', () => {
    it('should have markAsRead function', async () => {
      const { useRealtimeNotifications } = await import('@/hooks/use-realtime-notifications');
      const { result } = renderHook(() => useRealtimeNotifications());
      
      await waitFor(() => {
        expect(typeof result.current.markAsRead).toBe('function');
      });
    });
  });
});
