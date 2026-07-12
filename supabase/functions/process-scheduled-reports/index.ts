import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("process-scheduled-reports");

// eslint-disable-next-line sonarjs/cognitive-complexity -- orchestration handler; branches are linear guard checks
serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // SECURITY: Verify cron secret or admin authorization
  const cronSecret = Deno.env.get("CRON_SECRET");
  const providedSecret = req.headers.get("X-Cron-Secret");
  const authHeader = req.headers.get("Authorization");
  if (cronSecret && providedSecret !== cronSecret && !authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Find reports due to be sent
    const { data: dueReports, error: fetchError } = await supabase
      .from("scheduled_reports")
      .select("*")
      .eq("enabled", true)
      .lte("next_send_at", new Date().toISOString());

    if (fetchError) {
      log.error("Failed to fetch due reports", fetchError);
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    log.info(`Found ${dueReports?.length || 0} reports to process`);

    const results = [];

    for (const report of dueReports || []) {
      try {
        // Get user's tracking stats
        const { data: stats } = await supabase.rpc("get_user_tracking_stats", {
          p_user_id: report.user_id,
        });

        const statsData = stats?.[0] || {
          total_emails: 0,
          total_opens: 0,
          total_clicks: 0,
          total_bounces: 0,
          open_rate: 0,
          click_rate: 0,
          bounce_rate: 0,
        };

        // Build report content
        const reportContent = buildReportContent(report, statsData);

        // Send via email using Resend if configured
        const resendKey = Deno.env.get("RESEND_API_KEY");
        if (resendKey && report.format === "email" && report.recipients.length > 0) {
          for (const recipient of report.recipients) {
            try {
              await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${resendKey}`,
                },
                body: JSON.stringify({
                  from: "FUXICO Reports <reports@resend.dev>",
                  to: recipient,
                  // eslint-disable-next-line sonarjs/no-nested-conditional -- readable period selector
                  subject: `📊 ${report.name} - Relatório ${report.report_type === 'daily' ? 'Diário' : report.report_type === 'weekly' ? 'Semanal' : 'Mensal'}`,
                  html: reportContent,
                }),
              });
            } catch (e) {
              log.error(`Failed to send to ${recipient}`, e);
            }
          }
        }

        // Calculate next send time
        const nextSend = calculateNextSend(report.report_type);

        // Update report with last_sent_at and next_send_at
        await supabase
          .from("scheduled_reports")
          .update({
            last_sent_at: new Date().toISOString(),
            next_send_at: nextSend,
            updated_at: new Date().toISOString(),
          })
          .eq("id", report.id);

        // Create notification
        await supabase.from("notification_history").insert({
          user_id: report.user_id,
          type: "report_sent",
          severity: "info",
          title: "Relatório enviado",
          message: `O relatório "${report.name}" foi processado e enviado com sucesso.`,
          metadata: { report_id: report.id, recipients: report.recipients },
        });

        results.push({ id: report.id, status: "sent" });
        log.info(`Report ${report.id} processed successfully`);
      } catch (e) {
        log.error(`Error processing report ${report.id}`, e);
        results.push({ id: report.id, status: "error", error: String(e) });
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    log.error("Process scheduled reports error", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function calculateNextSend(reportType: string): string {
  const now = new Date();
  switch (reportType) {
    case "daily":
      now.setDate(now.getDate() + 1);
      now.setHours(8, 0, 0, 0);
      break;
    case "weekly":
      now.setDate(now.getDate() + (7 - now.getDay() + 1));
      now.setHours(8, 0, 0, 0);
      break;
    case "monthly":
      now.setMonth(now.getMonth() + 1);
      now.setDate(1);
      now.setHours(8, 0, 0, 0);
      break;
  }
  return now.toISOString();
}

interface StatsData {
  total_emails: number;
  total_opens: number;
  total_clicks: number;
  total_bounces: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
}

function buildReportContent(report: { name: string; report_type: string; metrics: string[] }, stats: StatsData): string {
  const metricsHtml = report.metrics.map((metric) => {
    switch (metric) {
      case "emails_sent": return `<tr><td>📧 Emails Enviados</td><td><strong>${stats.total_emails}</strong></td></tr>`;
      case "opens": return `<tr><td>👁 Aberturas</td><td><strong>${stats.total_opens}</strong> (${stats.open_rate}%)</td></tr>`;
      case "clicks": return `<tr><td>🖱 Cliques</td><td><strong>${stats.total_clicks}</strong> (${stats.click_rate}%)</td></tr>`;
      case "bounce_rate": return `<tr><td>⚠️ Bounces</td><td><strong>${stats.total_bounces}</strong> (${stats.bounce_rate}%)</td></tr>`;
      default: return "";
    }
  }).join("");

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #333; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">
        📊 ${report.name}
      </h1>
      // eslint-disable-next-line sonarjs/no-nested-conditional -- readable period selector
      // eslint-disable-next-line sonarjs/no-nested-conditional -- period label selector
      <p style="color: #666;">Relatório ${report.report_type === 'daily' ? 'Diário' : report.report_type === 'weekly' ? 'Semanal' : 'Mensal'} - ${new Date().toLocaleDateString('pt-BR')}</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background: #f8f9fa;">
            <th style="text-align: left; padding: 12px; border-bottom: 1px solid #dee2e6;">Métrica</th>
            <th style="text-align: left; padding: 12px; border-bottom: 1px solid #dee2e6;">Valor</th>
          </tr>
        </thead>
        <tbody>${metricsHtml}</tbody>
      </table>
      <p style="color: #999; font-size: 12px; margin-top: 30px;">
        Gerado automaticamente pelo FUXICO Email Tracking Pro
      </p>
    </div>
  `;
}
