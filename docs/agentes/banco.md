# Banco de dados — referência para agentes

Ler quando for rodar SQL, criar/aplicar migration, montar Postgres local ou auditar RLS.
Resumo das regras no `AGENTS.md`; aqui está o detalhe. Errar o banco neste repo é fácil: há **três**
project refs diferentes no código.

## Qual é o banco — ainda não resolvido

| ref | onde aparece (arquivo:linha) | o que isso significa |
|---|---|---|
| **`xmyvefffgltlrobazrmg`** | `supabase/config.toml:1` (`project_id`) | é o alvo de qualquer comando `supabase` CLI rodado na raiz |
| **`blopallcxuotfutblkoe`** | `public/_redirects:6` e `:7` (proxy público de tracking), `.github/workflows/load-test.yml` (fallback de `BASE_URL`), `supabase/functions/mcp-query/index.ts:5` (comentário de deploy), 1 migration | é o ref que **recebe tráfego real de pixel/clique** em produção |
| **`npjfwzzapbtcguoupozd`** | `chrome-extension/config.js:10` (`SUPABASE_URL`) e `:11` (anon key JWT commitada), `index.html:43-44` (`preconnect`/`dns-prefetch`), `SYSTEM_AUDIT.md` | é o ref que a **extensão do Gmail** e o preconnect do HTML usam |

O front **não** tem ref hardcoded: `src/integrations/supabase/client.ts:7-8` lê `VITE_SUPABASE_URL` e
`VITE_SUPABASE_PUBLISHABLE_KEY` do ambiente — ou seja, o banco que o dashboard usa depende das env vars
do Vercel, que não são legíveis com o token desta sessão (**NÃO VERIFICADO**).

**Regra:** antes de qualquer SQL, migration ou deploy de edge function, **confirme com o dono qual ref é o
oficial**. Não deduza pelo `config.toml`: ele não é o ref que atende o tracking em produção.

## MCP para SQL — não existe para este projeto

Os MCPs Supabase carregados nas sessões atuais são de **outros** projetos:

| MCP | ref | papel |
|---|---|---|
| `SUPABASE - GESTÃO DE CLIENTES` | `pgxfvjmuubtbowutlide` | CRM de outro sistema |
| `SUPABASE - GESTÃO DE PRODUTOS` | `doufsxqlfjyuvxuezpln` | Catálogo de outro sistema |
| `SUPABASE - ZAPP WEB V2 - MCP` | `tnnnlkbymytvtqngbbqh` | banco do Zapp Web V2 |

Verificado nesta sessão por `get_project_url` nos dois primeiros. **Nunca** rodar `apply_migration`,
`execute_sql` de escrita ou `deploy_edge_function` neles a partir deste repo — nome parecido não é o mesmo
projeto. Sem MCP do Fuxico, diagnóstico de banco depende do painel do Supabase ou de um MCP novo: peça ao
dono em vez de improvisar.

Existe ainda um caminho próprio de SQL: a edge function `supabase/functions/mcp-query/` é um proxy
`service_role` para um Worker Cloudflare (`MCP_SECRET` nas edges). `scripts/seed-via-mcp.py:11` tem a URL
desse Worker **com um segmento-segredo em claro no path** — não reutilize essa URL em resposta, log ou PR.

## Estado do schema

| O que | Valor | Evidência |
|---|---|---|
| Tabelas | **122** | bloco `Tables` de `src/integrations/supabase/types.ts` |
| Views | **7** (`admin_cache_hit_ratio`, `admin_cron_status`, `admin_partition_coverage`, `admin_slow_queries`, `admin_table_health`, `email_stats_mv`, `tracking_events_monthly_agg`) | bloco `Views` do mesmo arquivo |
| Funções | **123** | bloco `Functions` do mesmo arquivo |
| Migrations | **209** `.sql` | `ls supabase/migrations/*.sql \| wc -l` |
| Testes de RLS | **9** arquivos pgTAP | `supabase/tests/rls/*.test.sql` |
| Seed oficial | **não existe** (`supabase/seed.sql` ausente) | seeds avulsos em `scripts/seed-*` |

