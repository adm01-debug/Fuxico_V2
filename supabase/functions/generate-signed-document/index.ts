import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { secureJsonResponse, secureErrorResponse } from "../_shared/security-headers.ts";

const SignedDocSchema = z.object({
  documentId: z.string().uuid(),
  signatureType: z.enum(["draw", "type", "upload"]).default("type"),
  signatureData: z.string().min(1),
  signerName: z.string().min(1).max(200),
  signerEmail: z.string().email(),
  signerIP: z.string().optional(),
  position: z.object({
    page: z.number().int().positive(),
    x: z.number(),
    y: z.number()
  }).optional()
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimit = await checkRateLimit(clientIP, "sign-doc", 10, 60);
    if (!rateLimit.allowed) return secureErrorResponse("Rate limit exceeded", 429, corsHeaders);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return secureErrorResponse("Unauthorized", 401, corsHeaders);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return secureErrorResponse("Unauthorized", 401, corsHeaders);

    const body = await req.json();
    const validation = SignedDocSchema.safeParse(body);
    if (!validation.success) {
      return secureErrorResponse({ error: "Validation failed", details: validation.error.flatten() }, 400, corsHeaders);
    }

    const { documentId, signatureType, signatureData, signerName, signerEmail, position } = validation.data;

    const { data: doc } = await supabase.from("tracked_documents").select("*").eq("id", documentId).single();
    if (!doc) return secureErrorResponse("Document not found", 404, corsHeaders);

    const signature = {
      id: crypto.randomUUID(),
      documentId,
      signatureType,
      signerName,
      signerEmail,
      signerIP: clientIP,
      position,
      signedAt: new Date().toISOString(),
      hash: await crypto.subtle.digest("SHA-256", new TextEncoder().encode(signatureData + documentId + Date.now()))
    };

    await supabase.from("document_signatures").insert(signature);

    return secureJsonResponse({ success: true, signatureId: signature.id }, corsHeaders);
  } catch (error) {
    return secureErrorResponse("Internal error", 500, corsHeaders);
  }
});
