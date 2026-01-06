import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));

describe('useExportData', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should return export functions', async () => {
    const { useExportData } = await import('@/hooks/useExportData');
    const { result } = renderHook(() => useExportData());
    expect(typeof result.current.exportToCSV).toBe('function');
    expect(typeof result.current.exportToPDF).toBe('function');
    expect(typeof result.current.exportToJSON).toBe('function');
  });

  it('should have exporting state', async () => {
    const { useExportData } = await import('@/hooks/useExportData');
    const { result } = renderHook(() => useExportData());
    expect(typeof result.current.isExporting).toBe('boolean');
  });
});
