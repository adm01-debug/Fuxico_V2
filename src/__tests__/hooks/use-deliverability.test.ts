import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
vi.mock('@/integrations/supabase/client', () => ({ supabase: { functions: { invoke: vi.fn(() => Promise.resolve({ data: { score: 85 }, error: null })) }, auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test' } }, error: null })) } } }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
const w = ({ children }: { children: React.ReactNode }) => React.createElement(QueryClientProvider, { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) }, children);
describe('useDeliverability', () => { it('returns deliverability state', async () => { const { useDeliverability } = await import('@/hooks/use-deliverability'); const { result } = renderHook(() => useDeliverability(), { wrapper: w }); expect(result.current).toBeDefined(); }); });
