import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { secureJsonResponse, secureErrorResponse } from "../_shared/security-headers.ts";
import { createLogger } from '../_shared/logger.ts'
import { CommonSignatureRequestSchema } from "../_shared/schemas.ts";
import { protectedHandler } from '../_shared/security-middleware.ts';

const _log = createLogger('send-signature-request')
const SignatureRequestSchema = CommonSignatureRequestSchema;

export const handler = async (req: Request, corsHeaders: Record<string, string>) => {
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
    if (!validation.success) return secureErrorResponse({ error: "Validation failed" }, 400, corsHeaders);

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
  } catch (_error) {
    return secureErrorResponse("Internal error", 500, corsHeaders);
  }
}

Deno.serve(protectedHandler(handler));
