import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'
import { checkRateLimit } from '../_shared/rate-limit.ts'
import { secureJsonResponse } from '../_shared/security-headers.ts'
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts"

const CreateTrackingSchema = z.object({
  recipientEmail: z.string().email(),
  subject: z.string().max(500).optional().default(''),
  senderEmail: z.string().email().optional(),
  metadata: z.record(z.any()).optional().default({})
})

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req)

  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'

  const rateLimitResult = await checkRateLimit(clientIP, 'create-tracking', 60, 100)
  if (!rateLimitResult.allowed) {
    return secureJsonResponse({ error: 'Rate limit exceeded' }, 429, corsHeaders)
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return secureJsonResponse({ error: 'Unauthorized' }, 401, corsHeaders)
    }

    const body = await req.json().catch(() => ({}))
    const validation = CreateTrackingSchema.safeParse(body)
    if (!validation.success) {
      return secureJsonResponse({ error: 'Invalid request', details: validation.error.issues }, 400, corsHeaders)
    }

    const { recipientEmail, subject, senderEmail, metadata } = validation.data
    const trackingId = crypto.randomUUID()

    const { data, error } = await supabaseClient
      .from('tracked_emails')
      .insert({
        tracking_id: trackingId,
        user_id: user.id,
        recipient_email: recipientEmail,
        subject,
        sender_email: senderEmail || user.email,
        metadata
      })
      .select()
      .single()

    if (error) throw error

    const pixelUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/track-pixel?t=${trackingId}`
    return secureJsonResponse({ trackingId, pixelUrl, email: data }, 200, corsHeaders)
  } catch (error) {
    return secureJsonResponse({ error: error.message }, 500, corsHeaders)
  }
})
