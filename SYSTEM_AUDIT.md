# FUXICO - Auditoria Completa do Sistema

**Data:** 2026-03-26
**Autor:** Auditoria Automatizada (Claude Code)
**Versao:** 2.0 (atualizado apos 4 rounds de correcoes)
**Classificacao:** Confidencial

---

## Sumario Executivo

O **FUXICO** e uma plataforma de email tracking e analytics construida com React 18, TypeScript, Supabase (PostgreSQL + Edge Functions) e deploy via Docker/Nginx. O sistema possui ~266 arquivos TypeScript, 40 Edge Functions, 64 migracoes de banco e uma Chrome Extension.

### Principais Problemas Identificados

| Categoria | Criticos | Altos | Medios | Baixos |
|-----------|----------|-------|--------|--------|
| Seguranca | 5 | 8 | 6 | 4 |
| Performance | 2 | 3 | 4 | 2 |
| Banco de Dados | 1 | 4 | 5 | 3 |
| Infraestrutura | 1 | 2 | 3 | 1 |
| Qualidade de Codigo | 0 | 2 | 4 | 3 |
| **Total** | **9** | **19** | **22** | **13** |

### Top 5 Acoes Imediatas

1. **Remover `.env` do historico git** - Credenciais Supabase expostas
2. **Corrigir CORS** - `chrome-extension://` permite qualquer extensao
3. **Corrigir Open Redirect** em `track-link` - Redirecionamento sem validacao
4. **Corrigir SSRF** em `webhook-dispatch` e `bitrix24-sync` - URLs internas acessiveis
5. **Remover `unsafe-inline`/`unsafe-eval`** do CSP das Edge Functions

---

## 1. SEGURANCA

### 1.1 [CRITICO] Credenciais Expostas no Repositorio

**Arquivo:** `.env` (commitado no git)
**Severidade:** Alta | **Impacto:** Seguranca | **Prioridade:** Critico

O arquivo `.env` contem credenciais reais do Supabase commitadas no repositorio:
```
VITE_SUPABASE_PROJECT_ID="npjfwzzapbtcguoupozd"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIs..."
VITE_SUPABASE_URL="https://npjfwzzapbtcguoupozd.supabase.co"
```

Embora `.env` esteja no `.gitignore`, o arquivo ja foi commitado e esta no historico.

**Recomendacao:**
- Remover `.env` do tracking do git (`git rm --cached .env`)
- Rotacionar todas as chaves no painel Supabase
- Usar secrets do CI/CD para builds

---

### 1.2 [CRITICO] CORS Permite Qualquer Chrome Extension

**Arquivo:** `supabase/functions/_shared/cors.ts:17`
**Severidade:** Alta | **Impacto:** Seguranca | **Prioridade:** Critico

```typescript
// ANTES - Vulneravel
'chrome-extension://',

// A funcao isOriginAllowed() aceita qualquer extensao:
if (allowed.endsWith('://') && origin.startsWith(allowed)) {
  return true; // Qualquer chrome-extension://xxx passa
}
```

**Recomendacao:** Remover o pattern generico e usar IDs especificos de extensao, ou remover completamente se a extensao usa background scripts.

---

### 1.3 [CRITICO] Open Redirect em track-link

**Arquivo:** `supabase/functions/track-link/index.ts:63`
**Severidade:** Alta | **Impacto:** Seguranca | **Prioridade:** Critico

```typescript
// ANTES - Vulneravel
return Response.redirect(link.original_url, 302);
// Sem validacao: atacante pode registrar link apontando para site malicioso
```

**Recomendacao:** Validar que a URL e HTTPS e nao aponta para dominios internos/maliciosos.

---

### 1.4 [CRITICO] SSRF em webhook-dispatch

**Arquivo:** `supabase/functions/webhook-dispatch/index.ts:248-249`
**Severidade:** Alta | **Impacto:** Seguranca | **Prioridade:** Critico

```typescript
// URLs de webhook vem do banco (controladas pelo usuario)
const { response, attempts } = await dispatchWithRetry(
  config.url, // Pode apontar para localhost, IPs privados, metadata services
  webhookPayload, headers, defaultRetryConfig, log
);
```

