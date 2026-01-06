import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: vi.fn(() => Promise.resolve({ data: { id: 'test-id' }, error: null })),
      update: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ data: null, error: null })) })),
      delete: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ data: null, error: null })) })),
    })),
    auth: {
      getUser: vi.fn(() => Promise.resolve({ 
        data: { user: { id: 'test-user-id', email: 'test@example.com' } }, 
        error: null 
      })),
    },
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
    })),
    removeChannel: vi.fn(),
    functions: {
      invoke: vi.fn(() => Promise.resolve({ data: { tracking_id: 'track-123' }, error: null })),
    },
  },
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Initialization', () => {
    it('should return initial state', async () => {
      const { useTracking } = await import('@/hooks/use-tracking');
      const { result } = renderHook(() => useTracking(), { wrapper: createWrapper() });
      
      expect(result.current).toBeDefined();
      expect(typeof result.current.isLoading).toBe('boolean');
    });

    it('should have required properties', async () => {
      const { useTracking } = await import('@/hooks/use-tracking');
      const { result } = renderHook(() => useTracking(), { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(result.current.emails).toBeDefined();
      });
    });
  });

  describe('Data fetching', () => {
    it('should handle empty data', async () => {
      const { useTracking } = await import('@/hooks/use-tracking');
      const { result } = renderHook(() => useTracking(), { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      expect(Array.isArray(result.current.emails)).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle fetch errors gracefully', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ data: null, error: new Error('DB Error') })),
            })),
          })),
        })),
      } as any);

      const { useTracking } = await import('@/hooks/use-tracking');
      const { result } = renderHook(() => useTracking(), { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });
});
