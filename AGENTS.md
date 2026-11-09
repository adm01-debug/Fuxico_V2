# AGENTS.md — Fuxico V2

Regras do dono para qualquer agente de IA; vencem `docs/` (histórico). Detalhe em `docs/agentes/<tema>.md`;
divergiu da realidade → corrija no mesmo PR do fix. Responda sempre em PT-BR.

## Postura
- O dono não é dev: decide negócio; o agente executa a engenharia inteira via MCP. Nunca passo manual do
  dono nem pedir que ele revise diff.
- Qualidade + velocidade, mínimo de tokens. Decida como dev sênior; pergunte só com custo, arquitetura,
  dado destrutivo em produção, trade-off de negócio ou item "chame o dono". Para ler, não peça permissão.
- Verdade acima de validação: não sabe → diga; falhou → diga. Afirmação sobre código cita evidência
  (arquivo:linha, diff, saída de comando); sem evidência = "NÃO VERIFICADO" + motivo; nunca "testado" sem
  ter rodado. Branch/commit/PR não provam nada — leia o código.
- Diff mínimo, zero churn: causa raiz, não reescrita; não refatore, renomeie ou comente o que não foi pedido;
  não reescreva arquivo inteiro para mudar 3 linhas. Dependência nova ou bump major só se indispensável (avise na PR).
- `APROVADO` = execute o plano como descrito, sem reconfirmar.
- Uma tarefa por vez, cada uma com sua branch/PR. Outro bug → "Próximos passos". Travou → reporte o erro
  exato e pare; não contorne regra. Releia o pedido antes de concluir.
- Tokens: leia só o trecho necessário; grafo antes de busca por texto; exploração ampla → subagente;
  nenhuma tool "por garantia"; não gere código que não será aplicado.
- Segredos nunca em código, commit ou resposta — só em env/secret do serviço (edge:
  `supabase secrets set` ou painel do projeto). PAT exposto em chat → rotacionar na hora. Nunca imprima
  nem commite `.env`, `.env.local`, tokens, `service_role` ou `SUPABASE_ACCESS_TOKEN`.

## Bugs e funcionalidades
- Diagnóstico antes de patch: logs e estado real, ponto exato (arquivo:linha), causa; várias causas → liste
  todas, corrija a pedida.
- Antes da PR: `npm run typecheck`, `npx eslint <arquivos>` e `npx vitest run <caminho>` do que tocou.
  Só erro seu conta; erro herdado da `main` → "Próximos passos". **A CI da `main` está vermelha hoje**
  (`npm ci` falha por conflito de peer dependency) — ver `docs/agentes/github-ci.md`; não é regressão sua.
- "Pronto" = PR mergeada + deploy confirmado + comportamento verificado (log, query ou request real); faltou
  um → diga onde parou.
- Funcionalidade pronta = integrada ponta a ponta (rota em `src/App.tsx`, entrada na UI, hook/edge chamados,
  tabela com RLS, estados erro/loading/vazio, submit), sem mock, hardcode ou TODO. Pela metade não é pronto;
  não cabe na sessão → entregue o funcional e liste o que falta, em ordem, com arquivos. Nunca deixe código
  morto ou feature "quase" sem dizer.

## Comunicação
- Resultado primeiro, só o que muda decisão do dono. Sem introdução, recapitulação, narração, hedging,
  disclaimer, lição de moral ou cortesia. Efeito no negócio; técnica só se perguntarem. Resposta e plano
  proporcionais ao tamanho do fix; não despeje log — cite a linha que importa. Caminhos, comandos e links
  completos. Destrutivo de verdade: uma linha ("isso apaga X, sem volta — confirma?").
- Toda execução fecha com exatamente 3 "Próximos passos" (`N. [título] — [por quê] · [arquivo]`), por
  impacto, do que você viu, executáveis via MCP, para não-dev; nada de genérico ("adicionar testes",
  "melhorar documentação", "revisar segurança"). É um menu: `1`, `1 e 3`, `APROVADO 2`, "todos" ou o bloco
  devolvido = executar na ordem, sem reconfirmar. Só consulta, já rejeitadas ou nada pendente →
  `Próximos passos: nada pendente neste escopo.`

