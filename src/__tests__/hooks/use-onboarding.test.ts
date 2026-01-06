import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ single: vi.fn(() => Promise.resolve({ data: { completed: false }, error: null })) })),
      })),
      upsert: vi.fn(() => Promise.resolve({ error: null })),
    })),
    auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test' } }, error: null })) },
  },
}));

describe('useOnboarding', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should return onboarding state', async () => {
    const { useOnboarding } = await import('@/hooks/use-onboarding');
    const { result } = renderHook(() => useOnboarding());
    expect(result.current).toBeDefined();
  });

  it('should have currentStep property', async () => {
    const { useOnboarding } = await import('@/hooks/use-onboarding');
    const { result } = renderHook(() => useOnboarding());
    await waitFor(() => expect(typeof result.current.currentStep).toBe('number'));
  });

  it('should have nextStep function', async () => {
    const { useOnboarding } = await import('@/hooks/use-onboarding');
    const { result } = renderHook(() => useOnboarding());
    expect(typeof result.current.nextStep).toBe('function');
  });

  it('should have skipOnboarding function', async () => {
    const { useOnboarding } = await import('@/hooks/use-onboarding');
    const { result } = renderHook(() => useOnboarding());
    expect(typeof result.current.skipOnboarding).toBe('function');
  });
});
