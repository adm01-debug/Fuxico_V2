import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createLogger } from '../_shared/logger.ts'
import { protectedHandler } from '../_shared/security-middleware.ts'
import { checkRateLimit } from '../_shared/rate-limit.ts'
import { secureJsonResponse } from '../_shared/security-headers.ts'
import { CommonEmailAuditSchema } from '../_shared/schemas.ts'
import { recordEmailAudit } from '../_shared/email-audit.ts'

const _log = createLogger('log-email-activity')
const logSchema = CommonEmailAuditSchema

export const handler = async (req: Request, corsHeaders: Record<string, string>) => {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'

  const rateLimitResult = await checkRateLimit(ip, 'log-email-activity', 100, 60)
  if (!rateLimitResult.allowed) return secureJsonResponse({ error: 'Rate limit exceeded' }, 429, corsHeaders)

  try {
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } })
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) return secureJsonResponse({ error: 'Unauthorized' }, 401, corsHeaders)

    const body = await req.json()
    const validation = logSchema.safeParse(body)
    if (!validation.success) return secureJsonResponse({ error: 'Invalid input' }, 400, corsHeaders)

    const { userEmail, direction, senderEmail, recipientEmail, subject, externalDomain, isExternal, metadata } = validation.data
    const effectiveUserEmail = userEmail || user.email || ''
    const effectiveSender = senderEmail || (direction === 'sent' ? effectiveUserEmail : '')
    const effectiveRecipient = recipientEmail || (direction === 'received' ? effectiveUserEmail : '')

    if (!effectiveSender || !effectiveRecipient) {
      const error = direction === 'received' ? 'senderEmail is required' : 'recipientEmail is required'
      return secureJsonResponse({ error }, 400, corsHeaders)
    }

    const data = await recordEmailAudit(supabaseClient, {
      userId: user.id,
      userEmail: effectiveUserEmail,
      direction,
      senderEmail: effectiveSender,
      recipientEmail: effectiveRecipient,
      subject,
      externalDomain,
      isExternal,
      metadata,
    })

    return secureJsonResponse({ success: true, log: data }, 200, corsHeaders)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return secureJsonResponse({ error: message }, 500, corsHeaders)
  }
}

Deno.serve(protectedHandler(handler))
