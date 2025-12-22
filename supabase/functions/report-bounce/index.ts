import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req)
  }

  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { trackingId, bounceType, bounceReason } = await req.json()

    if (!trackingId) {
      return new Response(JSON.stringify({ error: 'trackingId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data, error } = await supabaseAdmin
      .from('tracked_emails')
      .update({
        delivery_status: 'bounced',
        bounce_type: bounceType || 'unknown',
        bounce_reason: bounceReason || '',
        bounce_detected_at: new Date().toISOString()
      })
      .eq('tracking_id', trackingId)
      .select()
      .single()

    if (error) throw error

    // Create fraud alert for hard bounces
    if (bounceType === 'hard' && data) {
      await supabaseAdmin.from('fraud_alerts').insert({
        user_id: data.user_id,
        alert_type: 'hard_bounce',
        severity: 'low',
        description: `Hard bounce detected for ${data.recipient_email}`,
        metadata: { tracking_id: trackingId, bounce_reason: bounceReason }
      })
    }

    return new Response(JSON.stringify({ success: true, email: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
