import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { validateIPAccess } from '../_shared/ip-whitelist.ts';
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { secureJsonResponse, secureErrorResponse } from "../_shared/security-headers.ts";
import { createLogger } from '../_shared/logger.ts'

const log = createLogger('send-signature-request')
const SignerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(200),
  order: z.number().int().positive().optional()
});

const SignatureRequestSchema = z.object({
  documentId: z.string().uuid(),
  signers: z.array(SignerSchema).min(1).max(10),
  message: z.string().max(1000).optional(),
  expiresAt: z.string().datetime().optional(),
  reminderDays: z.number().int().min(1).max(30).optional()
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimit = await checkRateLimit(clientIP, "sig-request", 10, 60);
    if (!rateLimit.allowed) return secureErrorResponse("Rate limit exceeded", 429, corsHeaders);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return secureErrorResponse("Unauthorized", 401, corsHeaders);

    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return secureErrorResponse("Unauthorized", 401, corsHeaders);

    const body = await req.json();
    const validation = SignatureRequestSchema.safeParse(body);
    if (!validation.success) return secureErrorResponse({ error: "Validation failed", details: validation.error.flatten() }, 400, corsHeaders);

    const { documentId, signers, message, expiresAt } = validation.data;

    const { data: doc } = await supabase.from("tracked_documents").select("*").eq("id", documentId).eq("user_id", user.id).single();
    if (!doc) return secureErrorResponse("Document not found", 404, corsHeaders);

    const requestId = crypto.randomUUID();
    const signerRecords = signers.map((s, i) => ({
      id: crypto.randomUUID(),
      request_id: requestId,
      email: s.email,
      name: s.name,
      order: s.order || i + 1,
      status: "pending",
      token: crypto.randomUUID()
    }));

    await supabase.from("signature_requests").insert({ id: requestId, document_id: documentId, user_id: user.id, message, expires_at: expiresAt });
    await supabase.from("signature_signers").insert(signerRecords);

    return secureJsonResponse({ success: true, requestId, signers: signerRecords.map(s => ({ email: s.email, status: s.status })) }, corsHeaders);
  } catch (error) {
    return secureErrorResponse("Internal error", 500, corsHeaders);
  }
});
