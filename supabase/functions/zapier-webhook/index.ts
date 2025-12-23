import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const RegisterSchema = z.object({
  action: z.literal("register"),
  name: z.string().min(1),
  url: z.string().url(),
  events: z.array(z.string()).min(1),
});

const UnregisterSchema = z.object({
  action: z.literal("unregister"),
  webhookId: z.string().uuid(),
});

const TriggerSchema = z.object({
  action: z.literal("trigger"),
  webhookId: z.string().uuid(),
  eventType: z.string(),
  payload: z.record(z.any()),
});

const RequestSchema = z.union([RegisterSchema, UnregisterSchema, TriggerSchema]);

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimitResult = await checkRateLimit(clientIP, "zapier-webhook", 50, 60);
    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const validatedData = RequestSchema.parse(body);

    if (validatedData.action === "register") {
      const { data, error } = await supabase.from("zapier_webhooks").insert({
        user_id: user.id,
        name: validatedData.name,
        url: validatedData.url,
        events: validatedData.events,
        is_active: true,
      }).select().single();

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, webhook: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (validatedData.action === "unregister") {
      const { error } = await supabase.from("zapier_webhooks")
        .delete()
        .eq("id", validatedData.webhookId)
        .eq("user_id", user.id);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (validatedData.action === "trigger") {
      const { data: webhook } = await supabase.from("zapier_webhooks")
        .select("*")
        .eq("id", validatedData.webhookId)
        .eq("user_id", user.id)
        .single();

      if (!webhook) {
        return new Response(JSON.stringify({ error: "Webhook not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await fetch(webhook.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validatedData.payload),
      });

      await supabase.from("zapier_webhooks").update({ last_triggered_at: new Date().toISOString() })
        .eq("id", validatedData.webhookId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: "Validation error", details: error.errors }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
