# Extensão Chrome (Gmail) — referência para agentes

Ler quando mexer em `chrome-extension/`, na edge `get-config` ou em qualquer coisa que a extensão consuma.

| O que | Valor | Evidência |
|---|---|---|
| Nome / versão | "FUXICO - Email Tracker" `1.4.0`, Manifest **V3** | `chrome-extension/manifest.json` |
| Onde injeta | `https://mail.google.com/*`, `run_at: document_idle`, JS `config.js` + `content/gmail.js`, CSS `styles/gmail-inject.css` | `manifest.json` (`content_scripts`) |
| Permissões | `storage`, `notifications`, `activeTab`, `alarms`; host: `https://mail.google.com/*`, `https://*.supabase.co/*` | `manifest.json` |
| Background | `background/service-worker.js`; popup `popup/popup.html` | `manifest.json` |
| Backend que ela chama | `https://npjfwzzapbtcguoupozd.supabase.co` | `chrome-extension/config.js:10` |
| Dashboard que ela abre | `https://fuxico.lovable.app` | `chrome-extension/config.js:14` |
| Build | **não tem** — JS/CSS puro, zero bundler, nenhuma entrada no `package.json`, nenhum workflow | verificado por grep |
| Instalação | `chrome://extensions` → "Carregar sem compactação" apontando para a pasta | `chrome-extension/README.md:5-9` |

## Fatos que já custam retrabalho

1. **A extensão aponta para um ref de Supabase diferente do resto do repo.** `config.js:10` usa
   `npjfwzzapbtcguoupozd`; `supabase/config.toml:1` declara `xmyvefffgltlrobazrmg`; `public/_redirects`
   usa `blopallcxuotfutblkoe`. Implantar edge function pelo `supabase/config.toml` **não** atualiza o
   backend que a extensão chama. Ver `docs/agentes/banco.md` antes de qualquer deploy.
2. **A anon key está commitada em claro** em `chrome-extension/config.js:11` (JWT `eyJ…`). É chave
   `anon`, pública por natureza, mas casa exatamente com o padrão "Supabase Key" declarado em
   `.secret-scan.yml` — e está num repo privado, não num bundle. Rotacionar/remover é decisão do dono;
   **não** copie esse valor para resposta, log, PR ou issue.
3. **O `README.md` da extensão contradiz o código.** Ele manda editar URLs à mão em `content/gmail.js`,
   `popup/popup.js` e `background/service-worker.js` (`chrome-extension/README.md:13-33`), mas a
   configuração é centralizada em `config.js`. Mudou URL/endpoint → mexa só em `config.js` e corrija o
   README no mesmo PR.
4. **Config remota sobrescreve o arquivo.** 1 segundo após o load, `config.js` chama
   `loadRemoteConfig()` contra `GET /functions/v1/get-config` (`config.js:150-156`). Mudar a edge
   `get-config` muda o comportamento de todas as extensões instaladas, sem republicar nada — trate como
   mudança de produção.
5. **`public/fuxico-extension.zip` é artefato manual.** Ele vai no bundle do site, mas nada o regenera a
   partir de `chrome-extension/`. Mexeu na extensão → o zip ficou velho; diga isso na PR.

## Contrato com o backend

`config.js` declara os 10 endpoints que a extensão usa (`API_URL` = `${SUPABASE_URL}/functions/v1`):
`/create-tracking`, `/track-pixel`, `/track-link`, `/track-document`, `/get-tracking-stats`,
`/report-bounce`, `/log-email-activity`, `/get-config`, `/get-tracking-detail`, `/create-reminder`.

Mudar assinatura, nome ou resposta de **qualquer uma dessas 10** quebra a extensão instalada no navegador
do usuário, que não atualiza junto com o deploy do site. Mudança nelas = mudança de contrato: avise na PR
e mantenha compatibilidade.

Parâmetros de comportamento (também sobrescrevíveis pelo `get-config`):

| Chave | Valor no arquivo |
|---|---|
| `INTERVALS.POLL_OPENS` / `BOUNCE_CHECK` | 30 s |
| `INTERVALS.CHECK_COMPOSE` | 1 s |
| `INTERVALS.AUDIT_CHECK` | 1 min |
| `INTERVALS.TOKEN_REFRESH` | 30 min |
| `INTERVALS.CONFIG_REFRESH` | 1 h |
| `DETECTION.SELF_OPEN_THRESHOLD_MS` | 2 min (abertura do próprio remetente não conta) |
| `FEATURES` | `EMAIL_TRACKING`, `LINK_TRACKING`, `DOCUMENT_TRACKING`, `BOUNCE_DETECTION`, `EMAIL_AUDIT`, `BITRIX_INTEGRATION`, `WEBHOOKS` ligados; **`GEOLOCATION: false`** |

`GEOLOCATION: false` é deliberado no arquivo: a edge `geo-lookup` existe, mas a extensão não a usa.
Ligar isso é decisão de produto (privacidade), não de implementação.
