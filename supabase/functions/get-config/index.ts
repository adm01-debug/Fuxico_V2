import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req)
  }

  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  try {
    const config = {
      supabaseUrl: Deno.env.get('SUPABASE_URL'),
      pixelEndpoint: `${Deno.env.get('SUPABASE_URL')}/functions/v1/track-pixel`,
      linkEndpoint: `${Deno.env.get('SUPABASE_URL')}/functions/v1/track-link`,
      version: '1.1.0',
      features: {
        selfOpenDetection: true,
        bounceTracking: true,
        documentTracking: true,
        linkTracking: true,
        geoLocation: true
      }
    }

    return new Response(JSON.stringify(config), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600'
      }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
