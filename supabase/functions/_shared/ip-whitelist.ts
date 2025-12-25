/**
 * IP Whitelist Configuration
 * 
 * @description Central configuration for allowed IP addresses.
 * Only requests from these IPs will be processed.
 * 
 * IMPORTANT: Update this list with your trusted IPs!
 */

// Environment-based whitelist
const WHITELISTED_IPS_ENV = Deno.env.get('WHITELISTED_IPS') || '';

// Parse environment variable (comma-separated)
const envIPs = WHITELISTED_IPS_ENV
  .split(',')
  .map(ip => ip.trim())
  .filter(ip => ip.length > 0);

/**
 * Default trusted IPs
 * Add your office, VPN, and production server IPs here
 */
export const WHITELISTED_IPS: string[] = [
  // Localhost / Development
  '127.0.0.1',
  '::1',
  'localhost',
  
  // Private Networks (optional - remove in production if not needed)
  // '10.0.0.0/8',
  // '172.16.0.0/12',
  // '192.168.0.0/16',
  
  // Add your trusted IPs below:
  // '203.0.113.50',      // Office IP
  // '198.51.100.25',     // VPN Server
  // '192.0.2.100',       // Production Server
  
  // IPs from environment variable
  ...envIPs,
];

/**
 * Supabase/Vercel Edge IPs (always allowed for internal calls)
 * These are Supabase Edge Function internal IPs
 */
export const INFRASTRUCTURE_IPS: string[] = [
  // Supabase Edge Runtime
  // Add Supabase infrastructure IPs if known
];

/**
 * IPs that bypass whitelist check (for tracking pixels, public endpoints)
 * These endpoints need to be accessible from email clients
 */
export const PUBLIC_ENDPOINTS: string[] = [
  'track-pixel',
  'track-link',
  'track-document',
  'track-standalone-link',
  'track-beacon',
  'unsubscribe',
];

/**
 * Check if an IP is in CIDR range
 */
function ipInCIDR(ip: string, cidr: string): boolean {
  if (!cidr.includes('/')) return ip === cidr;
  
  const [range, bits] = cidr.split('/');
  const mask = ~(2 ** (32 - parseInt(bits)) - 1);
  
  const ipToInt = (ipStr: string): number => {
    return ipStr.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
  };
  
  try {
    const ipInt = ipToInt(ip);
    const rangeInt = ipToInt(range);
    return (ipInt & mask) === (rangeInt & mask);
  } catch {
    return false;
  }
}

/**
 * Extract real IP from request headers
 */
export function getClientIP(req: Request): string {
  // Check various headers for real IP (in order of reliability)
  const headers = [
    'cf-connecting-ip',      // Cloudflare
    'x-real-ip',             // Nginx
    'x-forwarded-for',       // Standard proxy header
    'x-client-ip',           // Apache
    'true-client-ip',        // Akamai
    'x-cluster-client-ip',   // Rackspace
  ];
  
  for (const header of headers) {
    const value = req.headers.get(header);
    if (value) {
      // x-forwarded-for can contain multiple IPs, get the first one
      const ip = value.split(',')[0].trim();
      if (ip) return ip;
    }
  }
  
  return 'unknown';
}

/**
 * Check if IP is whitelisted
 */
export function isIPWhitelisted(ip: string): boolean {
  if (!ip || ip === 'unknown') return false;
  
  // Check direct match or CIDR range
  for (const allowedIP of [...WHITELISTED_IPS, ...INFRASTRUCTURE_IPS]) {
    if (allowedIP.includes('/')) {
      if (ipInCIDR(ip, allowedIP)) return true;
    } else if (ip === allowedIP) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if endpoint is public (bypasses IP check)
 */
export function isPublicEndpoint(pathname: string): boolean {
  return PUBLIC_ENDPOINTS.some(endpoint => 
    pathname.includes(endpoint) || pathname.endsWith(endpoint)
  );
}

/**
 * Validate request IP - main function to use in Edge Functions
 * 
 * @returns null if allowed, Response if blocked
 */
export function validateIPAccess(req: Request): Response | null {
  const url = new URL(req.url);
  
  // Skip validation for public endpoints (tracking pixels, etc.)
  if (isPublicEndpoint(url.pathname)) {
    return null;
  }
  
  const clientIP = getClientIP(req);
  
  if (!isIPWhitelisted(clientIP)) {
    console.warn(`[SECURITY] Blocked request from unauthorized IP: ${clientIP}`);
    
    return new Response(
      JSON.stringify({
        error: 'Access Denied',
        message: 'Your IP address is not authorized to access this resource.',
        code: 'IP_NOT_WHITELISTED',
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          'X-Blocked-IP': clientIP,
        },
      }
    );
  }
  
  return null;
}

/**
 * Middleware wrapper for IP validation
 */
export function withIPWhitelist(
  handler: (req: Request) => Promise<Response>
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    const blocked = validateIPAccess(req);
    if (blocked) return blocked;
    return handler(req);
  };
}
