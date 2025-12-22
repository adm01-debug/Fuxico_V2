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

    const body = await req.json()
    const { action, direction, fromEmail, toEmail, subject, metadata } = body

    const { data, error } = await supabaseClient
      .from('email_audit_logs')
      .insert({
        user_id: user.id,
        action: action || 'unknown',
        direction: direction || 'outbound',
        from_email: fromEmail || user.email,
        to_email: toEmail,
        subject: subject || '',
        metadata: metadata || {},
        timestamp: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    // Check for fraud patterns
    await checkFraudPatterns(supabaseClient, user.id, toEmail)

    return new Response(JSON.stringify({ success: true, log: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function checkFraudPatterns(supabase: any, userId: string, toEmail: string) {
  // Check for unusual sending patterns
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  
  const { data: recentLogs } = await supabase
    .from('email_audit_logs')
    .select('id')
    .eq('user_id', userId)
    .gte('timestamp', oneHourAgo)
  
  if (recentLogs && recentLogs.length > 100) {
    await supabase.from('fraud_alerts').insert({
      user_id: userId,
      alert_type: 'high_volume',
      severity: 'medium',
      description: `Unusual sending volume: ${recentLogs.length} emails in last hour`,
      metadata: { email_count: recentLogs.length }
    })
  }
}
