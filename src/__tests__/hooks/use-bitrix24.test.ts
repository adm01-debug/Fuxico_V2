import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({ select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn(() => Promise.resolve({ data: { webhook_url: 'https://test.bitrix24.com' }, error: null })), order: vi.fn(() => Promise.resolve({ data: [], error: null })) })) })), upsert: vi.fn(() => Promise.resolve({ error: null })) })),
    auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test' } }, error: null })) },
    functions: { invoke: vi.fn(() => Promise.resolve({ data: { success: true }, error: null })) },
  },
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
const wrapper = ({ children }: { children: React.ReactNode }) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client: qc }, children);
};
describe('useBitrix24', () => {
  beforeEach(() => vi.clearAllMocks());
  it('returns config state', async () => {
    const { useBitrix24 } = await import('@/hooks/use-bitrix24');
    const { result } = renderHook(() => useBitrix24(), { wrapper });
    expect(result.current).toBeDefined();
  });
  it('has isConfigured', async () => {
    const { useBitrix24 } = await import('@/hooks/use-bitrix24');
    const { result } = renderHook(() => useBitrix24(), { wrapper });
    await waitFor(() => expect(typeof result.current.isConfigured).toBe('boolean'));
  });
  it('has syncContacts', async () => {
    const { useBitrix24 } = await import('@/hooks/use-bitrix24');
    const { result } = renderHook(() => useBitrix24(), { wrapper });
    expect(typeof result.current.syncContacts).toBe('function');
  });
});
