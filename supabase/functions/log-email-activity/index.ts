import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'
import { checkRateLimit } from '../_shared/rate-limit.ts'
import { secureJsonResponse } from '../_shared/security-headers.ts'
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts"

const logSchema = z.object({
  action: z.string(),
  direction: z.enum(['inbound', 'outbound']).optional(),
  fromEmail: z.string().email().optional(),
  toEmail: z.string().email().optional(),
  subject: z.string().optional(),
  metadata: z.record(z.any()).optional()
})

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req)
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'

  const rateLimitResult = await checkRateLimit(ip, 'log-email-activity', 100, 60)
  if (!rateLimitResult.allowed) return secureJsonResponse({ error: 'Rate limit exceeded' }, 429, corsHeaders)

  try {
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: req.headers.get('Authorization')! } } })
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) return secureJsonResponse({ error: 'Unauthorized' }, 401, corsHeaders)

    const body = await req.json()
    const validation = logSchema.safeParse(body)
    if (!validation.success) return secureJsonResponse({ error: 'Invalid input' }, 400, corsHeaders)

    const { action, direction, fromEmail, toEmail, subject, metadata } = validation.data
    const { data, error } = await supabaseClient.from('email_audit_logs').insert({ user_id: user.id, action, direction: direction || 'outbound', from_email: fromEmail || user.email, to_email: toEmail, subject: subject || '', metadata: metadata || {}, timestamp: new Date().toISOString() }).select().single()
    if (error) throw error

    return secureJsonResponse({ success: true, log: data }, 200, corsHeaders)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return secureJsonResponse({ error: message }, 500, corsHeaders)
  }
})
