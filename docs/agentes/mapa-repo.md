# Mapa do repositório — referência para agentes

Ler quando precisar saber onde fica algo antes de buscar por texto.

## Onde olhar primeiro

| Precisa de                                   | Leia                                                                                                                                                                                                         |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Regras de trabalho, banco, Git, deploy       | `AGENTS.md` + `docs/agentes/*.md` (esta pasta)                                                                                                                                                               |
| Índice da documentação técnica               | `docs/README.md`                                                                                                                                                                                             |
| O que o produto faz e quais são as entidades | `docs/agentes/regras-dominio.md`                                                                                                                                                                             |
| Por que a CI está vermelha                   | `docs/agentes/github-ci.md`                                                                                                                                                                                  |
| Qual banco é o oficial                       | `docs/agentes/banco.md`                                                                                                                                                                                      |
| Contrato de API das edge functions           | `docs/API-REFERENCE-COMPLETE.md`, `docs/openapi.yaml`, `docs/swagger.json`                                                                                                                                   |
| Decisões de arquitetura                      | `docs/adr/` (001 Supabase, 002 edge functions, 003 testes, 004 hardening, 005 state, 006 validação, 007 retenção)                                                                                            |
| Operação (incidente, rollback, DR, SLO)      | `docs/RUNBOOK.md`, `docs/ROLLBACK.md`, `docs/DR_PLAN.md`, `docs/SLO.md`, `docs/TROUBLESHOOTING.md`                                                                                                           |
| Histórico, auditorias, planos antigos        | `SYSTEM_AUDIT.md`, `SYSTEM_AUDIT_ENTERPRISE.md`, `SCORECARD_22_DIMENSIONS.md`, `UX_STRATEGY_PERFECTION.md`, `docs/AUDITORIA-*`, `docs/FUXICO-*`, `docs/IMPLEMENTACAO-*` — **contexto, não fonte de verdade** |

`README.md` está desatualizado em pontos verificáveis (fala em "Edge Functions (14)" quando há 52) — trate
como apresentação, não como inventário.

## Mapa rápido

