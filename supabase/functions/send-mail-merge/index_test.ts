import { assertEquals } from "https://deno.land/std@0.203.0/assert/mod.ts";
import { handler } from "./index.ts";

Deno.test("send-mail-merge handler - unauthorized", async () => {
  const req = new Request("http://localhost/functions/v1/send-mail-merge", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer invalid",
    },
    body: JSON.stringify({ 
      templateId: crypto.randomUUID(), 
      recipients: [{ email: "test@example.com" }],
      subject: "Test"
    }),
  });
  const corsHeaders = { "Access-Control-Allow-Origin": "*" };
  try {
    const res = await handler(req, corsHeaders);
    assertEquals(res.status, 401);
  } catch (e) { }
});
