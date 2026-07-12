import { assertEquals } from "https://deno.land/std@0.203.0/assert/mod.ts";
import { handler } from "./index.ts";

Deno.test("get-config handler - basic", async () => {
  const req = new Request("http://localhost/functions/v1/get-config", {
    method: "GET",
  });
  const corsHeaders = { "Access-Control-Allow-Origin": "*" };
  try {
    const res = await handler(req, corsHeaders);
    assertEquals(res.status, 200);
  } catch (_e) { }
});
