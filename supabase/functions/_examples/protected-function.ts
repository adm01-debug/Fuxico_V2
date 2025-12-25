/**
 * Example: Protected Edge Function with IP Whitelist
 * 
 * Copy this pattern to protect your Edge Functions.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { protectedHandler, secureJsonResponse } from "../_shared/security-middleware.ts";

// Use protectedHandler wrapper for automatic IP validation
serve(protectedHandler(async (req, corsHeaders) => {
  // If we reach here, IP is whitelisted and rate limit is OK
  
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // Your business logic here
  const data = { message: "Success", timestamp: new Date().toISOString() };

  return secureJsonResponse(data, corsHeaders);
}));
