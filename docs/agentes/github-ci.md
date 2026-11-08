# GitHub (perímetro, CI, workflows) — referência para agentes

Ler quando mexer em settings do repo, `.github/workflows/`, ou quando um merge ou um workflow falhar de
forma estranha.

## Escrita no GitHub

- Repo `adm01-debug/Fuxico_V2` (grafia canônica; a API aceita `fuxico_v2`), branch `main`, **privado**,
  licença MIT, linguagem TypeScript.
- **Escrita: somente MCP `GITHUB - MCP - FOREVER`** (`github_push_files`). O MCP padrão do GitHub retorna
  403 em write. `github_push_files` sobrescreve o arquivo — mande o conteúdo integral com apenas a mudança
  semântica, e confira depois que o arquivo remoto bate com o que você testou. Ele aceita `files` e
  `delete` no mesmo commit (1 commit atômico).
- Commits: `<tipo>(<escopo>): <assunto>` sem ponto final, cabeçalho ≤ 100 caracteres; tipos do
  `@commitlint/config-conventional` (`commitlint.config.js`): `build chore ci docs feat fix perf refactor
  revert style test`. Não há tipo `infra`. Hooks do husky: `.husky/pre-commit` → `npx lint-staged`,
  `.husky/commit-msg` → `npx --no-install commitlint --edit "$1"`. Via MCP o hook não roda — siga o padrão
  mesmo assim.
- Para listar PRs abertas com os arquivos que tocam numa chamada só, use `github_graphql`
  (`pullRequests(states:OPEN){ nodes { number files { nodes { path } } } }`):
  `github_list_pull_requests` devolve o repositório inteiro em cada nó e estoura o contexto.

## Perímetro do GitHub — estado canônico

**Regra:** qualquer mudança nos campos abaixo atualiza **esta tabela** no mesmo PR.

| Campo | Estado verificado (2026-11-08) | Como foi verificado |
|---|---|---|
| Branch protection em `main` | **não existe** | `github_get_branch_protection` → 404 `"Branch not protected"` |
| Rulesets | **nenhum** | `github_list_rulesets` → `[]` |
| Required checks | **nenhum** — nada bloqueia merge | consequência das duas linhas acima |
| Merge | `allow_squash_merge=true` · `allow_merge_commit=true` · `allow_rebase_merge=true` · `allow_auto_merge=false` · `delete_branch_on_merge=false` · `allow_update_branch=false` | `github_get_repo` |
| Squash | `squash_merge_commit_title=COMMIT_OR_PR_TITLE` · `squash_merge_commit_message=COMMIT_MESSAGES` | `github_get_repo` |
| Environments | **2**: `production` e `Preview` — ambos **sem** regra de proteção e `can_admins_bypass=true` | `github_list_environments` |
| Secrets do repo | **4**: `E2E_TEST_EMAIL`, `E2E_TEST_PASSWORD`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL` | `github_list_actions_secrets` |
| Secrets do environment `production` | **0** | `github_list_environment_secrets` |
| Branches remotas | `main` **e `master`** + 10 branches do Dependabot | `git ls-remote --heads origin` |

Como o repo é privado, `raw.githubusercontent.com` **não** funciona sem token: leia por
`github_get_file`/`github_get_content` ou pelo clone da sessão.

### Secrets referenciados pelos workflows que NÃO existem

Isto é a causa de vários jobs "verdes por acidente" ou vermelhos:

`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (`ci.yml`, `deploy.yml`), `SUPABASE_PROJECT_REF`
e `SUPABASE_ACCESS_TOKEN` (`deploy.yml`, `supabase-codegen.yml`), `SUPABASE_PROJECT_ID`
(`supabase-codegen.yml`), `CODECOV_TOKEN` (`ci.yml`, `test.yml`), `LOAD_TEST_BASE_URL`
(`load-test.yml`), `VITE_SUPABASE_ANON_KEY` (`ci.yml`, `deploy.yml`).

Nenhum deles está na lista de 4 secrets do repo nem no environment `production`. Consequência verificada:
`Supabase Types Codegen` falha em **todo** agendamento diário, `Load Test` falha no agendamento semanal.
Não "conserte" adicionando secret: secret é item de **chame o dono**.

## Estado real da CI — vermelha, e o motivo é um só

Último run de `ci.yml` (run `41483561948`, PR do Dependabot, 2026-11-02): `Lint & Type Check` **failure**;
`Unit Tests`, `Build`, `Security Scan`, `E2E Tests`, `Bundle Size Check`, `Lighthouse`, `Deploy` todos
**skipped** (dependem do `lint`).

Causa raiz, no log do job: `npm ci` aborta com `npm error code ERESOLVE` —
`typescript@^7.0.2` em `devDependencies` da raiz contra `peerOptional typescript@"^5"` de
`i18next@25.8.18`. **Todo job que roda `npm ci` morre aí**: `lint.yml`, `test.yml`, `ci.yml`, `deploy.yml`,
`release.yml`. É herança da `main`, não regressão de quem abrir PR hoje — registre em "Próximos passos" e
não empilhe patch em cima.

Também vermelhos por conta própria nos agendamentos: `Security Scan` (semanal), `CodeQL Analysis`
(semanal), `Supabase Types Codegen` (diário), `Load Test` (semanal). `Dependency Audit` passa.