**Recomendacao:** Implementar validacao de URL proibindo IPs privados (10.x, 172.16-31.x, 192.168.x, 127.x, 169.254.169.254).

---

### 1.5 [CRITICO] SSRF + Parameter Injection em bitrix24-sync

**Arquivo:** `supabase/functions/bitrix24-sync/index.ts:131`
**Severidade:** Alta | **Impacto:** Seguranca | **Prioridade:** Critico

```typescript
// webhookUrl vem do banco, pode conter ? ou & para injetar parametros
const response = await fetch(
  `${webhookUrl}/crm.contact.list?filter[EMAIL]=${encodeURIComponent(email)}`
);
```

**Recomendacao:** Usar `new URL()` para construir URLs de forma segura e validar o formato do webhookUrl.

---

### 1.6 [ALTO] CSP com unsafe-inline e unsafe-eval

**Arquivo:** `supabase/functions/_shared/security-headers.ts:15`
**Severidade:** Alta | **Impacto:** Seguranca | **Prioridade:** Importante

```typescript
"script-src 'self' 'unsafe-inline' 'unsafe-eval'" // Anula protecao contra XSS
```

**Recomendacao:** Remover `unsafe-inline` e `unsafe-eval`, usar nonces ou hashes.

---

### 1.7 [ALTO] JWT Desabilitado em Funcoes Sensiveis

**Arquivo:** `supabase/config.toml`
**Severidade:** Alta | **Impacto:** Seguranca | **Prioridade:** Importante

16 funcoes tem `verify_jwt = false`, incluindo funcoes que deveriam requerer autenticacao:
- `ai-insights` - Retorna dados analiticos
- `create-tracking` - Cria pixels de rastreamento
- `check-deliverability` - Verifica entregabilidade
- `generate-followup` - Gera follow-ups com IA
- `suggest-subject` - Sugere assuntos com IA
- `send-slack-notification` - Envia notificacoes

**Recomendacao:** Habilitar `verify_jwt = true` em funcoes que acessam dados do usuario.

---

### 1.8 [ALTO] Rate Limiting Apenas em Memoria

**Arquivo:** `supabase/functions/_shared/rate-limit.ts:30`
**Severidade:** Alta | **Impacto:** Seguranca | **Prioridade:** Importante

```typescript
const memoryStore = new Map<string, { count: number; resetAt: number }>();
```

Edge Functions escalam automaticamente. Cada instancia tem seu proprio `Map`, tornando o rate limiting ineficaz em producao.

**Recomendacao:** Usar Supabase DB ou Redis para rate limiting distribuido.

---

### 1.9 [ALTO] XSS via highlightText

**Arquivo:** `src/hooks/use-fulltext-search.ts:86`
**Severidade:** Alta | **Impacto:** Seguranca | **Prioridade:** Importante

```typescript
// Injeta HTML diretamente - se usado com dangerouslySetInnerHTML, e XSS
return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
```

**Recomendacao:** Retornar React elements ao inves de HTML string, ou usar sanitizacao.

---

### 1.10 [ALTO] Ausencia de Filtro user_id em Notificacoes Realtime

**Arquivo:** `src/hooks/use-realtime-notifications.ts:71-76`
**Severidade:** Alta | **Impacto:** Seguranca | **Prioridade:** Importante

O hook se inscreve em TODOS os `tracking_events` e `fraud_alerts` sem filtro de user_id no canal. Embora a query subsequente valide o user_id, o canal Realtime recebe eventos de todos os usuarios.

```typescript
// Recebe TODOS os eventos de TODOS os usuarios
.on('postgres_changes', {
  event: 'INSERT',
  schema: 'public',
  table: 'tracking_events', // Sem filtro!
}, ...)
```

**Recomendacao:** Adicionar filtro no canal: `filter: 'user_id=eq.' + user.id` (requer que tracking_events tenha user_id, ou usar view).

---

### 1.11 [MEDIO] Nginx sem HSTS e CSP

**Arquivo:** `nginx.conf`
**Severidade:** Media | **Impacto:** Seguranca | **Prioridade:** Importante

