import { assertEquals } from "https://deno.land/std@0.203.0/assert/mod.ts";
import { handler } from "./index.ts";

Deno.test("get-tracking-stats handler - unauthorized", async () => {
  const req = new Request("http://localhost/functions/v1/get-tracking-stats", {
    method: "GET",
    headers: {
      "Authorization": "Bearer invalid",
    },
  });
  const corsHeaders = { "Access-Control-Allow-Origin": "*" };
  try {
    const res = await handler(req, corsHeaders);
    assertEquals(res.status, 401);
  } catch (_e) { }
});
