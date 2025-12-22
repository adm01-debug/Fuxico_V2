import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'
import { checkRateLimit } from '../_shared/rate-limit.ts'
import { secureJsonResponse } from '../_shared/security-headers.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req)
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'

  const rateLimitResult = await checkRateLimit(ip, 'get-config', 60, 60)
  if (!rateLimitResult.allowed) return secureJsonResponse({ error: 'Rate limit exceeded' }, 429, corsHeaders)

  const config = {
    supabaseUrl: Deno.env.get('SUPABASE_URL'),
    pixelEndpoint: `${Deno.env.get('SUPABASE_URL')}/functions/v1/track-pixel`,
    linkEndpoint: `${Deno.env.get('SUPABASE_URL')}/functions/v1/track-link`,
    version: '1.1.0',
    features: { selfOpenDetection: true, bounceTracking: true, documentTracking: true, linkTracking: true, geoLocation: true }
  }
  return secureJsonResponse(config, 200, { ...corsHeaders, 'Cache-Control': 'public, max-age=3600' })
})
