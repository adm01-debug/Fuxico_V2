import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 't' } }, error: null }) }, from: vi.fn(() => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: {}, error: null }) })) } }));
const w = ({ children }: any) => React.createElement(QueryClientProvider, { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) }, children);
describe('useAuditConfig', () => { it('init', async () => { const { useAuditConfig } = await import('../hooks/use-audit-config'); const { result } = renderHook(() => useAuditConfig(), { wrapper: w }); await waitFor(() => expect(result.current).toBeDefined()); }); });
