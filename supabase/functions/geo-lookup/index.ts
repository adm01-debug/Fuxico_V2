import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'
import { checkRateLimit } from '../_shared/rate-limit.ts'
import { secureJsonResponse } from '../_shared/security-headers.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req)
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'

  const rateLimitResult = await checkRateLimit(clientIp, 'geo-lookup', 100, 60)
  if (!rateLimitResult.allowed) return secureJsonResponse({ error: 'Rate limit exceeded' }, 429, corsHeaders)

  try {
    const url = new URL(req.url)
    const ip = url.searchParams.get('ip') || clientIp
    if (!ip || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return secureJsonResponse({ country: 'Local', city: 'Local Network' }, 200, corsHeaders)
    }
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=country,city,regionName,timezone,lat,lon`)
    if (response.ok) {
      const data = await response.json()
      return secureJsonResponse({ country: data.country, city: data.city, region: data.regionName, timezone: data.timezone }, 200, corsHeaders)
    }
    return secureJsonResponse({ country: 'Unknown', city: 'Unknown' }, 200, corsHeaders)
  } catch (error) {
    return secureJsonResponse({ error: error.message }, 500, corsHeaders)
  }
})
