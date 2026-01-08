import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts"
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'
import { checkRateLimit } from '../_shared/rate-limit.ts'
import { secureJsonResponse } from '../_shared/security-headers.ts'
import { createLogger } from '../_shared/logger.ts'

const log = createLogger('create-tracking')

const createTrackingSchema = z.object({
  recipientEmail: z.string().email(),
  subject: z.string().optional(),
  senderEmail: z.string().email().optional(),
  links: z.array(z.string().url()).optional(),
  metadata: z.record(z.any()).optional()
})

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req)

  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'

  const rateLimitResult = await checkRateLimit(ip, 'create-tracking', 60, 60)
  if (!rateLimitResult.allowed) return secureJsonResponse({ error: 'Rate limit exceeded' }, 429, corsHeaders)

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) return secureJsonResponse({ error: 'Unauthorized' }, 401, corsHeaders)

    const body = await req.json()
    const validation = createTrackingSchema.safeParse(body)
    if (!validation.success) {
      return secureJsonResponse({ error: 'Invalid input', details: validation.error.errors }, 400, corsHeaders)
    }

    const { recipientEmail, subject, senderEmail, links, metadata } = validation.data
    const trackingId = crypto.randomUUID()
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''

    // Create tracked email record
    const { data, error } = await supabaseClient
      .from('tracked_emails')
      .insert({ 
        tracking_id: trackingId, 
        user_id: user.id, 
        recipient_email: recipientEmail, 
        subject: subject || '', 
        sender_email: senderEmail || user.email, 
        metadata: metadata || {} 
      })
      .select()
      .single()

    if (error) throw error

    // Generate pixel URL and HTML
    const pixelUrl = `${supabaseUrl}/functions/v1/track-pixel?t=${trackingId}`
    const pixelHtml = `<img src="${pixelUrl}" alt="" width="1" height="1" style="display:none;border:0;width:1px;height:1px;" />`

    // Process links if provided
    const wrappedLinks: Array<{ original: string; wrapped: string; linkId: string }> = []
    
    if (links && links.length > 0) {
      for (const originalUrl of links) {
        const linkId = crypto.randomUUID()
        const wrappedUrl = `${supabaseUrl}/functions/v1/track-link?l=${linkId}&t=${trackingId}`
        
        // Insert tracked link record
        await supabaseClient
          .from('tracked_links')
          .insert({
            link_id: linkId,
            tracking_id: trackingId,
            original_url: originalUrl,
            click_count: 0
          })
        
        wrappedLinks.push({
          original: originalUrl,
          wrapped: wrappedUrl,
          linkId
        })
      }
    }

    log.info('Tracking created', { trackingId, recipientEmail, linksCount: wrappedLinks.length })

    return secureJsonResponse({ 
      success: true,
      trackingId, 
      pixelUrl, 
      pixelHtml,
      wrappedLinks,
      email: data 
    }, 200, corsHeaders)
  } catch (error: unknown) {
    log.error('Error creating tracking', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return secureJsonResponse({ error: message }, 500, corsHeaders)
  }
})
