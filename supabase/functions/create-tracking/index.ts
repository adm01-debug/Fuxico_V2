import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function generateTrackingId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function generateLinkId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    })
  }

  try {
    const body = await req.json()
    const { recipientEmail, subject, senderEmail, links, metadata } = body

    if (!recipientEmail) {
      return new Response(JSON.stringify({ error: 'recipientEmail is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`Creating tracking for email to: ${recipientEmail}`)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Generate unique tracking ID
    const trackingId = generateTrackingId()

    // Create tracked email record
    const { data: emailData, error: emailError } = await supabase
      .from('tracked_emails')
      .insert({
        tracking_id: trackingId,
        recipient_email: recipientEmail,
        subject: subject || null,
        sender_email: senderEmail || null,
        metadata: metadata || {},
      })
      .select()
      .single()

    if (emailError) {
      console.error('Error creating tracked email:', emailError)
      return new Response(JSON.stringify({ error: 'Failed to create tracking' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Generate tracking pixel URL
    const pixelUrl = `${supabaseUrl}/functions/v1/track-pixel?id=${trackingId}`

    // Process and wrap links if provided
    const wrappedLinks: { original: string; wrapped: string; linkId: string }[] = []
    
    if (links && Array.isArray(links)) {
      for (const originalUrl of links) {
        const linkId = generateLinkId()
        
        const { error: linkError } = await supabase
          .from('tracked_links')
          .insert({
            tracking_id: trackingId,
            original_url: originalUrl,
            link_id: linkId,
          })

        if (!linkError) {
          wrappedLinks.push({
            original: originalUrl,
            wrapped: `${supabaseUrl}/functions/v1/track-link?l=${linkId}`,
            linkId: linkId,
          })
        }
      }
    }

    // Generate HTML snippet for email
    const pixelHtml = `<img src="${pixelUrl}" width="1" height="1" style="display:none;" alt="" />`

    console.log(`Successfully created tracking ID: ${trackingId}`)

    return new Response(JSON.stringify({
      success: true,
      trackingId,
      pixelUrl,
      pixelHtml,
      wrappedLinks,
      email: emailData,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in create-tracking function:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
