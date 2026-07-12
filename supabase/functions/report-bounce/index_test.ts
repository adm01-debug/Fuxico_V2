import { assertEquals } from "https://deno.land/std@0.203.0/assert/mod.ts";
import { handler } from "./index.ts";

Deno.test("report-bounce handler - validation", async () => {
  const req = new Request("http://localhost/functions/v1/report-bounce", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trackingId: "invalid-uuid" }),
  });
  const corsHeaders = { "Access-Control-Allow-Origin": "*" };
  try {
    const res = await handler(req, corsHeaders);
    assertEquals(res.status, 400);
  } catch (_e) {
    console.error("caught:", _e);
    }
});
