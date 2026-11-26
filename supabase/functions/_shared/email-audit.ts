// =============================================================================
// FUXICO - Auditoria de email e regras de fraude (compartilhado entre edges)
// Arquivo: supabase/functions/_shared/email-audit.ts
// =============================================================================
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createLogger } from './logger.ts';

const log = createLogger('email-audit');

export type EmailDirection = 'sent' | 'received';

export interface EmailAuditInput {
  userId: string;
  userEmail: string;
  direction: EmailDirection;
  senderEmail: string;
  recipientEmail: string;
  subject?: string;
  externalDomain?: string;
  isExternal?: boolean;
  metadata?: Record<string, unknown>;
}

export interface EmailAuditRecord {
  id: string;
  user_id: string;
  user_email: string;
  direction: EmailDirection;
  sender_email: string;
  recipient_email: string;
  is_external: boolean | null;
  external_domain: string | null;
  timestamp?: string;
}

// Limiares das regras de fraude. Unico lugar para ajustar o comportamento.
export const FRAUD_RULES = {
  suspiciousHours: { start: 22, end: 6, timeZone: 'America/Sao_Paulo' },
  volumeLimitPerHour: 100,
  externalDomainLimitPerDay: 20,
};

const domainOf = (email: string): string => email.split('@')[1]?.trim().toLowerCase() ?? '';

/** Grava um evento em email_audit_logs. Lanca em caso de erro. */
export async function recordEmailAudit(
  client: SupabaseClient,
  input: EmailAuditInput
): Promise<EmailAuditRecord> {
  const senderDomain = domainOf(input.senderEmail);
  const recipientDomain = input.externalDomain?.toLowerCase() || domainOf(input.recipientEmail);
  const isExternal = input.isExternal ?? (!!recipientDomain && recipientDomain !== senderDomain);

  const { data, error } = await client
    .from('email_audit_logs')
    .insert({
      user_id: input.userId,
      user_email: input.userEmail,
      direction: input.direction,
      sender_email: input.senderEmail,
      recipient_email: input.recipientEmail,
      subject: input.subject ?? '',
      is_external: isExternal,
      external_domain: isExternal ? recipientDomain : null,
      metadata: input.metadata ?? {},
      timestamp: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data as EmailAuditRecord;
}

interface AlertDraft {
  alert_type: 'suspicious_hours' | 'external_recipient' | 'volume_anomaly';
  severity: 'low' | 'medium' | 'high';
  description: string;
}

function hourInZone(iso: string, timeZone: string): number {
  const formatted = new Intl.DateTimeFormat('pt-BR', {
    hour: 'numeric',
    hourCycle: 'h23',
    timeZone,
  }).format(new Date(iso));
  return Number(formatted);
}

async function countSince(
  admin: SupabaseClient,
  column: 'id',
  filters: Array<[string, string]>,
  since: string
): Promise<number> {
  let query = admin
    .from('email_audit_logs')
    .select(column, { count: 'exact', head: true })
    .gte('timestamp', since);
  for (const [key, value] of filters) query = query.eq(key, value);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

/**
 * Avalia as regras de fraude para um evento de auditoria e cria os alertas
 * correspondentes. Usa o client de service role porque a RLS de fraud_alerts
 * permite escrita apenas a admins. Nunca lanca: falha de alerta nao pode
 * derrubar o fluxo de envio.
 */
export async function evaluateFraudRules(
  admin: SupabaseClient | null,
  record: EmailAuditRecord
): Promise<void> {
  if (!admin || record.direction !== 'sent') return;

  try {
    const now = Date.now();
    const alerts: AlertDraft[] = [];
    const hour = hourInZone(
      record.timestamp ?? new Date().toISOString(),
      FRAUD_RULES.suspiciousHours.timeZone
    );
    const outsideBusinessHours =
      hour >= FRAUD_RULES.suspiciousHours.start || hour < FRAUD_RULES.suspiciousHours.end;

    if (outsideBusinessHours && record.is_external) {
      alerts.push({
        alert_type: 'suspicious_hours',
        severity: 'low',
        description: `Envio para ${record.external_domain} as ${hour}h, fora do horario comercial.`,
      });
    }

    const lastHour = await countSince(
      admin,
      'id',
      [
        ['user_id', record.user_id],
        ['direction', 'sent'],
      ],
      new Date(now - 3_600_000).toISOString()
    );
    if (lastHour >= FRAUD_RULES.volumeLimitPerHour) {
      alerts.push({
        alert_type: 'volume_anomaly',
        severity: 'high',
        description: `${lastHour} emails enviados na ultima hora.`,
      });
    }

    const lastDay = new Date(now - 86_400_000).toISOString();
    const { data: externalRows, error: externalError } = await admin
      .from('email_audit_logs')
      .select('external_domain')
      .eq('user_id', record.user_id)
      .eq('direction', 'sent')
      .eq('is_external', true)
      .gte('timestamp', lastDay);
    if (externalError) throw externalError;

    const externalDomains = new Set(
      (externalRows ?? []).map((row) => row.external_domain).filter(Boolean)
    );
    if (externalDomains.size >= FRAUD_RULES.externalDomainLimitPerDay) {
      alerts.push({
        alert_type: 'external_recipient',
        severity: 'medium',
        description: `${externalDomains.size} dominios externos distintos nas ultimas 24h.`,
      });
    }

    if (alerts.length === 0) return;

    const { data: existing, error: existingError } = await admin
      .from('fraud_alerts')
      .select('alert_type')
      .eq('user_id', record.user_id)
      .gte('created_at', lastDay)
      .in(
        'alert_type',
        alerts.map((a) => a.alert_type)
      );
    if (existingError) throw existingError;

    const alreadyAlerted = new Set((existing ?? []).map((row) => row.alert_type));
    const toInsert = alerts
      .filter((alert) => !alreadyAlerted.has(alert.alert_type))
      .map((alert) => ({
        user_id: record.user_id,
        user_email: record.user_email,
        alert_type: alert.alert_type,
        severity: alert.severity,
        description: alert.description,
        email_audit_log_id: record.id,
        is_resolved: false,
        metadata: { source: 'evaluate_fraud_rules' },
      }));

    if (toInsert.length === 0) return;

    const { error: insertError } = await admin.from('fraud_alerts').insert(toInsert);
    if (insertError) throw insertError;

    log.warn('Alertas de fraude registrados', {
      userId: record.user_id,
      types: toInsert.map((a) => a.alert_type),
    });
  } catch (error: unknown) {
    log.warn(
      'Falha ao avaliar regras de fraude',
      error instanceof Error ? error.message : String(error)
    );
  }
}
