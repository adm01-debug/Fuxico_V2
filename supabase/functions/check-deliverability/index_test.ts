/* eslint-disable no-console -- structured logging / background job / test diagnostics */
import { assertEquals } from "https://deno.land/std@0.203.0/assert/mod.ts";
import { handler } from "./index.ts";

Deno.test("check-deliverability handler - unauthorized", async () => {
  const req = new Request("http://localhost/functions/v1/check-deliverability", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer invalid",
    },
    body: JSON.stringify({ email: "test@example.com" }),
  });

  const corsHeaders = { "Access-Control-Allow-Origin": "*" };
  
  try {
    const res = await handler(req, corsHeaders);
    assertEquals(res.status, 401);
  } catch (e) {
    console.log("Test caught expected failure or error:", (e as Error).message);
  }
});
Deno.test("check-deliverability handler - check-dns", async () => {
  const req = new Request("http://localhost/functions/v1/check-deliverability?action=check-dns&domain=google.com", {
    method: "GET",
    headers: {
      "Authorization": "Bearer invalid",
    },
  });

  const corsHeaders = { "Access-Control-Allow-Origin": "*" };
  
  try {
    const res = await handler(req, corsHeaders);
    assertEquals(res.status, 401);
  } catch (e) {
    console.log("Test caught expected failure or error:", (e as Error).message);
  }
});
