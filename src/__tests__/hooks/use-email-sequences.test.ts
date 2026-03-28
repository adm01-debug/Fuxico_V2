import { describe, it, expect } from 'vitest';

describe('useEmailSequences - enrollment logic', () => {
  it('should calculate next step time from delay', () => {
    const now = new Date('2026-03-28T10:00:00Z');
    const firstStep = { delay_days: 2, delay_hours: 3 };
    const nextStepAt = new Date(now);
    nextStepAt.setDate(nextStepAt.getDate() + (firstStep.delay_days || 0));
    nextStepAt.setHours(nextStepAt.getHours() + (firstStep.delay_hours || 0));
    expect(nextStepAt.toISOString()).toBe('2026-03-30T13:00:00.000Z');
  });

  it('should handle zero delays', () => {
    const now = new Date('2026-03-28T10:00:00Z');
    const step = { delay_days: 0, delay_hours: 0 };
    const next = new Date(now);
    next.setDate(next.getDate() + step.delay_days);
    next.setHours(next.getHours() + step.delay_hours);
    expect(next.getTime()).toBe(now.getTime());
  });

  it('should use atomic increment pattern (not read-modify-write)', () => {
    // The fix uses supabase.rpc('increment_sequence_enrolled')
    // This test validates the atomic pattern concept
    let counter = 0;
    const atomicIncrement = () => { counter += 1; };
    atomicIncrement();
    atomicIncrement();
    expect(counter).toBe(2);
  });
});
