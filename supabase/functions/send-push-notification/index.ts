import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { secureJsonResponse, secureErrorResponse } from "../_shared/security-headers.ts";
import { CommonPushSchema } from "../_shared/schemas.ts";
import { protectedHandler } from '../_shared/security-middleware.ts';

const PushSchema = CommonPushSchema;

Deno.serve(protectedHandler(async (req, corsHeaders) => {
  try {

  try {
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimit = await checkRateLimit(clientIP, "push", 30, 60);
    if (!rateLimit.allowed) return secureErrorResponse("Rate limit exceeded", 429, corsHeaders);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return secureErrorResponse("Unauthorized", 401, corsHeaders);

    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return secureErrorResponse("Unauthorized", 401, corsHeaders);

    const body = await req.json();
    const validation = PushSchema.safeParse(body);
    if (!validation.success) return secureErrorResponse({ error: "Validation failed", details: validation.error.flatten() }, 400, corsHeaders);

    const { userId, title, body: notifBody, icon, url, data } = validation.data;

    // SECURITY: Verify user can only send notifications to themselves
    // or has admin role to send to others
    if (userId !== user.id) {
      // Check if sender is admin
      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (!role) {
        return secureErrorResponse("Cannot send notifications to other users", 403, corsHeaders);
      }
    }

    const notificationId = crypto.randomUUID();

    await supabase.from("push_notifications").insert({ id: notificationId, user_id: userId, title, body: notifBody, icon, url, data, sent_by: user.id });

    return secureJsonResponse({ success: true, notificationId }, corsHeaders);
  } catch (error) {
    return secureErrorResponse("Internal error", 500, corsHeaders);
  }
}));
