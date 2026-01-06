import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn(() => Promise.resolve({ data: [], error: null, count: 0 })),
          })),
        })),
        order: vi.fn(() => ({
          range: vi.fn(() => Promise.resolve({ data: [], error: null, count: 0 })),
        })),
      })),
    })),
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

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useEmailAudit', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.resetAllMocks());

  describe('Initialization', () => {
    it('should return audit logs state', async () => {
      const { useEmailAudit } = await import('@/hooks/use-email-audit');
      const { result } = renderHook(() => useEmailAudit(), { wrapper: createWrapper() });
      expect(result.current).toBeDefined();
    });

    it('should have logs array', async () => {
      const { useEmailAudit } = await import('@/hooks/use-email-audit');
      const { result } = renderHook(() => useEmailAudit(), { wrapper: createWrapper() });
      await waitFor(() => expect(Array.isArray(result.current.logs)).toBe(true));
    });
  });

  describe('Filtering', () => {
    it('should have filter capabilities', async () => {
      const { useEmailAudit } = await import('@/hooks/use-email-audit');
      const { result } = renderHook(() => useEmailAudit(), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.filters).toBeDefined());
    });
  });

  describe('Pagination', () => {
    it('should handle pagination state', async () => {
      const { useEmailAudit } = await import('@/hooks/use-email-audit');
      const { result } = renderHook(() => useEmailAudit(), { wrapper: createWrapper() });
      await waitFor(() => {
        expect(result.current.totalCount).toBeDefined();
        expect(result.current.currentPage).toBeDefined();
      });
    });
  });
});
