import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'
import { checkRateLimit } from '../_shared/rate-limit.ts'
import { addSecurityHeaders } from '../_shared/security-headers.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req)
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'

  const rateLimitResult = await checkRateLimit(ip, 'unsubscribe', 20, 60)
  if (!rateLimitResult.allowed) return new Response(html('Erro', 'Muitas tentativas'), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'text/html' } })

  try {
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
    const url = new URL(req.url)
    const email = url.searchParams.get('email')
    if (!email) return new Response(html('Erro', 'Email não fornecido'), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'text/html' } })

    await supabaseAdmin.from('unsubscribed_emails').insert({ email: email.toLowerCase(), reason: 'User request', source: 'link' })
    return new Response(html('Sucesso', 'Você foi removido da lista.'), { headers: addSecurityHeaders({ ...corsHeaders, 'Content-Type': 'text/html' }) })
  } catch (error) {
    return new Response(html('Erro', error.message), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'text/html' } })
  }
})

function html(title: string, msg: string): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title><style>body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f5f5f5}.card{background:white;padding:2rem;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1);text-align:center}</style></head><body><div class="card"><h1>${title}</h1><p>${msg}</p></div></body></html>`
}
