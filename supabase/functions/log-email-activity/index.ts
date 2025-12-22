import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'
import { checkRateLimit } from '../_shared/rate-limit.ts'
import { secureJsonResponse } from '../_shared/security-headers.ts'
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts"

const LogActivitySchema = z.object({
  action: z.enum(['sent', 'received', 'opened', 'clicked', 'bounced', 'unknown']).default('unknown'),
  direction: z.enum(['inbound', 'outbound']).default('outbound'),
  fromEmail: z.string().email().optional(),
  toEmail: z.string().email().optional(),
  subject: z.string().max(500).optional().default(''),
  metadata: z.record(z.any()).optional().default({})
})

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req)

  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'

  const rateLimitResult = await checkRateLimit(clientIP, 'log-email-activity', 60, 200)
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
    const validation = LogActivitySchema.safeParse(body)
    if (!validation.success) {
      return secureJsonResponse({ error: 'Invalid request', details: validation.error.issues }, 400, corsHeaders)
    }

    const { action, direction, fromEmail, toEmail, subject, metadata } = validation.data

    const { data, error } = await supabaseClient
      .from('email_audit_logs')
      .insert({
        user_id: user.id,
        action,
        direction,
        from_email: fromEmail || user.email,
        to_email: toEmail,
        subject,
        metadata,
        timestamp: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return secureJsonResponse({ success: true, log: data }, 200, corsHeaders)
  } catch (error) {
    return secureJsonResponse({ error: error.message }, 500, corsHeaders)
  }
})