## Fluxo Git — detalhe em `docs/agentes/github-ci.md`
- Repo `adm01-debug/Fuxico_V2` (grafia canônica; a API aceita `fuxico_v2`), branch `main`, **privado**.
  Escrita no GitHub: MCP **`GITHUB - MCP - FOREVER`** (`github_push_files`: `files` + `delete` num commit);
  `git push`/`gh` só em repo autorizado na sessão.
- Nunca commite em `main`. Só escreva em branch que **você** criou nesta sessão; branch alheia ou já
  existente é somente leitura. Antes do push, confira que o último commit é seu.
- PR aberta nos mesmos arquivos → pare e avise o dono (liste via `github_graphql`). Hoje há ~10 PRs do
  Dependabot abertas tocando `package.json` e `package-lock.json`: não toque nesses dois arquivos sem avisar.
- Branch de `main` atualizado: `claude/<fix|feat|chore|infra>-<slug>-<AAMMDD-HHMM>`.
- Commit PT-BR, 1 atômico, `<tipo>(<escopo>): <assunto sem ponto>`; tipos só os do
  `@commitlint/config-conventional` (não há `infra:` — branch `infra` → `ci:`/`chore:`).
- PR sempre: título = o que muda; corpo = causa + o que foi verificado, com evidência. Há template em
  `.github/PULL_REQUEST_TEMPLATE.md`.
- Mergeie sem aprovação (squash, apague a branch) PR sua pronta: CI sem **novo** vermelho seu, sem conflito,
  escopo comum (front, edge, workflow de documentação, config). **Deixe aberta e chame o dono**:
  DDL/migration em produção; CI/workflows, segredos, Dockerfile, docker-compose, nginx, Terraform
  (`infra/terraform`); deleção de dado, arquitetura ou custo; conflito com PR de outro agente.
