import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { secureJsonResponse, secureErrorResponse } from "../_shared/security-headers.ts";
import { protectedHandler } from '../_shared/security-middleware.ts';
import { CommonDomainActionSchema } from "../_shared/schemas.ts";
import { verifyOwnership } from "../_shared/domain-verification.ts";

type DomainInstructions =
  | { type: "dns"; recordName: string; recordType: "TXT"; recordValue: string }
  | { type: "file"; fileUrl: string; fileContent: string }
  | { type: "meta"; metaTag: string };

const INSTRUCTION_BUILDERS: Record<string, (domain: string, token: string) => DomainInstructions> = {
  dns: (domain, token) => ({
    type: "dns",
    recordName: `_fuxico.${domain}`,
    recordType: "TXT",
    recordValue: token
  }),
  file: (domain, token) => ({
    type: "file",
    fileUrl: `https://${domain}/${token}.txt`,
    fileContent: token
  }),
  meta: (_domain, token) => ({
    type: "meta",
    metaTag: `<meta name="fuxico-site-verification" content="${token}" />`
  })
};

function buildInstructions(verificationType: string, domain: string, token: string): DomainInstructions {
  const builder = INSTRUCTION_BUILDERS[verificationType] ?? INSTRUCTION_BUILDERS.meta;
  return builder(domain, token);
}

Deno.serve(protectedHandler(async (req, corsHeaders) => {
  try {
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimit = await checkRateLimit(clientIP, "verify-domain", 10, 60);
    if (!rateLimit.allowed) return secureErrorResponse("Rate limit exceeded", 429, corsHeaders);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return secureErrorResponse("Unauthorized", 401, corsHeaders);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "", { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return secureErrorResponse("Unauthorized", 401, corsHeaders);

    const body = await req.json().catch(() => ({}));
    const validation = CommonDomainActionSchema.safeParse(body);
    if (!validation.success) return secureErrorResponse({ error: "Validation failed", details: validation.error.flatten() }, 400, corsHeaders);

    const { domain, verificationType, action } = validation.data;

    // DELETE na propria linha exige service role: a tabela nao tem policy/GRANT de DELETE
    // para authenticated, e o filtro por user.id garante que so a propria conta e afetada.
    if (action === "remove") {
      const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", { auth: { persistSession: false } });
      const { error } = await admin.from("custom_domains").delete().eq("user_id", user.id);
      if (error) {
        console.error("[verify-custom-domain] falha ao remover:", error);
        return secureErrorResponse("Falha ao remover o dominio", 500, corsHeaders);
      }
      return secureJsonResponse({ success: true, removed: true }, corsHeaders);
    }

    if (action === "verify") {
      const { data: current, error: readError } = await supabase
        .from("custom_domains")
        .select("id, domain, verification_type, verification_token")
        .eq("user_id", user.id)
        .maybeSingle();
      if (readError) {
        console.error("[verify-custom-domain] falha ao ler dominio:", readError);
        return secureErrorResponse("Falha ao ler o dominio cadastrado", 500, corsHeaders);
      }
      if (!current) return secureErrorResponse("Nenhum dominio cadastrado", 404, corsHeaders);

      const result = await verifyOwnership(current.verification_type, current.domain, current.verification_token);
      const checkedAt = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("custom_domains")
        .update({
          status: result.verified ? "verified" : "failed",
          verified: result.verified,
          ssl_enabled: result.verified,
          updated_at: checkedAt
        })
        .eq("id", current.id);
      if (updateError) {
        console.error("[verify-custom-domain] falha ao atualizar status:", updateError);
        return secureErrorResponse("Falha ao atualizar o status do dominio", 500, corsHeaders);
      }

      return secureJsonResponse({
        success: true,
        action: "verify",
        domain: current.domain,
        verificationType: current.verification_type,
        verified: result.verified,
        status: result.verified ? "verified" : "failed",
        message: result.message,
        checkedAt
      }, corsHeaders);
    }

    // SECURITY: Use full UUID for verification token (128 bits of entropy)
    // Previously used only 8 chars (32 bits) which is brute-forceable
    const verificationToken = `fuxico-verify-${crypto.randomUUID()}`;
    const { error: saveError } = await supabase.from("custom_domains").upsert({
      user_id: user.id,
      domain,
      verification_type: verificationType,
      verification_token: verificationToken,
      status: "pending",
      verified: false,
      ssl_enabled: false,
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id" });
    if (saveError) {
      console.error("[verify-custom-domain] falha ao salvar dominio:", saveError);
      return secureErrorResponse("Falha ao registrar o dominio", 500, corsHeaders);
    }

    const instructions = buildInstructions(verificationType, domain, verificationToken);

    return secureJsonResponse({
      success: true,
      action: "register",
      domain,
      verificationType,
      token: verificationToken,
      instructions
    }, corsHeaders);
  } catch (_error) {
    console.error("caught:", _error);
    return secureErrorResponse("Internal error", 500, corsHeaders);
  }
}));
