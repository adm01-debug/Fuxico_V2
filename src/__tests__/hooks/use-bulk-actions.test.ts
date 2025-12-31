import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBulkActions } from '@/hooks/use-bulk-actions';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

describe('useBulkActions', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it('starts with no selection', () => {
    const { result } = renderHook(
      () => useBulkActions({ table: 'tracked_emails', queryKey: ['emails'] }),
      { wrapper }
    );
    expect(result.current.selectedIds).toEqual([]);
    expect(result.current.hasSelection).toBe(false);
  });

  it('toggles selection', () => {
    const { result } = renderHook(
      () => useBulkActions({ table: 'tracked_emails', queryKey: ['emails'] }),
      { wrapper }
    );
    
    act(() => {
      result.current.toggleSelection('id-1');
    });
    
    expect(result.current.selectedIds).toContain('id-1');
    expect(result.current.hasSelection).toBe(true);
    
    act(() => {
      result.current.toggleSelection('id-1');
    });
    
    expect(result.current.selectedIds).not.toContain('id-1');
  });

  it('selects all', () => {
    const { result } = renderHook(
      () => useBulkActions({ table: 'tracked_emails', queryKey: ['emails'] }),
      { wrapper }
    );
    
    act(() => {
      result.current.selectAll(['id-1', 'id-2', 'id-3']);
    });
    
    expect(result.current.selectedCount).toBe(3);
  });

  it('clears selection', () => {
    const { result } = renderHook(
      () => useBulkActions({ table: 'tracked_emails', queryKey: ['emails'] }),
      { wrapper }
    );
    
    act(() => {
      result.current.selectAll(['id-1', 'id-2']);
      result.current.clearSelection();
    });
    
    expect(result.current.selectedIds).toEqual([]);
  });

  it('checks if item is selected', () => {
    const { result } = renderHook(
      () => useBulkActions({ table: 'tracked_emails', queryKey: ['emails'] }),
      { wrapper }
    );
    
    act(() => {
      result.current.toggleSelection('id-1');
    });
    
    expect(result.current.isSelected('id-1')).toBe(true);
    expect(result.current.isSelected('id-2')).toBe(false);
  });
});
