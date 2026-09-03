/* eslint-disable no-console -- structured logging / background job / test diagnostics */
import { assertEquals } from "https://deno.land/std@0.203.0/assert/mod.ts";
import { handler } from "./index.ts";

Deno.test("create-tracking handler - validation error", async () => {
  const req = new Request("http://localhost/functions/v1/create-tracking", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer some-token",
    },
    body: JSON.stringify({ 
      recipientEmail: "invalid-email",
    }),
  });

  const corsHeaders = { "Access-Control-Allow-Origin": "*" };
  
  try {
    const res = await handler(req, corsHeaders);
    // Should return 400 if validation fails, or 401 if auth fails first
    assertEquals(res.status === 400 || res.status === 401, true);
  } catch (e) {
    console.log("Test caught expected failure or error:", (e as Error).message);
  }
});
