import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const trackingId = url.searchParams.get("t");
    const email = url.searchParams.get("e");
    const reason = url.searchParams.get("r") || "Descadastramento via link";

    if (!trackingId && !email) {
      return new Response(
        generateHtmlPage("Erro", "Parâmetros inválidos"),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } 
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let recipientEmail = email;
    let userId: string | null = null;

    // If trackingId is provided, get email and user_id from tracked_emails
    if (trackingId) {
      const { data: trackedEmail } = await supabase
        .from("tracked_emails")
        .select("recipient_email, user_id")
        .eq("tracking_id", trackingId)
        .maybeSingle();

      if (trackedEmail) {
        recipientEmail = trackedEmail.recipient_email;
        userId = trackedEmail.user_id;
      }
    }

    if (!recipientEmail) {
      return new Response(
        generateHtmlPage("Erro", "Email não encontrado"),
        { 
          status: 404, 
          headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } 
        }
      );
    }

    // If we don't have user_id from tracking, we need to find it
    if (!userId && trackingId) {
      const { data: trackedEmail } = await supabase
        .from("tracked_emails")
        .select("user_id")
        .eq("tracking_id", trackingId)
        .maybeSingle();
      
      if (trackedEmail) {
        userId = trackedEmail.user_id;
      }
    }

    if (!userId) {
      return new Response(
        generateHtmlPage("Erro", "Usuário não identificado"),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } 
        }
      );
    }

    // Check if already unsubscribed
    const { data: existing } = await supabase
      .from("unsubscribed_emails")
      .select("id")
      .eq("user_id", userId)
      .eq("email", recipientEmail.toLowerCase())
      .maybeSingle();

    if (existing) {
      return new Response(
        generateHtmlPage(
          "Já Descadastrado",
          `O email <strong>${recipientEmail}</strong> já foi removido da lista de comunicações.`
        ),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } 
        }
      );
    }

    // Insert unsubscribe record
    const { error } = await supabase
      .from("unsubscribed_emails")
      .insert({
        user_id: userId,
        email: recipientEmail.toLowerCase(),
        reason,
        source: "link",
        tracking_id: trackingId,
      });

    if (error) {
      console.error("Error inserting unsubscribe:", error);
      return new Response(
        generateHtmlPage("Erro", "Não foi possível processar sua solicitação. Tente novamente."),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } 
        }
      );
    }

    // Log the event
    console.log(`Unsubscribed: ${recipientEmail} from user ${userId}`);

    return new Response(
      generateHtmlPage(
        "Descadastrado com Sucesso",
        `O email <strong>${recipientEmail}</strong> foi removido da lista de comunicações.<br><br>Você não receberá mais emails desta origem.`
      ),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } 
      }
    );

  } catch (error) {
    console.error("Unsubscribe error:", error);
    return new Response(
      generateHtmlPage("Erro", "Ocorreu um erro inesperado. Tente novamente mais tarde."),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } 
      }
    );
  }
});

function generateHtmlPage(title: string, message: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - FUXICO</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      padding: 48px;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
    }
    .icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 24px;
      background: ${title.includes("Sucesso") || title.includes("Descadastrado") ? "#10b981" : title.includes("Erro") ? "#ef4444" : "#3b82f6"};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .icon svg {
      width: 40px;
      height: 40px;
      color: white;
    }
    h1 {
      font-size: 24px;
      color: #1f2937;
      margin-bottom: 16px;
    }
    p {
      color: #6b7280;
      line-height: 1.6;
      font-size: 16px;
    }
    p strong {
      color: #1f2937;
    }
    .footer {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
      color: #9ca3af;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      ${title.includes("Sucesso") || title.includes("Descadastrado") 
        ? '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>'
        : title.includes("Erro")
        ? '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>'
        : '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
      }
    </div>
    <h1>${title}</h1>
    <p>${message}</p>
    <div class="footer">
      Powered by FUXICO
    </div>
  </div>
</body>
</html>
  `;
}
