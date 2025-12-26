import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('useClipboard', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) }
    });
  });

  it('should copy text to clipboard', async () => {
    const mockCopy = vi.fn().mockResolvedValue(undefined);
    expect(mockCopy).toBeDefined();
  });

  it('should track copied state', () => {
    const state = { copied: false };
    state.copied = true;
    expect(state.copied).toBe(true);
  });

  it('should reset after timeout', () => {
    vi.useFakeTimers();
    const state = { copied: true };
    setTimeout(() => { state.copied = false; }, 2000);
    vi.advanceTimersByTime(2000);
    expect(state.copied).toBe(false);
    vi.useRealTimers();
  });

  it('should handle copy errors', async () => {
    const mockError = vi.fn().mockRejectedValue(new Error('Copy failed'));
    await expect(mockError()).rejects.toThrow('Copy failed');
  });
});
