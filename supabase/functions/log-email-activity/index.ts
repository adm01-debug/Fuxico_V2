import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'
import { createLogger } from '../_shared/logger.ts'
import { protectedHandler } from '../_shared/security-middleware.ts'

const log = createLogger('log-email-activity')
import { checkRateLimit } from '../_shared/rate-limit.ts'
import { secureJsonResponse } from '../_shared/security-headers.ts'
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts"
import { SafeMetadataSchema, CommonEmailAuditSchema } from '../_shared/schemas.ts'

const logSchema = CommonEmailAuditSchema

Deno.serve(protectedHandler(async (req, corsHeaders) => {
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

    const { userEmail, direction, senderEmail, recipientEmail, subject, externalDomain, isExternal, metadata } = validation.data
    const { data, error } = await supabaseClient.from('email_audit_logs').insert({
      user_id: user.id,
      user_email: userEmail || user.email,
      direction,
      sender_email: senderEmail || (direction === 'outbound' ? user.email : undefined),
      recipient_email: recipientEmail || (direction === 'inbound' ? user.email : undefined),
      subject: subject || '',
      external_domain: externalDomain,
      is_external: isExternal ?? false,
      metadata: metadata || {},
      timestamp: new Date().toISOString()
    }).select().single()
    if (error) throw error

    return secureJsonResponse({ success: true, log: data }, 200, corsHeaders)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return secureJsonResponse({ error: message }, 500, corsHeaders)
  }
}))
