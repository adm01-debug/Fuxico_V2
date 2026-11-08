# Regras de domínio que o código não deixa óbvio — referência para agentes

Ler quando mexer em tracking, sequências, envio em massa, assinatura de documentos, webhooks ou
segurança/MFA.

## O que o produto é

Rastreamento e analytics de e-mail para vendas/CRM: o usuário manda e-mail pelo Gmail e descobre quando
foi aberto, clicado ou encaminhado. Duas pontas de interface: a **extensão Chrome** injetada no Gmail
(`chrome-extension/`, ver `docs/agentes/extensao-chrome.md`) e o **dashboard React** (`src/pages/`,
rotas `/dashboard`, `/tracking`, `/audit`, `/admin/observability`). Papéis: dono do e-mail e **admin**
com RBAC (`/permissions`, `/roles`, função `has_role`, edge `admin-rpc`).

Rotas (router inline em `src/App.tsx`): públicas `/`, `/auth`, `/pricing`, `/privacy`,
`/forgot-password`, `/reset-password`, `/verify-email`, `/mfa-verify`; protegidas por `<PrivateRoute>`
`/dashboard`, `/settings`, `/security`, `/permissions`, `/roles`, `/two-factor-auth`, `/tracking`,
`/audit`, `/admin/observability`; `*` → `NotFound`.

## Captura de eventos — quatro caminhos, não um

| Caminho | Edge | Tabelas |
|---|---|---|
| Pixel invisível (abertura) | `track-pixel` | `tracked_emails` → `tracking_events` |
| Link reescrito (clique) | `track-link` | `tracked_links` → `link_click_events` |
| Link avulso | `track-standalone-link` | `standalone_tracked_links` → `link_click_events` |
| Beacon de abertura | `track-beacon` | `tracking_events` |
| Documento | `track-document` | `tracked_documents` → `document_events` |

Três regras que não estão óbvias no código:

1. **Detecção de prefetch é parte do contrato.** `track-pixel`, `track-link`, `track-beacon` e
   `track-document` descartam aberturas de proxy/prefetch. Mexer na gravação de evento sem manter essa
   checagem infla as métricas do cliente.
2. **Self-open não conta.** Abertura do próprio remetente dentro de 2 minutos é ignorada
   (`chrome-extension/config.js:52`, `DETECTION.SELF_OPEN_THRESHOLD_MS`). O limiar vem da extensão e pode
   ser sobrescrito pela edge `get-config` — não duplique o número em outro lugar.
3. **O tráfego de tracking entra pelo proxy, não pela URL do Supabase.** `public/_redirects` mapeia
   `/api/public/track/open.gif?tp=` → `track-pixel?t=` e `/api/public/track/click?tp=&l=` →
   `track-link?t=&l=`, apontando para o ref `blopallcxuotfutblkoe`. O `?tp=` existe para não expor a
   infraestrutura no e-mail: renomear esse parâmetro invalida **todos os e-mails já enviados**.

## Estatísticas

`get-tracking-stats` e o dashboard leem a materialized view **`email_stats_mv`** (+ view
`tracking_events_monthly_agg`). MV não atualiza sozinha: quem atualiza é a edge `refresh-stats`
(service_role, exige JWT de usuário). Número "errado" no dashboard costuma ser MV velha, não bug de
query — confira a MV antes de mexer em SQL.

## Sequências e envios

- Motor: `webhook-sequences` + `process-sequences` (job de background) sobre `email_sequences`,
  `sequence_enrollments`, `sequence_steps`, `sequence_step_executions`.
- Envio: `send-batch-emails` (`email_batches`), `send-mail-merge` (`email_templates`, `mail_merge_jobs`),
  `send-mass-email` (`mass_email_campaigns`).
- Opt-out é global: `unsubscribe` grava em `unsubscribed_emails` e marca `tracked_emails`. **Qualquer**
  caminho de envio novo precisa consultar `unsubscribed_emails` antes de disparar — é LGPD, não
  preferência. `dsar-export` (art. 19) exporta a PII do titular para o bucket privado `dsar-exports` com
  URL assinada de 24 h.
- `ab-test-dispatch` usa holdout **determinístico** (mesmo destinatário cai sempre no mesmo braço).
  Trocar a função de hash reembaralha testes em andamento.

## Segurança e MFA

- MFA TOTP com backup codes: edge `totp`, tabelas `mfa_settings` e `mfa_backup_codes`, máquina de estado
  em `src/lib/mfa-state-machine.ts`, rota `/mfa-verify`. Há também WebAuthn
  (`webauthn_credentials`, `webauthn_challenges`).
- Admin só pelo proxy: `admin-rpc` valida o JWT do chamador, confere `role = 'admin'` via `has_role` e só
  então chama a função `admin_*` pedida (lista fixa de funções permitidas no topo do arquivo). **Nunca**
  dê `GRANT` de função `admin_*` direto para `authenticated` — o proxy existe por isso.
- Eventos: `security_events` (particionada) alimenta `alert-dispatcher`, que grava `alert_dispatch_log`.
  Canais declarados em `observability/alerts.yml` (Slack e PagerDuty); **nada no código dispara
  PagerDuty** — o YAML é declarativo.
- `WHITELISTED_IPS` + `supabase/functions/_shared/ip-whitelist.ts` restringem edges; `SECURITY.md`
  declara rate limits (público 1000 rpm / autenticado 100 rpm / admin 200 rpm). São declarações do
  documento: **NÃO VERIFICADO** em runtime.
- `SECURITY.md:55` declara `X-XSS-Protection: 1; mode=block` e `nginx.conf:17` manda
  `X-XSS-Protection "0"`. Divergência documento × config — não "corrija" um lado sem decidir os dois.

## Integrações de saída

`bitrix24-sync` (webhook configurado em Settings → Integrações, guardado em `user_preferences`),
`zapier-webhook` (entrada, pública por design), `webhook-dispatch` (saída, pública por design) com
`webhook_configs`, `webhook_logs`, `webhook_idempotency`, `webhook_circuit_state` e
`webhook-retry-worker` (reprocessa pendentes via `pg_cron`). Há **circuit breaker**
(`_shared/circuit-breaker.ts`) e **idempotência** por tabela: entrega duplicada ou retry infinito quase
sempre é mexida nessas duas e não no disparo.

IA: `generate-followup` e `suggest-subject` chamam `https://ai.gateway.lovable.dev` com `LOVABLE_API_KEY`
— custo por chamada, e a entrada passa por `_shared/llm-sanitizer.ts`. Não remova o sanitizer.

## Herança do Lovable

O projeto nasceu no Lovable: migrations com nome `<timestamp>_<uuid>`, `lovable-tagger` no build,
`@lovable.dev/cloud-auth-js` em `src/integrations/lovable/index.ts`, gateway de IA da Lovable e
`fuxico.lovable.app` como dashboard da extensão. Isso explica nomes e duplicações estranhas — não é
convenção a seguir em código novo.
