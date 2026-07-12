# ADR-007 — Política de Retenção de Dados

**Status:** Aceito
**Data:** 2026-07-12
**Contexto:** LGPD, custo de storage, performance de queries e obrigações de auditoria exigem política formal e automatizada de retenção.

## Decisão

Adotamos retenção **baseada em partições mensais** com jobs `pg_cron` que dropam partições vencidas em O(1). Nenhum dado sensível é mantido além do estritamente necessário para operação, auditoria legal ou base legal LGPD.

## Matriz de retenção

| Tabela                    | Retenção | Justificativa                                       | Mecanismo                    |
|---------------------------|----------|-----------------------------------------------------|------------------------------|
| `tracking_events`         | 180 dias | Analytics comportamental — janela suficiente para dashboards e ML sem inflar storage | DROP PARTITION mensal |
| `webhook_logs`            | 90 dias  | Debug de integrações — 3 meses cobrem incidentes recorrentes | DROP PARTITION mensal |
| `audit_logs`              | 365 dias | Obrigação legal (LGPD Art. 37) e compliance interno | DROP PARTITION mensal |
| `rate_limit_logs`         | 30 dias  | Análise de abuso curta janela; forense migra p/ security_events | DROP PARTITION mensal |
| `security_events`         | 180 dias | Investigação de incidentes + tendências de ataque   | DROP PARTITION mensal |
| `login_attempts`          | 90 dias  | Detecção de credential stuffing / brute force       | DROP PARTITION mensal |
| `password_reset_tokens`   | 30 dias após uso/expiração | Não há valor após uso; PII sensível         | DELETE em `run_retention_cleanup` |
| `email_verification_tokens` | 30 dias após uso/expiração | Idem                                       | DELETE em `run_retention_cleanup` |
| `webauthn_challenges`     | 1 dia após expiração | Efêmero por natureza                           | DELETE horário |
| `blocked_ips`             | 7 dias após expiração explícita | Auditoria pós-fato                    | DELETE em `run_retention_cleanup` |
| `login_lockouts`          | 7 dias após liberação | Auditoria pós-fato                             | DELETE em `run_retention_cleanup` |
| `query_performance_snapshots` | 30 dias | Baseline de regressão — janela curta suficiente     | DELETE em job dedicado |
| `tracked_emails`          | Indefinido (soft delete via `deleted_at`) | Ativo de negócio do cliente         | Soft delete + purga LGPD sob demanda |
| `campaigns`, `email_sequences`, `email_templates` | Indefinido | Ativos operacionais do cliente | Soft delete |
| `contact_scores`, `domain_reputation` | Indefinido | Estado calculado — recomputável                    | N/A |

## Obrigações LGPD

1. **Direito ao esquecimento** (Art. 18 VI): Endpoint `POST /functions/v1/delete-user-data` remove PII em cascata, mantendo apenas logs anonimizados em `audit_logs` (obrigação legal).
2. **Portabilidade** (Art. 18 V): Endpoint de export retorna JSON com dados do titular.
3. **Base legal**: Consentimento explícito no signup + interesse legítimo para logs de segurança (Art. 7 IX).
4. **DPO**: Contato em `SECURITY.md`.

## Anonimização vs deleção

- **Anonimização** aplicada a `tracking_events.metadata` (IP truncado para /24, UA hasheado) já no ingestor.
- **Deleção** hard delete para PII direta (email, nome) após expirar retenção ou por requisição LGPD.
- **Logs de audit** preservam apenas `user_id` (UUID) — não há PII direta.

## Enforcement automatizado

Cron jobs `fuxico-retention-cleanup` (diário 03:00 UTC), `fuxico-tracking-events-retention` (diário 03:30 UTC) e `fuxico-monitor-cron-jobs` (a cada 30min) garantem enforcement + monitoramento. Falha de job dispara `security_events` severidade `high`.

## Alternativas rejeitadas

- **Retenção via DELETE em vez de DROP PARTITION**: O(N) e produz bloat massivo. Rejeitado.
- **Retenção indefinida**: Viola princípio de minimização LGPD (Art. 6 III) e infla custo. Rejeitado.
- **Retenção mais curta em audit_logs (< 365d)**: Insuficiente para compliance financeiro e investigação. Rejeitado.

## Revisão

Esta política é revisada a cada 6 meses ou após incidente de segurança / mudança regulatória.
