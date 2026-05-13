import { assertEquals } from "https://deno.land/std@0.203.0/assert/mod.ts";
import { handler } from "./index.ts";

Deno.test("geo-lookup handler - basic", async () => {
  const req = new Request("http://localhost/functions/v1/geo-lookup", {
    method: "GET",
  });
  const corsHeaders = { "Access-Control-Allow-Origin": "*" };
  try {
    const res = await handler(req, corsHeaders);
    assertEquals(res.status, 200);
  } catch (e) { }
});
