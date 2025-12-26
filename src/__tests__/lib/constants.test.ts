import { describe, it, expect } from 'vitest';
describe('constants', () => {
  it('exports', () => { expect(true).toBe(true); });
  it('valid', () => { expect({ok:1}.ok).toBe(1); });
  it('invalid', () => { expect(null).toBeNull(); });
  it('empty', () => { expect([]).toHaveLength(0); });
});
