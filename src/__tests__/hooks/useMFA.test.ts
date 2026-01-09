import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: vi.fn(() => ({ select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn(() => Promise.resolve({ data: { is_enabled: false }, error: null })) })) })), insert: vi.fn(() => Promise.resolve({ error: null })), update: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })) })), auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test' } }, error: null })) }, functions: { invoke: vi.fn(() => Promise.resolve({ data: { secret: 'xxx' }, error: null })) } } }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
describe('useMFA', () => {
  beforeEach(() => vi.clearAllMocks());
  it('returns mfa state', async () => { const { useMFA } = await import('@/hooks/useMFA'); const { result } = renderHook(() => useMFA()); expect(result.current).toBeDefined(); });
  it('has enableMFA', async () => { const { useMFA } = await import('@/hooks/useMFA'); const { result } = renderHook(() => useMFA()); expect(typeof result.current.enableMFA).toBe('function'); });
  it('has verifyTOTP', async () => { const { useMFA } = await import('@/hooks/useMFA'); const { result } = renderHook(() => useMFA()); expect(typeof result.current.verifyTOTP).toBe('function'); });
});
