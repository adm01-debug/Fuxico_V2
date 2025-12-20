import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { tracking_id, recipient_email, bounce_type, bounce_reason } = await req.json()

    console.log('Received bounce report:', { tracking_id, recipient_email, bounce_type, bounce_reason })

    if (!tracking_id && !recipient_email) {
      console.error('Missing tracking_id or recipient_email')
      return new Response(
        JSON.stringify({ error: 'tracking_id or recipient_email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find the tracked email by tracking_id or recipient_email
    let query = supabase.from('tracked_emails').select('id, tracking_id, user_id, recipient_email, subject')
    
    if (tracking_id) {
      query = query.eq('tracking_id', tracking_id)
    } else if (recipient_email) {
      // Find the most recent email to this recipient that hasn't bounced yet
      query = query
        .eq('recipient_email', recipient_email)
        .eq('delivery_status', 'sent')
        .order('created_at', { ascending: false })
        .limit(1)
    }

    const { data: email, error: findError } = await query.maybeSingle()

    if (findError) {
      console.error('Error finding tracked email:', findError)
      return new Response(
        JSON.stringify({ error: 'Failed to find tracked email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!email) {
      console.log('No tracked email found for bounce report')
      return new Response(
        JSON.stringify({ message: 'No matching tracked email found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update the email with bounce information
    const { error: updateError } = await supabase
      .from('tracked_emails')
      .update({
        delivery_status: 'bounced',
        bounce_type: bounce_type || 'unknown',
        bounce_reason: bounce_reason || 'Email could not be delivered',
        bounce_detected_at: new Date().toISOString()
      })
      .eq('id', email.id)

    if (updateError) {
      console.error('Error updating tracked email:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update bounce status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Successfully recorded bounce for tracking_id:', email.tracking_id)

    // Dispatch webhook para bounce
    if (email.user_id) {
      fetch(`${supabaseUrl}/functions/v1/webhook-dispatch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          event_type: 'bounce',
          user_id: email.user_id,
          tracking_id: email.tracking_id,
          timestamp: new Date().toISOString(),
          data: {
            recipient_email: email.recipient_email,
            subject: email.subject,
            bounce_type: bounce_type || 'unknown',
            bounce_reason: bounce_reason || 'Email could not be delivered',
          },
        }),
      }).catch(err => {
        console.error('[report-bounce] Erro ao disparar webhook:', err)
      })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        tracking_id: email.tracking_id,
        message: 'Bounce recorded successfully' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing bounce report:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})