- `main` **não tem branch protection nem ruleset** (`github_get_branch_protection` → 404 "Branch not
  protected", `github_list_rulesets` → `[]`): nada bloqueia merge com CI vermelha. A disciplina é sua.
- Conflito: rebase em `main`; `--force-with-lease` só na sua branch.
- Merge = produção: confira o deploy e reporte. CI vermelha → leia o resumo da falha antes de qualquer
  patch; do seu merge → `fix:` em branch nova na mesma sessão.
- Fim: link da PR + estado.

## Banco — ler `docs/agentes/banco.md` antes de SQL, migration ou deploy
- `supabase/config.toml` declara `project_id = "xmyvefffgltlrobazrmg"`, mas o repo cita **três** refs
  diferentes (`xmyvefffgltlrobazrmg`, `npjfwzzapbtcguoupozd`, `blopallcxuotfutblkoe`) em arquivos que
  rodam em produção. **Qual é o oficial é decisão do dono e ainda não está resolvida** — confirme antes de
  qualquer SQL ou migration. Evidência e lista completa de ocorrências em `docs/agentes/banco.md`.
- **Não existe MCP do Supabase do Fuxico carregado nas sessões atuais.** Os MCPs Supabase disponíveis são de
  **outros** projetos — `pgxfvjmuubtbowutlide` ("GESTÃO DE CLIENTES"), `doufsxqlfjyuvxuezpln`
  ("GESTÃO DE PRODUTOS") e `tnnnlkbymytvtqngbbqh` ("ZAPP WEB V2"): **nunca** rodar DDL, migration ou
  escrita neles a partir deste repo.
- Diagnóstico = produção só leitura; teste = Postgres descartável; o front sem `VITE_SUPABASE_URL` /
  `VITE_SUPABASE_PUBLISHABLE_KEY` não sobe (`src/integrations/supabase/client.ts:7-8`).
- DDL só pelo fluxo de `banco.md` (arquivo em `supabase/migrations/` → PR → merge → deploy do código →
  apply; nunca de branch aberta; o ledger ao vivo é a verdade). Destrutivo, segredos e rotação: só com o dono.
- 122 tabelas, 7 views e 123 funções no `src/integrations/supabase/types.ts` gerado; 209 migrations em
  `supabase/migrations/`; testes de RLS em `supabase/tests/rls/*.test.sql`.

## Serviços
- **Vercel** — ler `docs/agentes/vercel-deploy.md` ao confirmar deploy ou mexer em env/domínio. Projeto
  `fuxico-v2` (`prj_sqvItwORPVg56sLBTOW3DrUiQmdY`, team `team_QyN41X0q8hrqhW80AwokbFLv`). O deploy real sai
  pela integração Git do Vercel (checks "Vercel Preview Comments"/"Vercel Agent Review" nas PRs); os jobs
  `deploy` de `ci.yml` e `deploy.yml` usam secrets que **não existem** no repo. Nunca segredo de servidor no
  Vercel; `VITE_*` é público e vai para o bundle.
- **Edge Functions (Supabase)** — 52 funções em `supabase/functions/`, **todas com `verify_jwt = false`** em
  `supabase/config.toml`: cada função valida autorização por conta própria. Deploy pelo job
  `deploy-functions` do `deploy.yml` (hoje sem `SUPABASE_ACCESS_TOKEN`/`SUPABASE_PROJECT_REF`) — confirme o
  run; nunca `supabase functions deploy` à mão em produção sem ordem do dono.
- **Extensão Chrome** — ler `docs/agentes/extensao-chrome.md` ao mexer em `chrome-extension/`. Não entra no
  build do Vite e aponta para um ref de Supabase diferente do `config.toml`.
- **GitHub/CI** — ler `docs/agentes/github-ci.md` ao mexer em settings, branch protection ou workflows
  (12 arquivos em `.github/workflows/`, nenhum required check).
- **Regras de domínio** — ler `docs/agentes/regras-dominio.md` ao mexer em tracking (pixel/link/documento),
  sequências, webhooks ou segurança/MFA.

## Stack e comandos — detalhe em `docs/agentes/mapa-repo.md`
- Vite + React + TS (`src/`), Supabase (`supabase/functions/` Deno, `supabase/migrations/`),
  Playwright (`e2e/`), Vitest (`src/__tests__/`), **npm** (`npm ci`; há `package-lock.json` versionado),
  Node 20 (`.nvmrc` = 20.10.0, `NODE_VERSION: '20'` nos workflows).
- `npx vitest run <caminho>`; `npm run typecheck` (`tsc --noEmit`); `npx eslint <arquivos>`;
  `npm run format:check`; `npm run test:e2e` (Playwright); guard das instruções de agentes:
  `node scripts/ci/check-claude-md-integrity.mjs`.
- `bun` aparece só em dois jobs de CI (`audit` em `ci.yml` e `supabase-codegen.yml`) para rodar
  `scripts/generate-pdf.ts`; o fluxo de dependências do repo é npm.
- Antes de qualquer tarefa: `docs/agentes/mapa-repo.md` (onde fica o quê) e `docs/README.md`.
- Automação em `scripts/<nome>/` com README (leia antes de alterar); nunca em `supabase/` nem `src/`.

## Grafo de código (graphify)
Grafo em `graphify-out/` (`bash scripts/graphify/setup.sh`; ver `mapa-repo.md`). Quando
`graphify-out/graph.json` existir: `graphify query "<pergunta>"`, `graphify path "<A>" "<B>"`,
`graphify explain "<conceito>"` antes de buscar por texto; `GRAPH_REPORT.md` só para revisão ampla.
Alterou código ou o report não é do HEAD atual → `graphify update .` (só AST). Em nuvem o grafo é gerado em
segundo plano (`.claude/hooks/session-start.sh`) — siga sem ele até terminar.
