import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test' } }, error: null }) },
    from: vi.fn(() => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { role: 'user' }, error: null }) }))
  }
}));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client: qc }, children);
};

describe('useUserRoles', () => {
  beforeEach(() => vi.clearAllMocks());
  it('should return role', async () => {
    const { useUserRoles } = await import('../hooks/use-user-roles');
    const { result } = renderHook(() => useUserRoles(), { wrapper });
    await waitFor(() => expect(result.current.role).toBeDefined());
  });
});
