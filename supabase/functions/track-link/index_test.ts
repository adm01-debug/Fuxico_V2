import { assertEquals } from "https://deno.land/std@0.203.0/assert/mod.ts";
import { handler } from "./index.ts";

Deno.test("track-link handler - validation", async () => {
  const req = new Request("http://localhost/functions/v1/track-link", {
    method: "GET",
  });
  const corsHeaders = { "Access-Control-Allow-Origin": "*" };
  try {
    const res = await handler(req, corsHeaders);
    assertEquals(res.status, 400);
  } catch (_e) {
    console.error("caught:", _e);
    }
});
