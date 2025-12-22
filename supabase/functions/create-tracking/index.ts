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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { recipientEmail, subject, senderEmail, metadata } = await req.json()
    
    if (!recipientEmail) {
      return new Response(JSON.stringify({ error: 'recipientEmail is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const trackingId = crypto.randomUUID()

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

    const pixelUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/track-pixel?t=${trackingId}`

    return new Response(JSON.stringify({ 
      trackingId, 
      pixelUrl,
      email: data 
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