## Workflows — 12 arquivos em `.github/workflows/`

| arquivo | `name:` | gatilho | o que faz de fato |
|---|---|---|---|
| `ci.yml` | CI/CD Pipeline | push/PR em `main`, `develop` | `audit` (bun, `scripts/generate-pdf.ts`, **commita na `main`** o relatório e o README), `lint` (`npm ci` + `npm run lint` + `npm run typecheck` + guard GA02 das instruções de agentes), `test` (coverage + Codecov), `build` (artifact `dist`), `bundle-size` (`continue-on-error`), `security` (CodeQL), `lighthouse` (só PR, `continue-on-error`), `e2e` (só PR), `deploy` (Vercel + `curl https://fuxico.app/health`) |
| `lint.yml` | Lint | push/PR `main`, `develop` | duplica `lint` do `ci.yml` + `format-check` (`prettier --check "src/**/*.{ts,tsx,css}"`) |
| `test.yml` | Tests | push/PR `main`, `develop` | duplica `test` e `e2e` do `ci.yml` |
| `deploy.yml` | Deploy | push `main`, dispatch | `deploy` (Vercel `--prod`) + `deploy-functions` (**`supabase functions deploy` de TODAS as 52 funções**) |
| `audit.yml` | Dependency Audit | cron `0 0 * * 1`, push em `package-lock.json` | `npm audit --audit-level=high` (`continue-on-error`), `npm outdated`, abre issue em falha |
| `bundle-size.yml` | Bundle Size | PR em `src/**`, `package.json`, `vite.config.ts`, `bundlesize.config.json` | `bun install --frozen-lockfile` + `bun run build` + `bunx bundlesize` — **sem `continue-on-error`, logo bloqueante de fato** |
| `changelog.yml` | Changelog | push `main` (ignora `CHANGELOG.md`), `release: published` | `git-cliff` com `cliff.toml`, commita `docs: update changelog [skip ci]` |
| `codeql.yml` | CodeQL Analysis | push/PR `main`, cron `0 0 * * 0` | CodeQL javascript/typescript |
| `load-test.yml` | Load Test (k6) | PR em `supabase/functions/track-open/**`, `track-click/**`, `tests/load/**`; cron `0 6 * * 1`; dispatch | k6 em `tests/load/track-endpoints.k6.js`, comenta p95 no PR |
| `release.yml` | Release | tag `v*`, release | build + `softprops/action-gh-release` com `dist/**` |
| `security.yml` | Security Scan | push/PR `main`, cron `0 0 * * 0` | `npm audit`, Trivy (SARIF), `trufflehog --only-verified` |
| `supabase-codegen.yml` | Supabase Types Codegen | cron `0 6 * * *`, dispatch | `supabase gen types` → commita `src/integrations/supabase/types.ts` como `fuxico-bot` |

Pontos que já custam retrabalho:

- **Deploy duplicado:** `ci.yml` (job `deploy`) e `deploy.yml` disparam no **mesmo** push para `main`, os
  dois com `amondnet/vercel-action --prod`. Mexer em um sem o outro deixa o repo inconsistente.
- **`ci.yml` escreve na `main`:** o job `audit` commita `SYSTEM_AUDIT_ENTERPRISE.md`,
  `docs/SYSTEM_AUDIT_ENTERPRISE_V3.md`, o `.pdf` e o `README.md` com `[skip ci]`. Se você editar esses
  arquivos, espere que o bot os reescreva.
- **Cobertura duplicada:** lint/typecheck em `ci.yml` **e** `lint.yml`; testes em `ci.yml` **e** `test.yml`;
  CodeQL em `ci.yml` **e** `codeql.yml`. Um fix de lint precisa passar nos dois.
- **`supabase functions deploy` sem nome de função** implanta as 52 de uma vez — rollback de uma só não
  existe nesse caminho.
- **`.secret-scan.yml` é decorativo:** nenhuma ferramenta o lê (grep em `.github/`, `.husky/`, `scripts/`
  sem resultado). O scan real é o `trufflehog --only-verified` do `security.yml`. E
  `scripts/check-security.sh` **não é chamado por nenhum workflow**.
- **`CODEOWNERS` não existe**; não há composite action em `.github/actions/`.
- **Dependabot** (`.github/dependabot.yml`): npm semanal (segunda), limite 10 PRs, grupos `react`,
  `radix`, `tanstack`, `supabase`, `dev-dependencies`, prefixo `chore(deps)`; `github-actions` semanal.
  Por isso há sempre PRs abertas em `package.json`/`package-lock.json`: **não toque nesses dois arquivos**
  sem avisar o dono.

## Guards que você pode rodar antes do PR

- `node scripts/ci/check-claude-md-integrity.mjs` — GA02: exige as 8 seções do `AGENTS.md` e barra o
  conjunto `AGENTS.md` + `CLAUDE.md` + `docs/agentes/*.md` encolher >30% (ou >50% em um arquivo só) em
  relação à `main`. Roda no job `lint` do `ci.yml`. Mexeu em instruções de agente → rode antes de abrir a PR.
- `npm run typecheck`, `npx eslint <arquivos>`, `npx vitest run <caminho>`, `npm run format:check`.
