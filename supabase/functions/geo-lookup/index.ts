import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'

interface GeoData {
  country?: string
  city?: string
  region?: string
  timezone?: string
  lat?: number
  lon?: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req)
  }

  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  try {
    const url = new URL(req.url)
    const ip = url.searchParams.get('ip') || req.headers.get('x-forwarded-for')?.split(',')[0] || ''

    if (!ip || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return new Response(JSON.stringify({ 
        country: 'Local',
        city: 'Local Network',
        region: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Try ip-api.com (free, no key needed)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=country,city,regionName,timezone,lat,lon`)
    
    if (response.ok) {
      const data = await response.json()
      const geoData: GeoData = {
        country: data.country || 'Unknown',
        city: data.city || 'Unknown',
        region: data.regionName || '',
        timezone: data.timezone || '',
        lat: data.lat,
        lon: data.lon
      }
      
      return new Response(JSON.stringify(geoData), {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=86400'
        }
      })
    }

    return new Response(JSON.stringify({ 
      country: 'Unknown',
      city: 'Unknown' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
