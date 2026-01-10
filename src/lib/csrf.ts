/**
 * CSRF Protection utilities
 * 
 * @description
 * Utilities for generating and validating CSRF tokens.
 */

/**
 * Generates a cryptographically secure random token
 */
export function generateToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * CSRF Token manager
 */
export class CSRFTokenManager {
  private static readonly STORAGE_KEY = 'csrf_token';
  private static readonly HEADER_NAME = 'X-CSRF-Token';
  
  /**
   * Gets or creates a CSRF token
   */
  static getToken(): string {
    let token = sessionStorage.getItem(this.STORAGE_KEY);
    if (!token) {
      token = generateToken();
      sessionStorage.setItem(this.STORAGE_KEY, token);
    }
    return token;
  }
  
  /**
   * Validates a token against stored token
   */
  static validateToken(token: string): boolean {
    const storedToken = sessionStorage.getItem(this.STORAGE_KEY);
    return storedToken !== null && token === storedToken;
  }
  
  /**
   * Rotates the token (call after sensitive operations)
   */
  static rotateToken(): string {
    const newToken = generateToken();
    sessionStorage.setItem(this.STORAGE_KEY, newToken);
    return newToken;
  }
  
  /**
   * Gets headers with CSRF token
   */
  static getHeaders(): Record<string, string> {
    return {
      [this.HEADER_NAME]: this.getToken(),
    };
  }
  
  /**
   * Clears the token
   */
  static clearToken(): void {
    sessionStorage.removeItem(this.STORAGE_KEY);
  }
}

/**
 * Hook-friendly function to get CSRF token
 */
export function useCSRFToken(): string {
  return CSRFTokenManager.getToken();
}

export default CSRFTokenManager;
