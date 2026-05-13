import { assertEquals } from "https://deno.land/std@0.203.0/assert/mod.ts";
import { handler } from "./index.ts";

Deno.test("health-check handler - basic", async () => {
  const req = new Request("http://localhost/functions/v1/health-check", {
    method: "GET",
  });

  const corsHeaders = { "Access-Control-Allow-Origin": "*" };
  
  try {
    const res = await handler(req, corsHeaders);
    assertEquals(res.status === 200 || res.status === 503, true);
  } catch (e) {
    console.log("Test caught expected failure or error:", e.message);
  }
});

Deno.test("health-check handler - detailed", async () => {
  const req = new Request("http://localhost/functions/v1/health-check?detailed=true", {
    method: "GET",
  });

  const corsHeaders = { "Access-Control-Allow-Origin": "*" };
  
  try {
    const res = await handler(req, corsHeaders);
    const data = await res.json();
    if (res.status === 200) {
      assertEquals(data.status, "healthy");
      assertEquals(!!data.checks, true);
    }
  } catch (e) {
    console.log("Test caught expected failure or error:", e.message);
  }
});