Headers ausentes:
- `Strict-Transport-Security` (HSTS)
- `Content-Security-Policy`
- `Permissions-Policy`

---

### 1.12 [MEDIO] TypeScript Strict Mode Desabilitado

**Arquivo:** `tsconfig.app.json`
**Severidade:** Media | **Impacto:** Estabilidade | **Prioridade:** Importante

`strict: false` permite erros de tipo silenciosos que podem causar vulnerabilidades em runtime.

---

### 1.13 [MEDIO] localStorage para Sessao

**Arquivo:** `src/integrations/supabase/client.ts:13`
**Severidade:** Media | **Impacto:** Seguranca | **Prioridade:** Desejavel

Tokens de sessao em `localStorage` sao vulneraveis a XSS. Qualquer script injetado pode roubar a sessao.

---

## 2. PERFORMANCE

### 2.1 [CRITICO] N+1 Query em useCampaigns

**Arquivo:** `src/hooks/use-campaigns.ts:46-81`
**Severidade:** Alta | **Impacto:** Performance | **Prioridade:** Critico

Para cada campanha, 2 queries adicionais sao feitas (tracked_emails + tracking_events). Com 50 campanhas = 100+ queries.

```typescript
// ANTES - N+1
const campaignsWithStats = await Promise.all(
  campaigns.map(async (campaign) => {
    const { data: emails } = await supabase.from('tracked_emails')...
    const { data: events } = await supabase.from('tracking_events')...
  })
);
```

**Recomendacao:** Usar uma RPC do Supabase que retorne campanhas com stats via JOIN, ou uma Materialized View.

---

### 2.2 [ALTO] Race Condition em useEnrollContact

**Arquivo:** `src/hooks/useEmailSequences.ts:302-312`
**Severidade:** Alta | **Impacto:** Estabilidade | **Prioridade:** Importante

```typescript
// Read-modify-write: duas inscricoes simultaneas perdem incremento
const { data: sequence } = await supabase
  .from('email_sequences').select('total_enrolled')...
await supabase
  .from('email_sequences').update({ total_enrolled: sequence.total_enrolled + 1 })...
```

**Recomendacao:** Usar RPC com `UPDATE ... SET total_enrolled = total_enrolled + 1`.

---

### 2.3 [ALTO] Race Condition em track-link Click Count

**Arquivo:** `supabase/functions/track-link/index.ts:48-51`
**Severidade:** Alta | **Impacto:** Estabilidade | **Prioridade:** Importante

```typescript
// Leitura + escrita nao atomica
.update({ click_count: (link.click_count || 0) + 1 })
```

**Recomendacao:** Usar RPC com incremento atomico.

---

### 2.4 [MEDIO] Busca Fulltext Sem Paginacao

**Arquivo:** `src/hooks/use-fulltext-search.ts:65`
**Severidade:** Media | **Impacto:** Performance | **Prioridade:** Desejavel

Hard-coded `limit(100)` sem paginacao. Deveria implementar cursor-based pagination.

---

## 3. BANCO DE DADOS

### 3.1 [ALTO] Politica RLS Permissiva em password_reset_requests

**Severidade:** Alta | **Impacto:** Seguranca | **Prioridade:** Critico

```sql
CREATE POLICY "Anyone can request password reset"
ON public.password_reset_requests FOR INSERT
WITH CHECK (true); -- Aceita qualquer dado!
```

**Recomendacao:** Validar que email existe e pertence a um usuario valido.

---

### 3.2 [ALTO] Foreign Keys sem ON DELETE

Varias tabelas tem FKs para `auth.users(id)` sem clausula ON DELETE:
- `entity_versions.changed_by`
- `fraud_alerts.resolved_by`
- `geo_whitelist.added_by`
- `password_reset_requests.reviewed_by` (sem FK)

**Recomendacao:** Adicionar `ON DELETE SET NULL`.

---

### 3.3 [MEDIO] Constraints CHECK Ausentes

- `bounce_alerts.bounce_rate` - Sem CHECK (0-1)
- `sequence_steps.delay_days` - Sem CHECK (>= 0)
- `scheduled_emails.scheduled_at` - Aceita datas no passado
- `user_preferences.email_digest_frequency` - Sem CHECK de enum

