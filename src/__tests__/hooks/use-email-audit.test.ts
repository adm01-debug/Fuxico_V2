import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: vi.fn(() => ({ select: vi.fn(() => ({ eq: vi.fn(() => ({ order: vi.fn(() => ({ range: vi.fn(() => Promise.resolve({ data: [], error: null, count: 0 })) })) })) })) })), auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test' } }, error: null })) }, rpc: vi.fn(() => Promise.resolve({ data: true, error: null })) } }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
const w = ({ children }: { children: React.ReactNode }) => React.createElement(QueryClientProvider, { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) }, children);
describe('useEmailAudit', () => {
  beforeEach(() => vi.clearAllMocks());
  it('returns logs', async () => { const { useEmailAuditLogs } = await import('@/hooks/use-email-audit'); const { result } = renderHook(() => useEmailAuditLogs({}), { wrapper: w }); await waitFor(() => expect(Array.isArray(result.current.data)).toBe(true)); });
  it('has isAdmin', async () => { const { useIsAdmin } = await import('@/hooks/use-email-audit'); const { result } = renderHook(() => useIsAdmin(), { wrapper: w }); await waitFor(() => expect(typeof result.current.data).toBe('boolean')); });
});
