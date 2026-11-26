import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { evaluateFraudRules, recordEmailAudit, type EmailAuditRecord } from './email-audit.ts';

interface StubOptions {
  volumeLastHour?: number;
  externalDomains?: Array<string | null>;
  existingAlertTypes?: string[];
}

function createStubClient(options: StubOptions = {}) {
  const inserted: Array<{ table: string; rows: Array<Record<string, unknown>> }> = [];
  let reads = 0;

  const client = {
    from(table: string) {
      const builder: Record<string, unknown> = {};
      builder.select = () => builder;
      builder.insert = (rows: Record<string, unknown> | Array<Record<string, unknown>>) => {
        inserted.push({ table, rows: Array.isArray(rows) ? rows : [rows] });
        return builder;
      };
      builder.update = () => builder;
      builder.eq = () => builder;
      builder.gte = () => builder;
      builder.in = () => builder;
      builder.order = () => builder;
      builder.single = () =>
        Promise.resolve({ data: (inserted[inserted.length - 1]?.rows ?? [])[0], error: null });
      builder.then = (resolve: (value: unknown) => unknown) => {
        reads += 1;
        if (reads === 1) {
          return Promise.resolve({
            data: null,
            error: null,
            count: options.volumeLastHour ?? 0,
          }).then(resolve);
        }
        if (reads === 2) {
          const data = (options.externalDomains ?? []).map((domain) => ({
            external_domain: domain,
          }));
          return Promise.resolve({ data, error: null, count: data.length }).then(resolve);
        }
        const data = (options.existingAlertTypes ?? []).map((alert_type) => ({ alert_type }));
        return Promise.resolve({ data, error: null, count: data.length }).then(resolve);
      };
      return builder;
    },
  };

  return { client, inserted, reads: () => reads };
}

function createInsertCapture() {
  const inserted: Array<Record<string, unknown>> = [];
  const client = {
    from() {
      return {
        insert(rows: Record<string, unknown>) {
          inserted.push(rows);
          return { select: () => ({ single: () => Promise.resolve({ data: rows, error: null }) }) };
        },
      };
    },
  };
  return { client, inserted };
}

const baseRecord: EmailAuditRecord = {
  id: 'audit-1',
  user_id: 'user-1',
  user_email: 'dev@fuxico.app',
  direction: 'sent',
  sender_email: 'dev@fuxico.app',
  recipient_email: 'cliente@externo.com',
  is_external: true,
  external_domain: 'externo.com',
  timestamp: '2026-11-26T06:30:00.000Z', // 03:30 em America/Sao_Paulo
};

Deno.test('recordEmailAudit grava envio e marca destinatario externo', async () => {
  const capture = createInsertCapture();

  await recordEmailAudit(capture.client as never, {
    userId: 'user-1',
    userEmail: 'dev@fuxico.app',
    direction: 'sent',
    senderEmail: 'dev@fuxico.app',
    recipientEmail: 'cliente@externo.com',
    subject: 'Proposta',
  });

  assertEquals(capture.inserted[0].direction, 'sent');
  assertEquals(capture.inserted[0].is_external, true);
  assertEquals(capture.inserted[0].external_domain, 'externo.com');
  assertEquals(capture.inserted[0].metadata, {});
});

Deno.test('recordEmailAudit nao marca como externo o mesmo dominio', async () => {
  const capture = createInsertCapture();

  await recordEmailAudit(capture.client as never, {
    userId: 'user-1',
    userEmail: 'dev@fuxico.app',
    direction: 'sent',
    senderEmail: 'dev@fuxico.app',
    recipientEmail: 'colega@Fuxico.app',
  });

  assertEquals(capture.inserted[0].is_external, false);
  assertEquals(capture.inserted[0].external_domain, null);
});

Deno.test(
  'evaluateFraudRules cria alerta de horario suspeito para envio externo noturno',
  async () => {
    const stub = createStubClient();
    await evaluateFraudRules(stub.client as never, baseRecord);

    const alerts = stub.inserted.filter((entry) => entry.table === 'fraud_alerts');
    assertEquals(alerts.length, 1);
    assertEquals(alerts[0].rows[0].alert_type, 'suspicious_hours');
    assertEquals(alerts[0].rows[0].severity, 'low');
    assertEquals(alerts[0].rows[0].email_audit_log_id, 'audit-1');
  }
);

Deno.test('evaluateFraudRules nao cria alerta em horario comercial', async () => {
  const stub = createStubClient();
  await evaluateFraudRules(stub.client as never, {
    ...baseRecord,
    timestamp: '2026-11-26T15:00:00.000Z',
  });

  assertEquals(stub.inserted.filter((entry) => entry.table === 'fraud_alerts').length, 0);
});

Deno.test('evaluateFraudRules cria alerta de volume quando nao existe alerta igual', async () => {
  const stub = createStubClient({ volumeLastHour: 150 });
  await evaluateFraudRules(stub.client as never, {
    ...baseRecord,
    is_external: false,
    external_domain: null,
    timestamp: '2026-11-26T15:00:00.000Z',
  });

  const alerts = stub.inserted.filter((entry) => entry.table === 'fraud_alerts');
  assertEquals(alerts.length, 1);
  assertEquals(alerts[0].rows[0].alert_type, 'volume_anomaly');
  assertEquals(alerts[0].rows[0].severity, 'high');
});

Deno.test('evaluateFraudRules respeita dedupe de alerta existente', async () => {
  const stub = createStubClient({ volumeLastHour: 150, existingAlertTypes: ['volume_anomaly'] });
  await evaluateFraudRules(stub.client as never, {
    ...baseRecord,
    is_external: false,
    external_domain: null,
    timestamp: '2026-11-26T15:00:00.000Z',
  });

  assertEquals(stub.inserted.filter((entry) => entry.table === 'fraud_alerts').length, 0);
});

Deno.test('evaluateFraudRules ignora emails recebidos', async () => {
  const stub = createStubClient({ volumeLastHour: 150 });
  await evaluateFraudRules(stub.client as never, { ...baseRecord, direction: 'received' });

  assertEquals(stub.inserted.length, 0);
});