| Onde                                                        | O que tem                                                                                                                                                                                         |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/`                                                      | front Vite + React + TS. `App.tsx` tem o router inline (não há `router.tsx`)                                                                                                                      |
| `src/components/` (168 arq.)                                | UI: `admin/`, `auth/`, `dashboard/`, `landing/`, `navigation/`, `onboarding/`, `ui/` (primitivos shadcn)                                                                                          |
| `src/pages/` (22)                                           | 18 páginas de rota + `permissions/`                                                                                                                                                               |
| `src/features/` (25)                                        | módulos por domínio: `audit/`, `crm/`, `security/`, `sequences/`, `tracking/`                                                                                                                     |
| `src/hooks/` (50)                                           | hooks de dados/UI `use-*.ts` + barrel `index.ts`                                                                                                                                                  |
| `src/lib/` (15)                                             | `admin-rpc.ts`, `auth-guards.ts`, `mfa-state-machine.ts`, `logger.ts`, `otel.ts`, `sentry.ts`, `upstash-cache.ts`, `theme.tsx`, `web-vitals.ts`, `secure-random.ts`, `br-formats.ts`, `utils.ts`… |
| `src/contexts/`                                             | `AuthContext.tsx`, `AccessibilityContext.tsx` (+ os `*-context.ts` com o contexto puro)                                                                                                           |
| `src/integrations/`                                         | `supabase/{client.ts, types.ts (gerado), previewAuthStorage.ts}` e `lovable/index.ts`                                                                                                             |
| `src/schemas/`                                              | Zod: `security.ts`, `tracking.ts`                                                                                                                                                                 |
| `src/i18n/`                                                 | `i18next` + locales `pt-BR`, `en`, `es`                                                                                                                                                           |
| `src/__tests__/` (72)                                       | suíte Vitest **centralizada**: `business/`(26), `hooks/`(14), `security/`(10), `design/`(10), `lib/`(7), `services/`(2), `components/`(2), `features/`(1)                                         |
| `src/test/`                                                 | `setup.ts` + `mocks/{supabase,react-query}.ts`                                                                                                                                                    |
| `supabase/functions/`                                       | 52 edge functions Deno + `_shared/` (14 módulos: segurança, CORS, rate limit, Zod, sanitizers, OTel)                                                                                              |
| `supabase/migrations/`                                      | 209 `.sql` (a maioria `<timestamp>_<uuid>` herdada do Lovable)                                                                                                                                    |
| `supabase/tests/rls/`                                       | 9 testes pgTAP de RLS/RPC — nenhum workflow os roda                                                                                                                                               |
| `e2e/`                                                      | 5 specs Playwright (`auth.setup.ts`, `accessibility`, `critical-flows`, `dashboard`, `visual`)                                                                                                    |
| `chrome-extension/`                                         | extensão MV3 do Gmail, JS puro, sem build — ver `docs/agentes/extensao-chrome.md`                                                                                                                 |
| `scripts/`                                                  | `generate-pdf.ts`, `seed-staging.ts`, `seed-test-data.sql`, `seed-via-mcp.py`, `check-security.sh`, `ci/`, `graphify/`                                                                            |
| `infra/terraform/`                                          | template Terraform (backend S3 `fuxico-tfstate` + DynamoDB lock, providers supabase/cloudflare/github) — **nenhum workflow roda `apply`**                                                         |
| `docker/`, `Dockerfile`, `docker-compose.yml`, `nginx.conf` | caminho de self-host (node:20-alpine → nginx:alpine, uid 1001, `HEALTHCHECK /health`; compose expõe `3000:80` + `redis:7-alpine`) — **nenhum workflow builda a imagem**                           |
| `observability/alerts.yml`                                  | alertas declarativos (canais Slack e PagerDuty) — declarativo, nada no código dispara PagerDuty                                                                                                   |
| `loadtests/`, `tests/load/`                                 | k6: `performance.js`, `chaos.js`, `chaos-extended.js`, `track-endpoints.k6.js`                                                                                                                    |
| `public/_redirects`                                         | **proxy público de tracking** → edge functions (sintaxe de redirect com status 200)                                                                                                               |

## Comandos

O repo usa **npm** (`package-lock.json` versionado; `npm ci` nos workflows). Existem **também** `bun.lock`
e `bun.lockb` versionados e `bun` é usado em 3 jobs (`audit` do `ci.yml`, `bundle-size.yml`,
`supabase-codegen.yml`); `CONTRIBUTING.md` fala em `bun run`. Não há `packageManager` nem `engines` no
`package.json`. **Para instalar dependências, siga a CI: `npm ci`.** Node 20 (`.nvmrc` = 20.10.0).

**`bun.lock` gravemente desatualizado:** diverge em **≥68 pacotes** do `package-lock.json`, incluindo
vários saltos de versão major (confirmado por auditoria de diff entre os dois lockfiles). O job
`bundle-size.yml` roda `bun install --frozen-lockfile` e constrói com esses pacotes defasados — os
resultados de tamanho de bundle não refletem o estado real de `package.json`.

**Tailwind v4 parcialmente quebrado:** `@tailwindcss/postcss` foi adicionado ao `package.json` e ao
`postcss.config.js` para resolver o erro de plugin PostCSS, mas `npm run build` **e `npm run dev`**
continuam falhando com HTTP 500 porque `tailwind.config.ts` usa a API de configuração JS do v3
(`theme.extend.colors`, plugins) que o engine v4 não lê. A migração real requer substituir
`tailwind.config.ts` + as diretivas `@tailwind base/components/utilities` em `src/index.css` pela
sintaxe CSS-first do v4 (`@import "tailwindcss";` + `@theme {}`) — trabalho com impacto visual que
precisa de QA e é item de **chame o dono**.

- unit só do que você tocou: `npx vitest run <caminho>` (include do Vitest:
  `src/**/*.{test,spec}.{ts,tsx}`, env jsdom, setup `src/test/setup.ts`);
- typecheck: **use sempre `npx tsc --noEmit -p tsconfig.app.json`** (`strict: true`,
  `strictNullChecks: true`). `npm run typecheck` (`tsc --noEmit` sem `-p`) é **no-op silencioso**:
  `tsconfig.json` raiz tem `"files": []` e só `"references"`, então o compilador verifica zero arquivos
  e sai com código 0 qualquer que seja o estado do código. Há **84 erros de TS pré-existentes** em
  `tsconfig.app.json` que esse atalho esconde — verificados com `typescript@5.9.3`, todos anteriores às
  correções desta sessão e não relacionados ao downgrade de versão;
- lint dos arquivos tocados: `npx eslint <arquivos>`; formato: `npm run format:check`;
- E2E: `npm run test:e2e` **não coleta nada hoje** — `playwright.config.ts:16` tem
  `testDir: './e2e/tests'` e essa pasta não existe; as specs estão em `e2e/`. Rodar qualquer config
  Playwright (incluindo `playwright-visual.config.ts`) falha com crash ESM em `e2e/auth.setup.ts:3`
  (`__dirname is not defined in ES module scope`) porque o arquivo usa CJS num projeto `"type":"module"`;
  não há forma de rodar specs individualmente sem antes corrigir esse crash;
- edge function (Deno): `deno test --allow-env --allow-net --allow-read supabase/functions/<fn>/index_test.ts`
  (há 21 `index_test.ts`; as tasks de `supabase/functions/deno.json` apontam para `_shared/*.test.ts`, que
  **não existem**, então `deno task test` passa sem testar nada);
- guard das instruções de agentes: `node scripts/ci/check-claude-md-integrity.mjs`;
- hooks do husky: `pre-commit` (`npx lint-staged`: eslint --fix + prettier nos arquivos staged) e
  `commit-msg` (`commitlint`). **Não use `--no-verify`** — era regra do AGENTS antigo e burla os dois.

### Portas (as três divergem — confira antes de testar tela)

| Onde                                                                             | Porta                   |
| -------------------------------------------------------------------------------- | ----------------------- |
| `vite dev` (`vite.config.ts:11-13`)                                              | **8080** (`host: "::"`) |
| `playwright.config.ts:12` (`baseURL` default) e `webServer.command: npm run dev` | **5173**                |
| `ci.yml` job `e2e` (`PLAYWRIGHT_BASE_URL`)                                       | **4173**                |

## Automações (`scripts/`)

Hoje `scripts/` tem arquivos soltos e **nenhum `README`**. Para automação nova: `scripts/<nome>/` com
`README.md` dizendo o que faz, como rodar e que secrets usa. Scripts em `scripts/`; a saída deles em
`docs/` — nunca misturar. Não use `supabase/scripts` (o CLI do Supabase é dono de `supabase/`) nem
`src/scripts` (entra no bundle). Leia o README da automação antes de alterar.

Estado dos scripts existentes (verificado):

- `scripts/generate-pdf.ts` — **placeholder**: copia os primeiros 500 caracteres de
  `SYSTEM_AUDIT_ENTERPRISE.md` para um "`.pdf`" que é texto puro. Roda no `ci.yml` e **commita na `main`**.
- `scripts/seed-staging.ts` — importa `@faker-js/faker`, que **não está no `package.json`** → não roda.
- `scripts/seed-via-mcp.py` — tem URL de Worker **com segredo em claro** na linha 11; não reutilize.
- `scripts/check-security.sh` — checagem de pré-deploy; **nenhum workflow a chama**.
- `scripts/ci/check-claude-md-integrity.mjs` — guard GA02 (ver `github-ci.md`).
- `scripts/graphify/setup.sh` — instala o grafo de código (abaixo).

## Grafo de código (graphify) — detalhes

`bash scripts/graphify/setup.sh`; precisa de `uv` ou `pipx`. `graphify-out/` e os hooks que o graphify
grava em `.husky/` ficam no `.gitignore`: cada clone gera o seu. Frescura: compare
`git rev-parse --short HEAD` com a linha "Built from commit" de `graphify-out/GRAPH_REPORT.md`; se
divergir, `graphify update .` (só AST, sem custo de API). Os hooks `PreToolUse` de `.claude/settings.json`
chamam `graphify hook-guard` e não fazem nada onde o graphify não estiver instalado. Em sessão de nuvem,
`.claude/hooks/session-start.sh` instala o graphify e gera o grafo em segundo plano (~3 min; log em
`graphify-out/.session-start.log`; pula se o grafo já é do commit atual).
