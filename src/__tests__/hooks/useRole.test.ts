import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test' } }, error: null })) } } }));
describe('useRole', () => { it('returns role state', async () => { const { useRole } = await import('@/hooks/useRole'); const { result } = renderHook(() => useRole()); expect(result.current).toBeDefined(); }); });
