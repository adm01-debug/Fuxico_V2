import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null }) },
    from: vi.fn(() => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { onboarding_completed: false }, error: null }) }))
  }
}));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client: qc }, children);
};

describe('useOnboarding', () => {
  beforeEach(() => vi.clearAllMocks());
  it('should initialize', async () => {
    const { useOnboarding } = await import('../hooks/use-onboarding');
    const { result } = renderHook(() => useOnboarding(), { wrapper });
    await waitFor(() => expect(result.current).toBeDefined());
  });
});