---

### 3.4 [MEDIO] Indexes Compostos Ausentes

```sql
-- Ausentes:
CREATE INDEX idx_sequence_enrollments_user_status
  ON sequence_enrollments(user_id, status);
CREATE INDEX idx_password_reset_requests_user_status
  ON password_reset_requests(user_id, status);
```

---

## 4. INFRAESTRUTURA

### 4.1 [ALTO] Deploy Placeholder

**Arquivo:** `.github/workflows/ci.yml:234-237`

```yaml
- name: Deploy to Production
  run: |
    echo "Deploy would happen here" # NAO FAZ DEPLOY!
```

**Recomendacao:** Implementar deploy real (Vercel, Cloudflare Pages, etc).

---

### 4.2 [MEDIO] Docker Compose Desatualizado

**Arquivo:** `docker-compose.yml:1`

```yaml
version: "3.8" # Deprecated no Docker Compose V2+
```

Redis declarado mas nao conectado a aplicacao.

---

## 5. QUALIDADE DE CODIGO

### 5.1 [ALTO] Testes de Seguranca Insuficientes

Testes de seguranca sao apenas unitarios com mocks. Nao existem:
- Testes de integracao com Supabase real
- Testes de penetracao automatizados
- Testes E2E para fluxos de autenticacao

---

### 5.2 [MEDIO] Principio SOLID Violado nos Hooks

Hooks como `use-tracking.ts` e `use-campaigns.ts` misturam:
- Fetching de dados
- Transformacao/calculo
- Cache management
- Side effects

**Recomendacao:** Separar em camadas: `services/` (API calls), `hooks/` (state), `utils/` (transformacoes).

---

## 6. ROADMAP DE CORRECOES

### Sprint 1 - Seguranca Critica (1-2 dias)

| # | Acao | Arquivo | Esforco |
|---|------|---------|---------|
| 1 | Remover .env do git | `.env` | 15min |
| 2 | Corrigir CORS | `_shared/cors.ts` | 30min |
| 3 | Corrigir Open Redirect | `track-link/index.ts` | 1h |
| 4 | Corrigir SSRF | `webhook-dispatch/index.ts`, `bitrix24-sync/index.ts` | 2h |
| 5 | Corrigir CSP | `_shared/security-headers.ts` | 30min |
| 6 | Habilitar JWT em funcoes sensiveis | `supabase/config.toml` | 30min |

### Sprint 2 - Seguranca Alta (3-5 dias)

| # | Acao | Arquivo | Esforco |
|---|------|---------|---------|
| 7 | Hardening Nginx | `nginx.conf` | 1h |
| 8 | Corrigir XSS em fulltext search | `use-fulltext-search.ts` | 1h |
| 9 | Filtrar realtime por user_id | `use-realtime-notifications.ts` | 2h |
| 10 | RLS mais restritiva | Migracoes SQL | 2h |
| 11 | Adicionar constraints FK | Migracoes SQL | 1h |

### Sprint 3 - Performance (1 semana)

| # | Acao | Arquivo | Esforco |
|---|------|---------|---------|
| 12 | Resolver N+1 em campaigns | `use-campaigns.ts` | 4h |
| 13 | Corrigir race conditions | `useEmailSequences.ts`, `track-link` | 3h |
| 14 | Adicionar paginacao | Varios hooks | 4h |
| 15 | Indexes compostos | Migracoes SQL | 1h |

### Sprint 4 - Qualidade (2 semanas)

| # | Acao | Esforco |
|---|------|---------|
| 16 | TypeScript strict mode | 3-5 dias |
| 17 | Separar hooks em services | 3 dias |
| 18 | Testes de integracao | 5 dias |
| 19 | Deploy real no CI/CD | 1 dia |

---

## 7. BENCHMARKING

