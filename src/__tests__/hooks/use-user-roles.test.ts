import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: vi.fn(() => ({ select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn(() => Promise.resolve({ data: { role: 'user' }, error: null })) })) })) })), auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test' } }, error: null })) } } }));
const w = ({ children }: { children: React.ReactNode }) => React.createElement(QueryClientProvider, { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) }, children);
describe('useUserRoles', () => {
  beforeEach(() => vi.clearAllMocks());
  it('returns role', async () => { const { useUserRoles } = await import('@/hooks/use-user-roles'); const { result } = renderHook(() => useUserRoles(), { wrapper: w }); await waitFor(() => expect(result.current.role).toBeDefined()); });
  it('has isAdmin', async () => { const { useUserRoles } = await import('@/hooks/use-user-roles'); const { result } = renderHook(() => useUserRoles(), { wrapper: w }); await waitFor(() => expect(typeof result.current.isAdmin).toBe('boolean')); });
});
