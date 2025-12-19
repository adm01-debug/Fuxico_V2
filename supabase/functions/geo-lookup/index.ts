// FUXICO - Edge Function para Geolocalização de IPs
// Enriquece eventos de tracking com dados de localização

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============================================
// TIPOS
// ============================================

interface GeoLocation {
  ip: string
  country: string
  country_code: string
  region: string
  city: string
  latitude: number
  longitude: number
  timezone: string
  isp: string
  is_vpn: boolean
  is_proxy: boolean
}

interface GeoRequest {
  ip: string
  tracking_id?: string
  event_id?: string
}

// ============================================
// CACHE EM MEMÓRIA (SIMPLES)
// ============================================

const geoCache = new Map<string, { data: GeoLocation; expires: number }>()
const CACHE_TTL = 3600000 // 1 hora

function getCached(ip: string): GeoLocation | null {
  const cached = geoCache.get(ip)
  if (cached && cached.expires > Date.now()) {
    return cached.data
  }
  geoCache.delete(ip)
  return null
}

function setCache(ip: string, data: GeoLocation) {
  geoCache.set(ip, { data, expires: Date.now() + CACHE_TTL })
  
  // Limpar cache se muito grande
  if (geoCache.size > 1000) {
    const now = Date.now()
    for (const [key, value] of geoCache) {
      if (value.expires < now) {
        geoCache.delete(key)
      }
    }
  }
}

// ============================================
// PROVEDOR DE GEOLOCALIZAÇÃO
// ============================================

async function getGeoFromIPAPI(ip: string): Promise<GeoLocation | null> {
  try {
    // Usando ip-api.com (gratuito, 45 requests/minuto)
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone,isp,proxy,hosting`,
      { headers: { 'Accept': 'application/json' } }
    )
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.status === 'fail') {
      console.log(`[Geo] IP lookup failed: ${data.message}`)
      return null
    }
    
    return {
      ip,
      country: data.country || 'Unknown',
      country_code: data.countryCode || '',
      region: data.regionName || '',
      city: data.city || 'Unknown',
      latitude: data.lat || 0,
      longitude: data.lon || 0,
      timezone: data.timezone || '',
      isp: data.isp || '',
      is_vpn: data.hosting || false,
      is_proxy: data.proxy || false,
    }
  } catch (error) {
    console.error('[Geo] Error fetching from ip-api:', error.message)
    return null
  }
}

async function getGeoLocation(ip: string): Promise<GeoLocation | null> {
  // Ignorar IPs inválidos ou locais
  if (!ip || ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return {
      ip,
      country: 'Local',
      country_code: 'LO',
      region: '',
      city: 'Local Network',
      latitude: 0,
      longitude: 0,
      timezone: '',
      isp: 'Local',
      is_vpn: false,
      is_proxy: false,
    }
  }
  
  // Verificar cache
  const cached = getCached(ip)
  if (cached) {
    return cached
  }
  
  // Buscar do provedor
  const geo = await getGeoFromIPAPI(ip)
  
  if (geo) {
    setCache(ip, geo)
  }
  
  return geo
}

// ============================================
// HANDLER PRINCIPAL
// ============================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // GET - Buscar geo de um IP específico
    if (req.method === 'GET') {
      const url = new URL(req.url)
      const ip = url.searchParams.get('ip')
      
      if (!ip) {
        return new Response(JSON.stringify({ error: 'IP parameter required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      
      const geo = await getGeoLocation(ip)
      
      return new Response(JSON.stringify(geo || { error: 'Could not determine location' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // POST - Enriquecer evento com geolocalização
    if (req.method === 'POST') {
      const body = await req.json() as GeoRequest
      
      if (!body.ip) {
        return new Response(JSON.stringify({ error: 'IP required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      
      const geo = await getGeoLocation(body.ip)
      
      // Se tiver event_id, atualizar o evento no banco
      if (body.event_id && geo) {
        const { error } = await supabase
          .from('tracking_events')
          .update({
            metadata: supabase.sql`
              COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({
                geo: {
                  country: geo.country,
                  country_code: geo.country_code,
                  city: geo.city,
                  region: geo.region,
                  latitude: geo.latitude,
                  longitude: geo.longitude,
                  timezone: geo.timezone,
                  is_vpn: geo.is_vpn,
                }
              })}::jsonb
            `
          })
          .eq('id', body.event_id)
        
        if (error) {
          console.error('[Geo] Error updating event:', error)
        }
      }
      
      return new Response(JSON.stringify({
        success: true,
        geo,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in geo-lookup function:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
