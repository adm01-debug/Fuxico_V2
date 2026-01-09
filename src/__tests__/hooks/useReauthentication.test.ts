import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { signInWithPassword: vi.fn(() => Promise.resolve({ error: null })) } } }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
describe('useReauthentication', () => { it('returns reauth function', async () => { const { useReauthentication } = await import('@/hooks/useReauthentication'); const { result } = renderHook(() => useReauthentication()); expect(typeof result.current.reauthenticate).toBe('function'); }); });
