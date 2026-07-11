# FUXICO — Database ER Diagram

**Última atualização:** 2026-07-11 (pós-migration `add_optimistic_locking_version`)

## Visão geral

O banco de dados FUXICO possui **52 tabelas** no schema `public`, organizadas em 7 domínios funcionais. Todas as tabelas user-facing possuem RLS habilitado e políticas por `auth.uid()`.

## Domínios

### 1. Tracking Core (fundação do produto)
- `tracked_emails` (+ `version`) — registro-mestre de cada e-mail rastreado
- `tracking_events` — pixel opens e link clicks (append-only)
- `tracked_links` — mapeamento de links dentro dos e-mails
- `tracked_documents` — anexos rastreados (PDF/attachments)
- `document_events` — eventos de visualização de documentos
- `link_click_events` — detalhamento de cliques (URL, IP, UA)
- `standalone_tracked_links` — links avulsos (fora de e-mail)
- `email_stats_mv` — materialized view agregando estatísticas por e-mail

### 2. Sequências & Automação
- `email_sequences` (+ `version`) — definição de régua
- `sequence_steps` — passos ordenados de cada sequência
- `sequence_enrollments` — destinatários inscritos
- `sequence_step_executions` — execuções por (enrollment, step)
- `campaigns` (+ `version`) — campanhas de disparo em massa
- `scheduled_emails` — envios agendados
- `email_templates` (+ `version`) — modelos reutilizáveis
- `follow_up_reminders` — lembretes automáticos
- `ab_tests` — variantes A/B por campanha

### 3. Segurança & Auth
- `user_roles` (RBAC) — papéis por usuário
- `role_permissions` / `permissions` — matriz permissão × papel
- `mfa_settings` — TOTP config
- `webauthn_credentials` / `webauthn_challenges` — passkeys
- `password_reset_tokens` / `password_reset_requests`
- `email_verification_tokens`
- `login_attempts` / `login_lockouts` — anti-brute-force
- `active_sessions` — sessões ativas
- `blocked_ips` / `ip_whitelist` / `geo_whitelist`
- `security_events` — trilha de eventos de segurança
- `audit_logs` / `audit_config` / `email_audit_logs`
- `fraud_alerts` — anomalias detectadas

### 4. Deliverability & Reputação
- `domain_reputation` — score por domínio remetente
- `deliverability_logs` — logs SPF/DKIM/DMARC
- `bounce_alerts` — alertas de taxa de bounce
- `alert_thresholds` — thresholds por usuário
- `unsubscribed_emails` — LGPD compliance

### 5. Integrações & CRM
- `bitrix24_config` — configuração Bitrix24
- `gmail_configurations` — tokens Gmail (extensão)
- `whatsapp_configs` — provedor WhatsApp
- `webhook_configs` / `webhook_logs` — webhooks outbound
- `rate_limit_logs` — telemetria de rate-limit
- `contact_scores` — lead scoring calculado

### 6. Notificações & Relatórios
- `notification_history` — histórico de notificações in-app
- `scheduled_reports` — relatórios agendados
- `user_preferences` — preferências UI/notificação por usuário
- `feature_flags` — feature toggles

### 7. White-label
- `whitelabel_config` — branding por usuário/organização

## Optimistic Locking

Tabelas com coluna `version` (INT NOT NULL DEFAULT 1) + trigger `increment_version_column()`:
`campaigns`, `email_sequences`, `tracked_emails`, `email_templates`.

Convenção do serviço: UPDATE inclui `WHERE version = <expected>`; 0 linhas afetadas → `OptimisticLockError`.

## Diagrama textual (principais FKs)

```text
auth.users (Supabase)
    │
    ├─< user_roles ──> permissions (via role_permissions)
    ├─< tracked_emails ──< tracking_events
    │                    ├─< tracked_links ──< link_click_events
    │                    └─< follow_up_reminders
    ├─< email_sequences ──< sequence_steps ──< sequence_step_executions
    │                    └─< sequence_enrollments
    ├─< campaigns ──< ab_tests
    ├─< tracked_documents ──< document_events
    ├─< bitrix24_config
    ├─< gmail_configurations
    └─< user_preferences (1:1)

Materialized view:
  email_stats_mv  ← agrega  tracked_emails × tracking_events
```

## Índices críticos

- `tracking_events(tracking_id, created_at DESC)` — dedupe + keyset pagination
- `tracked_emails(user_id, created_at DESC, id DESC)` — cursor pagination
- `link_click_events(tracking_id, link_id)` — analytics por link
- `sequence_enrollments(sequence_id, status)` — worker de processamento

Para regenerar automaticamente use `supabase db dump --data-only=false | supabase-schema-visualizer`.