`src/integrations/supabase/types.ts` é **gerado** (`supabase gen types`) pelo workflow
`supabase-codegen.yml` — não edite à mão. Esse workflow **falha todos os dias** (ver
`docs/agentes/github-ci.md`), então os tipos no repo podem estar atrasados em relação ao banco.

Tabelas particionadas aparecem com sufixo `_default` nos tipos (`audit_logs_default`,
`login_attempts_default`, `rate_limit_logs_default`, `security_events_default`,
`tracking_events_default`) — a partição `_default` é parte do schema, não tabela órfã. Há cobertura de RLS
específica para partições em `supabase/tests/rls/partition-rls-coverage.test.sql`.

## Regras de migration

1. **Ordem obrigatória: arquivo → PR → merge em `main` → deploy do código → apply.** Nunca DDL a partir
   de branch aberta. `REVOKE`, `DROP`, rename ou mudança de contrato de função usada pelo front/edges:
   nunca antes do deploy do código correspondente.
2. **Versão sem colisão:** antes de criar arquivo, no mesmo turno: `ls supabase/migrations | tail`, e busca
   de PRs abertas tocando `supabase/migrations/` (`github_graphql`). A maioria dos nomes é
   `<timestamp>_<uuid>.sql` (herança do Lovable); arquivo novo escrito à mão usa
   `<AAAAMMDDHHMMSS>_<slug_descritivo>.sql`, como `20251219171600_rls_security_update.sql`.
3. Migration destrutiva, rotação de chave ou mudança de `service_role`: **só com o dono**.
4. Toda tabela nova nasce com **RLS habilitado + policy explícita + GRANT explícito** e com caso em
   `supabase/tests/rls/` — `all-tables-coverage.test.sql` e `policy-conformance.test.sql` existem
   justamente para pegar tabela sem policy. **Nenhum workflow roda esses testes hoje** (`supabase test db`
   não aparece em `.github/`): rodar é manual, e a falta de CI não dispensa o teste.
5. Não existe ledger próprio nem guard de drift neste repo (não há `scripts/db-audit/`): a verdade é o
   banco ao vivo. Confirme o estado real por `pg_get_functiondef` / `pg_indexes` / `pg_policies` antes de
   afirmar que algo foi aplicado.

## Edge functions e autorização

**52 funções** em `supabase/functions/` (52 diretórios, 52 blocos `[functions.*]` em
`supabase/config.toml`), **todas com `verify_jwt = false`**. Não há verificação de JWT na borda: cada
função precisa validar sozinha. Os módulos compartilhados que fazem isso estão em
`supabase/functions/_shared/` (14 arquivos): `security-middleware.ts`, `ip-whitelist.ts`, `rate-limit.ts`,
`cors.ts`, `security-headers.ts`, `url-validator.ts`, `schemas.ts` (Zod), `html-sanitizer.ts`,
`llm-sanitizer.ts`, `circuit-breaker.ts`, `env.ts`, `logger.ts`, `otel.ts`, `tracking-inject.ts`.

Função nova **sem** `security-middleware`/`ip-whitelist` fica aberta na internet. Públicas por design
(documentado no cabeçalho de cada arquivo): `track-pixel`, `track-link`, `track-beacon`,
`track-document`, `track-standalone-link`, `unsubscribe`, `vote-poll`, `webhook-dispatch`,
`zapier-webhook`, `get-config`. Qualquer outra que não valide autorização é bug.

Funções com `service_role` que **precisam** de checagem de papel: `admin-rpc` (valida JWT + `has_role`
antes de chamar `admin_*`), `mcp-query`, `refresh-stats`, `ab-test-dispatch` (cron), `process-sequences`,
`process-scheduled-reports` (`CRON_SECRET` ou admin), `webhook-retry-worker`, `cold-archive-verifier`.

## Ambiente local

- O front sem `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` não sobe: `createClient` recebe
  `undefined` (`src/integrations/supabase/client.ts:13`). **Não há desvio para Supabase local** neste repo
  (nenhuma variável `*_LOCAL_*`): o `npm run dev` aponta para o que estiver no `.env`, inclusive produção.
- `.env.example` documenta `VITE_SUPABASE_ANON_KEY`, que **o código não lê** — ver a divergência em
  `docs/agentes/vercel-deploy.md`.
- Teste de comportamento de banco: Postgres descartável. Nunca "testar" escrevendo em produção.
