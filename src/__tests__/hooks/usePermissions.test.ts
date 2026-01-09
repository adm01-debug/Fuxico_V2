import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test' } }, error: null })) } } }));
describe('usePermissions', () => {
  beforeEach(() => vi.clearAllMocks());
  it('returns permissions', async () => { const { usePermissions } = await import('@/hooks/usePermissions'); const { result } = renderHook(() => usePermissions()); expect(result.current).toBeDefined(); });
  it('has canAccess', async () => { const { usePermissions } = await import('@/hooks/usePermissions'); const { result } = renderHook(() => usePermissions()); expect(typeof result.current.canAccess).toBe('function'); });
});
