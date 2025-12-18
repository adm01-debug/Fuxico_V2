import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailActivityRequest {
  direction: 'sent' | 'received';
  recipientEmail?: string;
  senderEmail?: string;
  subject?: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

interface AuditConfig {
  internal_domains: string[];
  business_hours_start: number;
  business_hours_end: number;
  timezone: string;
  volume_threshold_hourly: number;
  volume_threshold_daily: number;
}

// Default config as fallback
const DEFAULT_CONFIG: AuditConfig = {
  internal_domains: ['company.com', 'empresa.com.br'],
  business_hours_start: 8,
  business_hours_end: 18,
  timezone: 'America/Sao_Paulo',
  volume_threshold_hourly: 50,
  volume_threshold_daily: 200,
};

function isExternalDomain(email: string, internalDomains: string[]): { isExternal: boolean; domain: string | null } {
  if (!email) return { isExternal: false, domain: null };
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return { isExternal: false, domain: null };
  const isExternal = !internalDomains.some(d => domain === d || domain.endsWith(`.${d}`));
  return { isExternal, domain };
}

function isSuspiciousHour(timestamp: Date, config: AuditConfig): boolean {
  const options: Intl.DateTimeFormatOptions = { 
    timeZone: config.timezone, 
    hour: 'numeric', 
    hour12: false 
  };
  const hour = parseInt(new Intl.DateTimeFormat('en-US', options).format(timestamp));
  const dayOptions: Intl.DateTimeFormatOptions = { 
    timeZone: config.timezone, 
    weekday: 'short' 
  };
  const dayOfWeek = new Intl.DateTimeFormat('en-US', dayOptions).format(timestamp);
  
  const isWeekend = dayOfWeek === 'Sat' || dayOfWeek === 'Sun';
  const isOutsideHours = hour < config.business_hours_start || hour >= config.business_hours_end;
  
  return isWeekend || isOutsideHours;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseAuth = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: EmailActivityRequest = await req.json();
    const { direction, recipientEmail, senderEmail, subject, timestamp, metadata } = body;

    console.log(`Logging email activity for user ${user.email}: ${direction}`);

    // Fetch audit config from database
    const { data: configData } = await supabaseClient
      .from("audit_config")
      .select("*")
      .single();

    const config: AuditConfig = configData || DEFAULT_CONFIG;
    console.log("Using audit config:", config);

    const emailTimestamp = timestamp ? new Date(timestamp) : new Date();
    const targetEmail = direction === 'sent' ? recipientEmail : senderEmail;
    const { isExternal, domain } = isExternalDomain(targetEmail || '', config.internal_domains);

    // Insert audit log
    const { data: auditLog, error: insertError } = await supabaseClient
      .from("email_audit_logs")
      .insert({
        user_id: user.id,
        user_email: user.email,
        direction,
        recipient_email: recipientEmail,
        sender_email: senderEmail,
        subject,
        timestamp: emailTimestamp.toISOString(),
        is_external: isExternal,
        external_domain: isExternal ? domain : null,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to log activity" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check for fraud patterns
    const alerts: Array<{
      alert_type: string;
      severity: string;
      description: string;
    }> = [];

    // 1. Check suspicious hours (only for sent emails)
    if (direction === 'sent' && isSuspiciousHour(emailTimestamp, config)) {
      const hour = emailTimestamp.getHours();
      const dayOfWeek = emailTimestamp.toLocaleDateString('pt-BR', { weekday: 'long' });
      alerts.push({
        alert_type: 'suspicious_hours',
        severity: hour >= 22 || hour <= 5 ? 'high' : 'medium',
        description: `Email enviado em horário suspeito: ${emailTimestamp.toLocaleString('pt-BR')} (${dayOfWeek})`,
      });
    }

    // 2. Check external recipient (only for sent emails)
    if (direction === 'sent' && isExternal) {
      alerts.push({
        alert_type: 'external_recipient',
        severity: 'low',
        description: `Email enviado para domínio externo: ${domain}`,
      });
    }

    // 3. Check volume anomaly
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const { count: hourlyCount } = await supabaseClient
      .from("email_audit_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("direction", "sent")
      .gte("timestamp", oneHourAgo.toISOString());

    const { count: dailyCount } = await supabaseClient
      .from("email_audit_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("direction", "sent")
      .gte("timestamp", oneDayAgo.toISOString());

    if (hourlyCount && hourlyCount >= config.volume_threshold_hourly) {
      alerts.push({
        alert_type: 'volume_anomaly',
        severity: 'high',
        description: `Volume anormal: ${hourlyCount} emails enviados na última hora (limite: ${config.volume_threshold_hourly})`,
      });
    } else if (dailyCount && dailyCount >= config.volume_threshold_daily) {
      alerts.push({
        alert_type: 'volume_anomaly',
        severity: 'medium',
        description: `Volume elevado: ${dailyCount} emails enviados nas últimas 24h (limite: ${config.volume_threshold_daily})`,
      });
    }

    // Insert fraud alerts
    if (alerts.length > 0) {
      const alertsToInsert = alerts.map(alert => ({
        user_id: user.id,
        user_email: user.email!,
        email_audit_log_id: auditLog.id,
        ...alert,
      }));

      const { error: alertError } = await supabaseClient
        .from("fraud_alerts")
        .insert(alertsToInsert);

      if (alertError) {
        console.error("Alert insert error:", alertError);
      } else {
        console.log(`Created ${alerts.length} fraud alerts for user ${user.email}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        auditLog,
        alertsCreated: alerts.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error in log-email-activity:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
