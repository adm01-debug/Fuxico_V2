import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: [], error: null })),
      insert: vi.fn(() => Promise.resolve({ data: { id: '1' }, error: null })),
      update: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })),
      delete: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })),
    })),
  },
}));

vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));

const wrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
};

describe('useCRUD', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should return CRUD operations', async () => {
    const { useCRUD } = await import('@/hooks/useCRUD');
    const { result } = renderHook(() => useCRUD('test_table'), { wrapper: wrapper() });
    expect(result.current.create).toBeDefined();
    expect(result.current.read).toBeDefined();
    expect(result.current.update).toBeDefined();
    expect(result.current.remove).toBeDefined();
  });

  it('should have loading states', async () => {
    const { useCRUD } = await import('@/hooks/useCRUD');
    const { result } = renderHook(() => useCRUD('test_table'), { wrapper: wrapper() });
    expect(typeof result.current.isLoading).toBe('boolean');
  });
});
