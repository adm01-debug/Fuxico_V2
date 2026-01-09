import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: vi.fn(() => ({ select: vi.fn(() => Promise.resolve({ data: [], error: null })), insert: vi.fn(() => Promise.resolve({ data: { id: '1' }, error: null })), update: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })), delete: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })) })) } }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
const w = ({ children }: { children: React.ReactNode }) => React.createElement(QueryClientProvider, { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) }, children);
describe('useCRUD', () => { it('returns CRUD ops', async () => { const { useCRUD } = await import('@/hooks/useCRUD'); const { result } = renderHook(() => useCRUD('test'), { wrapper: w }); expect(result.current.create).toBeDefined(); expect(result.current.read).toBeDefined(); }); });
