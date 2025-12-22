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

    const url = new URL(req.url)
    const email = url.searchParams.get('email')
    const trackingId = url.searchParams.get('t')
    const token = url.searchParams.get('token')

    if (!email) {
      return new Response(renderHtml('Erro', 'Email não fornecido'), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/html' }
      })
    }

    // Get tracking info to find user
    let userId = null
    if (trackingId) {
      const { data: tracked } = await supabaseAdmin
        .from('tracked_emails')
        .select('user_id')
        .eq('tracking_id', trackingId)
        .single()
      userId = tracked?.user_id
    }

    // Add to unsubscribed list
    const { error } = await supabaseAdmin
      .from('unsubscribed_emails')
      .insert({
        user_id: userId,
        email: email.toLowerCase(),
        reason: 'User requested via unsubscribe link',
        source: 'link',
        tracking_id: trackingId
      })

    if (error && !error.message.includes('duplicate')) {
      throw error
    }

    return new Response(renderHtml('Descadastrado', 'Você foi removido da nossa lista com sucesso.'), {
      headers: { ...corsHeaders, 'Content-Type': 'text/html' }
    })
  } catch (error) {
    return new Response(renderHtml('Erro', error.message), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/html' }
    })
  }
})

function renderHtml(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - FUXICO</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
    .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
    h1 { color: #333; margin-bottom: 1rem; }
    p { color: #666; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`
}
