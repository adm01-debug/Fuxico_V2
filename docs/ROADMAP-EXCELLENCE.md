# 🎯 FUXICO — Roadmap de Excelência (Wave 1 → 3)

**Status:** Ativo — atualizado em 2026-07-11.
**Meta:** Elevar nota de 7.5 → 9.0+ nas 22 dimensões do scorecard.

Este documento consolida os itens do backlog de excelência aprovados pelo usuário
("Tudo — Waves 1+2+3"). Itens marcados ✅ foram entregues nesta sprint; os demais
ficam documentados aqui como próximos passos priorizados.

---

## ✅ Wave 1 — Entregue nesta sprint

| # | Item | Evidência |
|---|------|-----------|
| E17 | NavigationHeader global com botão Voltar contextual | `src/components/navigation/NavigationHeader.tsx` |
| E19 | Transições de rota com Framer Motion | `src/components/navigation/RouteTransitions.tsx` + `App.tsx` |
| E21 | Prevenção de perda de dados (`beforeunload` + blocker SPA) | `src/hooks/use-unsaved-changes.ts` |
| E24 | Filtros/histórico persistente via search params | `src/hooks/use-url-filters.ts` |
| G31 | Virtualização de tabelas longas (`@tanstack/react-virtual`) | `src/components/ui/virtual-table.tsx` |
| A1 | OTel real com propagação W3C `traceparent` + measures | `src/lib/otel.ts` |
| B4 | k6 aprimorado (500 RPS, thresholds P95<200ms) | `loadtests/performance.js` |
| F27 | Optimistic locking (`version` column) em campaigns/sequences | migration `add_optimistic_locking_version` |
| F30 | Utilitários BR (CPF/CNPJ/telefone/CEP/BRL) | `src/lib/br-formats.ts` |

---

## 🟠 Wave 2 — Próxima sprint

| # | Item | Ação |
|---|------|------|
| E20 | Stepper visual para fluxos multi-etapa | Criar `<Stepper>` no design system e usar em CampaignsTab / SequencesTab |
| E22 | Atalhos globais (Esc, `?`) | Estender `use-keyboard-navigation.ts` já existente |
| E23 | Micro-interações (pulse/scale em botões primários) | Adicionar variant `interactive` ao Button |
| F25 | Camada `services/` separada dos hooks | Extrair I/O do Supabase para `src/services/{domain}.ts` |
| F26 | State machines com XState em MFA/Sequências | Adicionar `xstate` + `@xstate/react` |
| B6 | pgTAP RLS 100% cobertura | Estender `supabase/tests/rls/comprehensive.test.sql` para todas as 52 tabelas |
| D13 | OpenAPI completo (28 Edge Functions) | Estender `docs/openapi.yaml` |
| D14 | Diagrama ER atualizado | Regenerar via `supabase db diagram` |

---

## 🔵 Wave 3 — Backlog médio prazo

| # | Item | Observação |
|---|------|------------|
| A2 | Alertas de uptime, bounce rate, P95 | Requer configuração no provedor (Sentry Alerts / BetterStack) |
| A3 | Sentry Session Replay | Ativar em `src/lib/sentry.ts` — decisão custo × privacidade |
| B5 | Pen test formal (OWASP ASVS L2) | Contratação externa |
| B7 | Chaos testing | Cenários: Supabase down, timeout de LLM, DNS falhando |
| C8 | IaC (Terraform/Pulumi) | Codificar Supabase project, buckets, DNS, secrets |
| C9 | Staging environment + smoke tests | Duplicar Cloud project em ambiente `staging` |
| C10 | CDN de assets (Cloudflare) | Cache-control tunado para `/assets/*` |
| C11 | Supabase types codegen no CI | `supabase gen types` como step do `.github/workflows/ci.yml` |
| C12 | DR drill trimestral | Executar `docs/DR_PLAN.md` e cronometrar RTO/RPO |
| D15 | Code review SLA + hotfix procedure | Adicionar seções em `CONTRIBUTING.md` |
| D16 | Cultura de postmortem mensal | Agendar review em `docs/RUNBOOK.md` |
| F28 | Bundle monitoring bloqueando PR | Adicionar `bundlesize` como required check |
| F29 | Cache Redis (Upstash) | Hot reads do dashboard — apenas se latência exigir |
| G32 | Trend Prediction — sair de "em progresso" | Finalizar `TrendPredictionTab` |
| G33 | WhatsApp API oficial | Migrar do BETA para provedor certificado (Twilio / Meta Cloud API) |

---

## Métricas alvo

| Dimensão | Atual | Meta pós Wave 2 | Meta pós Wave 3 |
|----------|-------|-----------------|-----------------|
| Observabilidade | 5 | 7 | 9 |
| Testes | 7 | 8 | 9 |
| Infraestrutura | 6 | 7 | 9 |
| UX / Navegabilidade | — | 9 | 10 |
| **Geral ponderada** | **7.5** | **8.5** | **9.2** |