| Aspecto | FUXICO | Padrao Mercado | Status |
|---------|--------|----------------|--------|
| Autenticacao MFA | Sim (TOTP) | TOTP + WebAuthn | Parcial |
| Rate Limiting | Em memoria | Redis/distribuido | Abaixo |
| CSP Headers | unsafe-inline | Nonces/Hashes | Abaixo |
| HSTS | Ausente | max-age=31536000 | Ausente |
| RLS Policies | Presentes | Presentes + validacao | Parcial |
| Testes Cobertura | Unitarios | Unit + Integration + E2E | Parcial |
| CI/CD Pipeline | Lint+Test+Build | + Deploy + SAST + DAST | Parcial |
| Monitoramento | Sentry | Sentry + APM + Alertas | Parcial |
| Code Splitting | Manual chunks | Dynamic imports | Adequado |
| i18n | 3 idiomas | Adequado | Adequado |

---

## 8. PONTOS POSITIVOS

- Arquitetura bem organizada com separacao de componentes
- RLS habilitado em todas as tabelas
- Validacao com Zod em Edge Functions
- CI/CD com CodeQL, Lighthouse e bundle size
- Internacionalizacao (pt-BR, en, es)
- Chrome Extension com Manifest V3
- Web Vitals monitoring
- Login lockout com backoff exponencial
- HMAC signature em webhooks (quando secret configurado)
- Chunking manual otimizado no Vite config

---

## 9. CORRECOES IMPLEMENTADAS (4 Rounds)

### Round 1 - Seguranca Critica (14 arquivos)
- `.env` removido do git tracking
- CORS: wildcard `chrome-extension://` removido
- Open Redirect bloqueado com `url-validator.ts`
- SSRF bloqueado em webhook-dispatch + bitrix24-sync
- CSP: `unsafe-inline`/`unsafe-eval` removidos
- JWT habilitado em 9 edge functions
- N+1 eliminado em useCampaigns (batch queries)
- Race conditions: RPCs atomicas (click count, enrollment)
- XSS em fulltext search corrigido
- Nginx hardened (HSTS, CSP, Permissions-Policy)
- Migracao SQL: RPCs, constraints, indexes, FKs

### Round 2 - Auth e Ownership (11 arquivos)
- send-push-notification: verificacao de ownership
- generate-signed-document: filtro user_id + hash hex
- cleanup-security-data: cron secret auth
- 6 hooks: ownership checks em CRUD mutations
- Sentry inicializado em main.tsx
- PrivateRoute auth guard em rotas protegidas
- docker/nginx.conf sincronizado
- Coverage threshold no vitest (60%)

### Round 3 - LLM e HTML Injection (8 arquivos)
- LLM Prompt Injection: sanitizador + detector + wrapUserInput
- HTML Injection: sanitizador de email
- send-mass-email + send-batch-emails: HTML sanitizado
- process-sequences: CORS via shared module + cron auth + body sanitizado
- verify-custom-domain: token UUID completo (128 bits)
- JSON.parse protegido em respostas de LLM

### Round 4 - Validacao e Bugs (7 arquivos)
- SafeMetadataSchema: substitui z.record(z.unknown()) em 3 funcoes
- track-pixel: fix self-open detection (comparava IP com email)
- track-document: valida existencia antes de inserir evento
- use-webhook: validacao de URL + remocao de no-cors

### Round 5 - Validacao e Race Conditions (7 arquivos)
- zapier-webhook: SafeMetadataSchema + UUID enforcement
- vote-poll: SafeMetadataSchema + atomic vote counting via RPC
- totp: backup code entropy 32 bits -> 64 bits per code
- create-watermarked-pdf: strip HTML/SVG tags from watermark text
- use-bounce-alerts: batch existing alerts check (1 query vs N+1)
- use-email-templates: fresh DB read for incrementUsage (prevent stale cache)

### Round 6 - Final Hardening (5 arquivos)
- webhook-dispatch: SafeMetadataSchema replacing z.record(z.any())
- bitrix24-sync: typed data schema (primitives only)
- use-scheduled-reports: email validation + duplicate check + ownership

### Totais
- **6 commits, 50+ arquivos alterados, ~1700+ linhas de correcoes**
- **6 modulos compartilhados criados** (url-validator, html-sanitizer, llm-sanitizer, schemas, PrivateRoute, SafeMetadataSchema)
- **2 migracoes SQL** com RPCs atomicas, constraints e indexes
