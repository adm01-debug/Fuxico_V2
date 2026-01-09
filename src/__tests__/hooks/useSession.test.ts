import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { getSession: vi.fn(() => Promise.resolve({ data: { session: { user: { id: 'test' } } }, error: null })), onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })) } } }));
describe('useSession', () => {
  beforeEach(() => vi.clearAllMocks());
  it('returns session', async () => { const { useSession } = await import('@/hooks/useSession'); const { result } = renderHook(() => useSession()); expect(result.current).toBeDefined(); });
  it('has isAuthenticated', async () => { const { useSession } = await import('@/hooks/useSession'); const { result } = renderHook(() => useSession()); await waitFor(() => expect(typeof result.current.isAuthenticated).toBe('boolean')); });
});
