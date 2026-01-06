import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: vi.fn(() => Promise.resolve({ data: { id: 'test-id' }, error: null })),
      update: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ data: null, error: null })) })),
      upsert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
    auth: {
      getUser: vi.fn(() => Promise.resolve({ 
        data: { user: { id: 'test-user-id' } }, 
        error: null 
      })),
    },
    functions: {
      invoke: vi.fn(() => Promise.resolve({ data: { success: true }, error: null })),
    },
  },
}));

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

describe('useBitrix24', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Configuration', () => {
    it('should return initial config state', async () => {
      const { useBitrix24 } = await import('@/hooks/use-bitrix24');
      const { result } = renderHook(() => useBitrix24(), { wrapper: createWrapper() });
      
      expect(result.current).toBeDefined();
    });

    it('should have isConfigured property', async () => {
      const { useBitrix24 } = await import('@/hooks/use-bitrix24');
      const { result } = renderHook(() => useBitrix24(), { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(typeof result.current.isConfigured).toBe('boolean');
      });
    });
  });

  describe('Sync Operations', () => {
    it('should have sync function', async () => {
      const { useBitrix24 } = await import('@/hooks/use-bitrix24');
      const { result } = renderHook(() => useBitrix24(), { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(typeof result.current.syncContacts).toBe('function');
      });
    });

    it('should handle sync state', async () => {
      const { useBitrix24 } = await import('@/hooks/use-bitrix24');
      const { result } = renderHook(() => useBitrix24(), { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(typeof result.current.isSyncing).toBe('boolean');
      });
    });
  });

  describe('Error handling', () => {
    it('should handle configuration errors', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: new Error('Config error') })),
          })),
        })),
      } as any);

      const { useBitrix24 } = await import('@/hooks/use-bitrix24');
      const { result } = renderHook(() => useBitrix24(), { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(result.current.isConfigured).toBe(false);
      });
    });
  });
});
