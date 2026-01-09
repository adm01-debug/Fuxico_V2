import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: vi.fn(() => ({ select: vi.fn(() => ({ eq: vi.fn(() => ({ order: vi.fn(() => Promise.resolve({ data: [], error: null })) })) })) })), auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test' } }, error: null })) } } }));
const w = ({ children }: { children: React.ReactNode }) => React.createElement(QueryClientProvider, { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) }, children);
describe('useTrackedDocuments', () => { it('returns documents', async () => { const { useTrackedDocuments } = await import('@/hooks/use-tracked-documents'); const { result } = renderHook(() => useTrackedDocuments(), { wrapper: w }); await waitFor(() => expect(Array.isArray(result.current.documents)).toBe(true)); }); });
