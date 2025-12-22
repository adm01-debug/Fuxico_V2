import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 't' } }, error: null }) }, from: vi.fn(() => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), gte: vi.fn().mockReturnThis(), order: vi.fn().mockResolvedValue({ data: [], error: null }) })) } }));
const w = ({ children }: { children: React.ReactNode }) => React.createElement(QueryClientProvider, { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) }, children);
describe('useTrackingTrends', () => { beforeEach(() => vi.clearAllMocks()); it('init', async () => { const { useTrackingTrends } = await import('../hooks/use-tracking-trends'); const { result } = renderHook(() => useTrackingTrends(), { wrapper: w }); await waitFor(() => expect(result.current.trends).toBeDefined()); }); });
