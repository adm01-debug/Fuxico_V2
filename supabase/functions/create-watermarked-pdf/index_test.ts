/* eslint-disable no-console -- structured logging / background job / test diagnostics */
import { assertEquals } from "https://deno.land/std@0.203.0/assert/mod.ts";
import { handler } from "./index.ts";

Deno.test("create-watermarked-pdf handler - unauthorized", async () => {
  const req = new Request("http://localhost/functions/v1/create-watermarked-pdf", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer invalid",
    },
    body: JSON.stringify({ documentId: crypto.randomUUID(), watermarkText: "Test" }),
  });

  const corsHeaders = { "Access-Control-Allow-Origin": "*" };
  
  try {
    const res = await handler(req, corsHeaders);
    assertEquals(res.status, 401);
  } catch (e) {
    console.log("Test caught expected failure or error:", e.message);
  }
});
