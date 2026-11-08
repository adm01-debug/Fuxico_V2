# Vercel e deploy — referência para agentes

Ler quando for confirmar um deploy, mexer em env vars, domínio ou deploy de edge functions.

| O que | Valor | Evidência |
|---|---|---|
| Projeto Vercel | `fuxico-v2` · ID `prj_sqvItwORPVg56sLBTOW3DrUiQmdY` | `mcp__Vercel__list_projects` (search `fuxico`) |
| Team | ID `team_QyN41X0q8hrqhW80AwokbFLv` | mesma chamada |
| Detalhes do projeto, domínios e deploys pelo MCP | **NÃO VERIFICÁVEL nesta sessão** — `get_project` e `list_project_domains` devolvem **404**, `list_deployments` devolve **403** | o token do MCP lista o projeto mas não o lê. 403/404 aqui é **limite de evidência**, nunca prova de que está errado |
| `vercel.json` | **não existe** no repo | `find` sem resultado |
| Domínio citado no código | `https://fuxico.app` (health check em `ci.yml`, `og:image` em `index.html:69`, `security@fuxico.app` em `SECURITY.md`) e `https://www.fuxico.app` | grep |
| Dashboard da extensão | `https://fuxico.lovable.app` | `chrome-extension/config.js:14` |
| Framework / build / output | Vite + React · `npm run build` · `dist/` · Node 20 | `package.json`, `.nvmrc` |

## Como o deploy acontece de fato

1. **Integração Git do Vercel** — é o caminho que está funcionando. Nas PRs aparecem os checks
   `Vercel Preview Comments` (success) e `Vercel Agent Review`; o projeto está conectado ao repo pelo
   próprio Vercel, sem `vercel.json` e sem secret no GitHub. **Merge em `main` = deploy em produção.**
2. **Jobs `deploy` do GitHub Actions — hoje não funcionam.** `ci.yml` (job `deploy`) e `deploy.yml`
   (job `deploy`) usam `amondnet/vercel-action@v42 --prod` com `VERCEL_TOKEN`, `VERCEL_ORG_ID` e
   `VERCEL_PROJECT_ID`; **nenhum desses secrets existe** no repo nem no environment `production`
   (`github_list_actions_secrets` → 4 secrets, nenhum deles; `github_list_environment_secrets
   production` → 0). Os dois jobs disparam no **mesmo** push para `main`.
3. **Edge functions** — job `deploy-functions` do `deploy.yml`, depois do `deploy`:
   `supabase functions deploy --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}` com
   `SUPABASE_ACCESS_TOKEN`. **Os dois secrets também não existem.** Sem nome de função, o comando
   implanta **todas as 52** de uma vez; não há rollback de uma só por esse caminho.
4. **Self-host (Docker/nginx)** — `Dockerfile` + `docker-compose.yml` + `nginx.conf` existem e funcionam
   manualmente, mas **nenhum workflow builda ou publica imagem**. Não trate como canal de deploy sem
   ordem do dono.
5. **Terraform** (`infra/terraform/`) — template com backend S3 `fuxico-tfstate` e lock DynamoDB
   `fuxico-tflock`, providers supabase/cloudflare/github; **nenhum workflow roda `terraform apply`**.

**Depois de qualquer merge em `main`:** confirme o deploy pelo painel do Vercel ou pelo check da PR, e
reporte. Não diga "deployado" com base no merge.

## Env vars — a divergência que quebra o bundle

| Variável | Quem lê | Quem define |
|---|---|---|
| `VITE_SUPABASE_URL` | `src/integrations/supabase/client.ts:7` | secret do repo, `ci.yml`, `deploy.yml`, `.env.example` |
| **`VITE_SUPABASE_PUBLISHABLE_KEY`** | `src/integrations/supabase/client.ts:8` | **secret do repo existe**, mas **nenhum workflow injeta no build** |
| `VITE_SUPABASE_ANON_KEY` | **ninguém no código** | `ci.yml`, `deploy.yml`, `.env.example:6`, `README.md` — e **o secret não existe** |

Ou seja: o build do GitHub Actions passa a variável errada e não passa a certa. O que faz o site funcionar
é a env var configurada **no painel do Vercel** (não legível nesta sessão). Ao mexer em build ou env:
alinhe os três lados (código, workflow, `.env.example`) no mesmo PR — e secret é item de **chame o dono**.

Outras `VITE_*` lidas pelo código: `VITE_APP_VERSION`, `VITE_SENTRY_DSN`, `VITE_SENTRY_ENVIRONMENT`,
`VITE_LOG_ENDPOINT`, `VITE_UPSTASH_REDIS_REST_URL`, `VITE_UPSTASH_REDIS_REST_TOKEN`.

### Regras de env vars

- **Nunca** colocar chave de servidor no Vercel: `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`,
  `RESEND_API_KEY`, `GOOGLE_CLIENT_SECRET`, `LOVABLE_API_KEY`, `CRON_SECRET`, `MCP_SECRET`,
  `SEQUENCE_WEBHOOK_SECRET` — todos são das **edge functions** (`supabase secrets set` ou painel do
  Supabase). Não há serverless próprio neste projeto.
- Toda `VITE_*` vai para o bundle e é **pública**. `src/lib/upstash-cache.ts:13-14` lê o token do Redis de
  `VITE_UPSTASH_REDIS_REST_TOKEN`: se alguém configurar essa var, o token vaza no JS do site. Não configure
  sem falar com o dono.
- `scripts/check-security.sh` falha de propósito se `VITE_SUPABASE_SERVICE_ROLE_KEY` existir — o script não
  roda em CI, mas a regra vale.

## Proxy público de tracking

`public/_redirects` manda `/api/public/track/open.gif` e `/api/public/track/click` para
`https://blopallcxuotfutblkoe.supabase.co/functions/v1/track-pixel|track-link` com status 200, remapeando
`?tp=` para o parâmetro `t`. Dois efeitos:

1. é esse arquivo que fixa **qual banco recebe o tracking real** — ver `docs/agentes/banco.md`;
2. a sintaxe de `_redirects` é a da Netlify; no Vercel o equivalente é `vercel.json`/`rewrites`, que **não
   existe** aqui. Se os links de tracking pararem de funcionar, comece por aqui — **NÃO VERIFICADO** se o
   Vercel está honrando o arquivo.
