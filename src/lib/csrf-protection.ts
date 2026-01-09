/**
 * CSRF Protection
 * @description Tokens anti-CSRF
 */

export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

export function setCsrfToken(): string {
  const token = generateCsrfToken();
  sessionStorage.setItem('csrf_token', token);
  return token;
}

export function getCsrfToken(): string | null {
  return sessionStorage.getItem('csrf_token');
}

export function validateCsrfToken(token: string): boolean {
  const storedToken = getCsrfToken();
  return storedToken !== null && storedToken === token;
}

export function csrfHeader(): Record<string, string> {
  const token = getCsrfToken();
  return token ? { 'X-CSRF-Token': token } : {};
}
