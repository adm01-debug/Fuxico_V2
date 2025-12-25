/**
 * Security Middleware for Edge Functions
 * 
 * @description Combines IP whitelist, rate limiting, and security headers.
 * Use this middleware to protect all sensitive endpoints.
 */

import { validateIPAccess, getClientIP, isIPWhitelisted } from './ip-whitelist.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from './cors.ts';

// Rate limiting storage (in-memory, resets on function cold start)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limit configuration
 */
const RATE_LIMIT = {
  windowMs: 60000,        // 1 minute window
  maxRequests: 100,       // Max requests per window
  blockDuration: 300000,  // 5 minutes block after exceeding
};

/**
 * Check rate limit for IP
 */
function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT.windowMs });
    return { allowed: true, remaining: RATE_LIMIT.maxRequests - 1, resetIn: RATE_LIMIT.windowMs };
  }
  
  if (record.count >= RATE_LIMIT.maxRequests) {
    return { allowed: false, remaining: 0, resetIn: record.resetTime - now };
  }
  
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT.maxRequests - record.count, resetIn: record.resetTime - now };
}

/**
 * Security headers for all responses
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
  };
}

/**
 * Create secure JSON response
 */
export function secureJsonResponse(
  data: unknown,
  corsHeaders: Record<string, string>,
  status = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...getSecurityHeaders(),
    },
  });
}

/**
 * Create error response
 */
export function errorResponse(
  message: string,
  code: string,
  status: number,
  corsHeaders: Record<string, string>
): Response {
  return secureJsonResponse({ error: message, code }, corsHeaders, status);
}

/**
 * Full security middleware
 * 
 * @example
 * ```typescript
 * import { securityMiddleware } from '../_shared/security-middleware.ts';
 * 
 * Deno.serve(async (req) => {
 *   // Check security
 *   const securityCheck = await securityMiddleware(req);
 *   if (securityCheck) return securityCheck;
 *   
 *   // Your handler code here
 * });
 * ```
 */
export async function securityMiddleware(req: Request): Promise<Response | null> {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(corsHeaders);
  }
  
  // Check IP whitelist
  const ipBlock = validateIPAccess(req);
  if (ipBlock) {
    return new Response(ipBlock.body, {
      status: 403,
      headers: { ...corsHeaders, ...getSecurityHeaders() },
    });
  }
  
  // Check rate limit
  const clientIP = getClientIP(req);
  const rateLimit = checkRateLimit(clientIP);
  
  if (!rateLimit.allowed) {
    return errorResponse(
      'Too many requests. Please try again later.',
      'RATE_LIMITED',
      429,
      corsHeaders
    );
  }
  
  // All checks passed
  return null;
}

/**
 * Log security event
 */
export function logSecurityEvent(
  event: 'access_granted' | 'access_denied' | 'rate_limited',
  ip: string,
  details?: Record<string, unknown>
): void {
  const timestamp = new Date().toISOString();
  console.log(JSON.stringify({
    type: 'security_event',
    event,
    ip,
    timestamp,
    ...details,
  }));
}

/**
 * Wrapper for protected handlers
 */
export function protectedHandler(
  handler: (req: Request, corsHeaders: Record<string, string>) => Promise<Response>
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    const corsHeaders = getCorsHeaders(req.headers.get('origin'));
    
    // Run security checks
    const blocked = await securityMiddleware(req);
    if (blocked) return blocked;
    
    // Log successful access
    const clientIP = getClientIP(req);
    logSecurityEvent('access_granted', clientIP, { path: new URL(req.url).pathname });
    
    try {
      return await handler(req, corsHeaders);
    } catch (error) {
      console.error('Handler error:', error);
      return errorResponse(
        'Internal server error',
        'INTERNAL_ERROR',
        500,
        corsHeaders
      );
    }
  };
}
