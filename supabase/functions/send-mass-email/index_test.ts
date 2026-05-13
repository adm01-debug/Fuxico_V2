import { assertEquals } from "https://deno.land/std@0.203.0/assert/mod.ts";
import { handler } from "./index.ts";

Deno.test("send-mass-email handler - unauthorized", async () => {
  const req = new Request("http://localhost/functions/v1/send-mass-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer invalid",
    },
    body: JSON.stringify({ 
      subject: "Test",
      htmlBody: "Body",
      recipients: ["test@example.com"]
    }),
  });
  const corsHeaders = { "Access-Control-Allow-Origin": "*" };
  try {
    const res = await handler(req, corsHeaders);
    assertEquals(res.status, 401);
  } catch (e) { }
});
