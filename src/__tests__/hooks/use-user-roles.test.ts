import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { role: 'user' }, error: null })),
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

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useUserRoles', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.resetAllMocks());

  describe('Role detection', () => {
    it('should return role state', async () => {
      const { useUserRoles } = await import('@/hooks/use-user-roles');
      const { result } = renderHook(() => useUserRoles(), { wrapper: createWrapper() });
      expect(result.current).toBeDefined();
    });

    it('should have isAdmin property', async () => {
      const { useUserRoles } = await import('@/hooks/use-user-roles');
      const { result } = renderHook(() => useUserRoles(), { wrapper: createWrapper() });
      await waitFor(() => expect(typeof result.current.isAdmin).toBe('boolean'));
    });

    it('should have role property', async () => {
      const { useUserRoles } = await import('@/hooks/use-user-roles');
      const { result } = renderHook(() => useUserRoles(), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.role).toBeDefined());
    });
  });
});
