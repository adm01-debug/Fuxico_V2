import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'
import { checkRateLimit } from '../_shared/rate-limit.ts'
import { secureJsonResponse } from '../_shared/security-headers.ts'
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts"

const GeoLookupSchema = z.object({
  ip: z.string().ip().optional()
})

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req)

  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'

  const rateLimitResult = await checkRateLimit(clientIP, 'geo-lookup', 60, 120)
  if (!rateLimitResult.allowed) {
    return secureJsonResponse({ error: 'Rate limit exceeded' }, 429, corsHeaders)
  }

  try {
    const url = new URL(req.url)
    const ipParam = url.searchParams.get('ip') || clientIP
    
    const validation = GeoLookupSchema.safeParse({ ip: ipParam })
    const ip = validation.success && validation.data.ip ? validation.data.ip : clientIP

    if (!ip || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return secureJsonResponse({ 
        country: 'Local', city: 'Local Network', region: '', 
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone 
      }, 200, corsHeaders)
    }

    const response = await fetch(`http://ip-api.com/json/${ip}?fields=country,city,regionName,timezone,lat,lon`)
    if (response.ok) {
      const data = await response.json()
      return secureJsonResponse({
        country: data.country || 'Unknown',
        city: data.city || 'Unknown',
        region: data.regionName || '',
        timezone: data.timezone || '',
        lat: data.lat,
        lon: data.lon
      }, 200, { ...corsHeaders, 'Cache-Control': 'public, max-age=86400' })
    }

    return secureJsonResponse({ country: 'Unknown', city: 'Unknown' }, 200, corsHeaders)
  } catch (error) {
    return secureJsonResponse({ error: error.message }, 500, corsHeaders)
  }
})
