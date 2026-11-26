// ============================================================================
// SECURITY: Esta função é pública por design (tracking/webhook)
// Rate limiting e validação de origem aplicados via Supabase Edge
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { secureJsonResponse, secureErrorResponse } from "../_shared/security-headers.ts";
import { CommonVoteSchema } from "../_shared/schemas.ts";
import { publicHandler } from '../_shared/security-middleware.ts';

const VoteSchema = CommonVoteSchema;

const PollIdSchema = z.string().uuid();

interface PollOptionRow {
  id: string;
  label: string;
  votes_count: number;
  sort_order: number;
}

Deno.serve(publicHandler(async (req, corsHeaders) => {
  try {
    // x-forwarded-for pode vir como lista "cliente, proxy1, proxy2" e o ultimo IP
    // muda a cada request; usar o primeiro garante dedupe e rate limit estaveis.
    const forwarded = req.headers.get("x-forwarded-for") ?? "";
    const clientIP =
      (forwarded.split(",")[0] ?? "").trim() ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const rateLimit = await checkRateLimit(clientIP, "vote", 20, 60);
    if (!rateLimit.allowed) return secureErrorResponse("Rate limit exceeded", 429, corsHeaders);

    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    if (req.method === "GET") {
      const pollId = new URL(req.url).searchParams.get("pollId") ?? "";
      if (!PollIdSchema.safeParse(pollId).success) {
        return secureErrorResponse("Invalid poll", 400, corsHeaders);
      }

      const { data: poll } = await supabase
        .from("polls")
        .select("id, question, status, allow_multiple_votes, expires_at, total_votes, poll_options(id, label, votes_count, sort_order)")
        .eq("id", pollId)
        .maybeSingle();
      if (!poll) return secureErrorResponse("Poll not found", 404, corsHeaders);

      const expired = poll.expires_at ? new Date(poll.expires_at) < new Date() : false;
      const options = ((poll.poll_options ?? []) as PollOptionRow[])
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((option) => ({ id: option.id, label: option.label, votesCount: option.votes_count }));

      return secureJsonResponse(
        {
          success: true,
          poll: {
            id: poll.id,
            question: poll.question,
            status: poll.status,
            allowMultipleVotes: poll.allow_multiple_votes,
            expiresAt: poll.expires_at,
            totalVotes: poll.total_votes,
            expired,
            canVote: poll.status === "active" && !expired,
            options,
          },
        },
        corsHeaders
      );
    }

    if (req.method !== "POST") {
      return secureErrorResponse("Method not allowed", 405, corsHeaders);
    }

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

    const { data: existingVotes } = await supabase
      .from("poll_votes")
      .select("id")
      .eq("poll_id", pollId)
      .eq("voter_ip", clientIP)
      .limit(1);
    if ((existingVotes?.length ?? 0) > 0 && !poll.allow_multiple_votes) return secureErrorResponse("Already voted", 400, corsHeaders);

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
    const { error: rpcError } = await supabase.rpc("increment_poll_option_votes", { p_option_id: optionId });
        if (rpcError) {
          // Fallback se a RPC não existir no banco
          const current = poll.poll_options?.find((o: { id: string }) => o.id === optionId);
          await supabase.from("poll_options").update({ votes_count: (current?.votes_count || 0) + 1 }).eq("id", optionId);
        }

    return secureJsonResponse({ success: true, voteId }, corsHeaders);
  } catch (_error) {
    console.error("caught:", _error);
    return secureErrorResponse("Internal error", 500, corsHeaders);
  }
}));
