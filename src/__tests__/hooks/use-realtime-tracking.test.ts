import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
vi.mock('@/integrations/supabase/client', () => ({ supabase: { channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })), removeChannel: vi.fn() } }));
describe('useRealtimeTracking', () => { it('returns tracking state', async () => { const { useRealtimeTracking } = await import('@/hooks/use-realtime-tracking'); const { result } = renderHook(() => useRealtimeTracking('test-id')); expect(result.current).toBeDefined(); }); });
