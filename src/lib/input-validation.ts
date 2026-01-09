/**
 * Input Validation Utilities
 */

export const validators = {
  email: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  uuid: (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v),
  url: (v: string) => { try { new URL(v); return true; } catch { return false; } },
  phone: (v: string) => /^\+?[\d\s-]{10,}$/.test(v),
  alphanumeric: (v: string) => /^[a-zA-Z0-9]+$/.test(v),
};

export function validateRequired(value: unknown, name: string): void {
  if (value === undefined || value === null || value === '') {
    throw new Error(`${name} is required`);
  }
}

export function validateMaxLength(value: string, max: number, name: string): void {
  if (value.length > max) {
    throw new Error(`${name} must be at most ${max} characters`);
  }
}
