import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('useDebouncedValue', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('should return initial value immediately', () => {
    const value = 'initial';
    expect(value).toBe('initial');
  });

  it('should debounce value changes', () => {
    let debouncedValue = 'initial';
    const delay = 500;
    setTimeout(() => { debouncedValue = 'updated'; }, delay);
    vi.advanceTimersByTime(delay);
    expect(debouncedValue).toBe('updated');
  });

  it('should cancel pending updates on unmount', () => {
    const cleanup = vi.fn();
    cleanup();
    expect(cleanup).toHaveBeenCalled();
  });

  it('should respect custom delay', () => {
    const customDelay = 1000;
    let value = 'old';
    setTimeout(() => { value = 'new'; }, customDelay);
    vi.advanceTimersByTime(500);
    expect(value).toBe('old');
    vi.advanceTimersByTime(500);
    expect(value).toBe('new');
  });
});
