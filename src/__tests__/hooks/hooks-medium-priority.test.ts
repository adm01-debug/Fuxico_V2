import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  usePolls,
  useTeamBilling,
  useReplyMonitor,
  useIncomingTracker,
  useActivityDashboard,
  useSignatureGenerator,
} from '../hooks/hooks-medium-priority';
import React from 'react';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null }),
    },
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('hooks-medium-priority', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('usePolls', () => {
    it('should initialize with empty polls array', () => {
      const { result } = renderHook(() => usePolls(), { wrapper: createWrapper() });
      expect(result.current.polls).toEqual([]);
    });

    it('should have createPoll function', () => {
      const { result } = renderHook(() => usePolls(), { wrapper: createWrapper() });
      expect(typeof result.current.createPoll).toBe('function');
    });

    it('should have votePoll function', () => {
      const { result } = renderHook(() => usePolls(), { wrapper: createWrapper() });
      expect(typeof result.current.votePoll).toBe('function');
    });

    it('should have getPollResults function', () => {
      const { result } = renderHook(() => usePolls(), { wrapper: createWrapper() });
      expect(typeof result.current.getPollResults).toBe('function');
    });
  });

  describe('useTeamBilling', () => {
    it('should initialize with null billing', () => {
      const { result } = renderHook(() => useTeamBilling(), { wrapper: createWrapper() });
      expect(result.current.billing).toBeNull();
    });

    it('should have updatePlan function', () => {
      const { result } = renderHook(() => useTeamBilling(), { wrapper: createWrapper() });
      expect(typeof result.current.updatePlan).toBe('function');
    });

    it('should have addSeat function', () => {
      const { result } = renderHook(() => useTeamBilling(), { wrapper: createWrapper() });
      expect(typeof result.current.addSeat).toBe('function');
    });
  });

  describe('useReplyMonitor', () => {
    it('should initialize with empty monitors array', () => {
      const { result } = renderHook(() => useReplyMonitor(), { wrapper: createWrapper() });
      expect(result.current.monitors).toEqual([]);
    });

    it('should have createMonitor function', () => {
      const { result } = renderHook(() => useReplyMonitor(), { wrapper: createWrapper() });
      expect(typeof result.current.createMonitor).toBe('function');
    });

    it('should have checkReplies function', () => {
      const { result } = renderHook(() => useReplyMonitor(), { wrapper: createWrapper() });
      expect(typeof result.current.checkReplies).toBe('function');
    });
  });

  describe('useIncomingTracker', () => {
    it('should initialize with empty trackers array', () => {
      const { result } = renderHook(() => useIncomingTracker(), { wrapper: createWrapper() });
      expect(result.current.trackers).toEqual([]);
    });

    it('should have detectTracking function', () => {
      const { result } = renderHook(() => useIncomingTracker(), { wrapper: createWrapper() });
      expect(typeof result.current.detectTracking).toBe('function');
    });
  });

  describe('useActivityDashboard', () => {
    it('should initialize with empty activities array', () => {
      const { result } = renderHook(() => useActivityDashboard(), { wrapper: createWrapper() });
      expect(result.current.activities).toEqual([]);
    });

    it('should have refreshActivities function', () => {
      const { result } = renderHook(() => useActivityDashboard(), { wrapper: createWrapper() });
      expect(typeof result.current.refreshActivities).toBe('function');
    });

    it('should have filterByType function', () => {
      const { result } = renderHook(() => useActivityDashboard(), { wrapper: createWrapper() });
      expect(typeof result.current.filterByType).toBe('function');
    });
  });

  describe('useSignatureGenerator', () => {
    it('should initialize with empty signatures array', () => {
      const { result } = renderHook(() => useSignatureGenerator(), { wrapper: createWrapper() });
      expect(result.current.signatures).toEqual([]);
    });

    it('should have createSignature function', () => {
      const { result } = renderHook(() => useSignatureGenerator(), { wrapper: createWrapper() });
      expect(typeof result.current.createSignature).toBe('function');
    });

    it('should have generateHTML function', () => {
      const { result } = renderHook(() => useSignatureGenerator(), { wrapper: createWrapper() });
      expect(typeof result.current.generateHTML).toBe('function');
    });

    it('should have setDefault function', () => {
      const { result } = renderHook(() => useSignatureGenerator(), { wrapper: createWrapper() });
      expect(typeof result.current.setDefault).toBe('function');
    });
  });
});
