import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn(() => ({ insert: vi.fn(() => Promise.resolve({ error: null })) })) },
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));

const wrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
};

describe('useImportData', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should return import function', async () => {
    const { useImportData } = await import('@/hooks/useImportData');
    const { result } = renderHook(() => useImportData(), { wrapper: wrapper() });
    expect(typeof result.current.importData).toBe('function');
  });

  it('should have importing state', async () => {
    const { useImportData } = await import('@/hooks/useImportData');
    const { result } = renderHook(() => useImportData(), { wrapper: wrapper() });
    expect(typeof result.current.isImporting).toBe('boolean');
  });
});
