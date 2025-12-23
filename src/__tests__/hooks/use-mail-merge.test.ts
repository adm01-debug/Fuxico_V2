import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMailMerge } from '@/hooks/use-mail-merge';
import React from 'react';

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client: qc }, children);
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: '123', email: 'test@test.com' } } }) },
    from: vi.fn(() => ({ select: vi.fn(() => ({ eq: vi.fn(() => ({ data: [], error: null })) })) })),
    functions: { invoke: vi.fn().mockResolvedValue({ data: { sent: 10 }, error: null }) } }
}));

describe('useMailMerge', () => {
  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useMailMerge(), { wrapper });
    expect(result.current.campaigns).toEqual([]);
  });
});
