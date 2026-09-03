import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { checkRateLimit } from '../_shared/rate-limit.ts'
import { secureJsonResponse } from '../_shared/security-headers.ts'
import { createLogger } from '../_shared/logger.ts'
import { protectedHandler } from '../_shared/security-middleware.ts'
import { CommonTrackingSchema } from '../_shared/schemas.ts'

const log = createLogger('create-tracking')
const createTrackingSchema = CommonTrackingSchema

export const handler = async (req: Request, corsHeaders: Record<string, string>) => {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'

  const rateLimitResult = await checkRateLimit(ip, 'create-tracking', 60, 60)
  if (!rateLimitResult.allowed) return secureJsonResponse({ error: 'Rate limit exceeded' }, 429, corsHeaders)

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
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
}

Deno.serve(protectedHandler(handler))
