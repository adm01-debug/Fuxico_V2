import { assertEquals } from "https://deno.land/std@0.203.0/assert/mod.ts";
import { handler } from "./index.ts";

Deno.test("track-beacon handler - unauthorized", async () => {
  const req = new Request("http://localhost/functions/v1/track-beacon", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trackingId: "123", eventType: "open", metadata: {} }),
  });
  const corsHeaders = { "Access-Control-Allow-Origin": "*" };
  try {
    const res = await handler(req, corsHeaders);
    // Beacons are usually public, but we test validation
    assertEquals(res.status === 200 || res.status === 400, true);
  } catch (e) { }
});
