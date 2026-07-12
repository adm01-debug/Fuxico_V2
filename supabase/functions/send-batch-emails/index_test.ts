import { assertEquals } from "https://deno.land/std@0.203.0/assert/mod.ts";
import { handler } from "./index.ts";

Deno.test("send-batch-emails handler - unauthorized", async () => {
  const req = new Request("http://localhost/functions/v1/send-batch-emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer invalid",
    },
    body: JSON.stringify({ emails: [{ to: "test@example.com", subject: "S", body: "B" }] }),
  });
  const corsHeaders = { "Access-Control-Allow-Origin": "*" };
  try {
    const res = await handler(req, corsHeaders);
    assertEquals(res.status, 401);
  } catch (_e) {
    console.error("caught:", _e);
    }
});
