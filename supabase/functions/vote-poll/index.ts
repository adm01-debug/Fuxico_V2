// ============================================================================
// SECURITY: Esta função é pública por design (tracking/webhook)
// Rate limiting e validação de origem aplicados via Supabase Edge
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { secureJsonResponse, secureErrorResponse } from "../_shared/security-headers.ts";
import { CommonVoteSchema } from "../_shared/schemas.ts";
import { publicHandler } from '../_shared/security-middleware.ts';

const VoteSchema = CommonVoteSchema;

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimit = await checkRateLimit(clientIP, "vote", 20, 60);
    if (!rateLimit.allowed) return secureErrorResponse("Rate limit exceeded", 429, corsHeaders);

    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    const body = await req.json();
    const validation = VoteSchema.safeParse(body);
    if (!validation.success) return secureErrorResponse({ error: "Validation failed", details: validation.error.flatten() }, 400, corsHeaders);

    const { pollId, optionId, voterEmail, voterName, metadata } = validation.data;

    const { data: poll } = await supabase.from("polls").select("*, poll_options(*)").eq("id", pollId).single();
    if (!poll) return secureErrorResponse("Poll not found", 404, corsHeaders);
    if (poll.status !== "active") return secureErrorResponse("Poll is not active", 400, corsHeaders);
    if (poll.expires_at && new Date(poll.expires_at) < new Date()) return secureErrorResponse("Poll has expired", 400, corsHeaders);

    const optionExists = poll.poll_options?.some((o: { id: string }) => o.id === optionId);
    if (!optionExists) return secureErrorResponse("Invalid option", 400, corsHeaders);

    const { data: existingVote } = await supabase.from("poll_votes").select("id").eq("poll_id", pollId).eq("voter_ip", clientIP).single();
    if (existingVote && !poll.allow_multiple_votes) return secureErrorResponse("Already voted", 400, corsHeaders);

    const voteId = crypto.randomUUID();
    await supabase.from("poll_votes").insert({
      id: voteId,
      poll_id: pollId,
      option_id: optionId,
      voter_ip: clientIP,
      voter_email: voterEmail,
      voter_name: voterName,
      metadata
    });

    // Atomic increment to prevent race conditions on vote count
    await supabase.rpc("increment_poll_option_votes", { p_option_id: optionId }).catch(() => {
      // Fallback if RPC doesn't exist
      const current = poll.poll_options.find((o: { id: string }) => o.id === optionId);
      supabase.from("poll_options").update({ votes_count: (current?.votes_count || 0) + 1 }).eq("id", optionId);
    });

    return secureJsonResponse({ success: true, voteId }, corsHeaders);
  } catch (error) {
    return secureErrorResponse("Internal error", 500, corsHeaders);
  }
});
