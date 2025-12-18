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

// Company domains (configurable)
const INTERNAL_DOMAINS = ['company.com', 'empresa.com.br'];

// Business hours configuration
const BUSINESS_HOURS = {
  start: 8,  // 8 AM
  end: 18,   // 6 PM
  timezone: 'America/Sao_Paulo'
};

// Volume thresholds
const VOLUME_THRESHOLD = {
  hourly: 50,  // Max emails per hour
  daily: 200   // Max emails per day
};

function isExternalDomain(email: string): { isExternal: boolean; domain: string | null } {
  if (!email) return { isExternal: false, domain: null };
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return { isExternal: false, domain: null };
  const isExternal = !INTERNAL_DOMAINS.some(d => domain === d || domain.endsWith(`.${d}`));
  return { isExternal, domain };
}

function isSuspiciousHour(timestamp: Date): boolean {
  // Convert to business timezone
  const options: Intl.DateTimeFormatOptions = { 
    timeZone: BUSINESS_HOURS.timezone, 
    hour: 'numeric', 
    hour12: false 
  };
  const hour = parseInt(new Intl.DateTimeFormat('en-US', options).format(timestamp));
  const dayOptions: Intl.DateTimeFormatOptions = { 
    timeZone: BUSINESS_HOURS.timezone, 
    weekday: 'short' 
  };
  const dayOfWeek = new Intl.DateTimeFormat('en-US', dayOptions).format(timestamp);
  
  // Weekend or outside business hours
  const isWeekend = dayOfWeek === 'Sat' || dayOfWeek === 'Sun';
  const isOutsideHours = hour < BUSINESS_HOURS.start || hour >= BUSINESS_HOURS.end;
  
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

    const emailTimestamp = timestamp ? new Date(timestamp) : new Date();
    const targetEmail = direction === 'sent' ? recipientEmail : senderEmail;
    const { isExternal, domain } = isExternalDomain(targetEmail || '');

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
    if (direction === 'sent' && isSuspiciousHour(emailTimestamp)) {
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

    if (hourlyCount && hourlyCount >= VOLUME_THRESHOLD.hourly) {
      alerts.push({
        alert_type: 'volume_anomaly',
        severity: 'high',
        description: `Volume anormal: ${hourlyCount} emails enviados na última hora (limite: ${VOLUME_THRESHOLD.hourly})`,
      });
    } else if (dailyCount && dailyCount >= VOLUME_THRESHOLD.daily) {
      alerts.push({
        alert_type: 'volume_anomaly',
        severity: 'medium',
        description: `Volume elevado: ${dailyCount} emails enviados nas últimas 24h (limite: ${VOLUME_THRESHOLD.daily})`,
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
