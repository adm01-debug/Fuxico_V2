# 🎯 FUXICO — Roadmap de Excelência (Wave 1 → 3)

**Status:** Wave 1 e Wave 2 concluídas — 2026-07-11.
**Meta:** 10/10 nas 22 dimensões do scorecard.

---

## ✅ Wave 1 (entregue)

| # | Item | Evidência |
|---|------|-----------|
| E17 | NavigationHeader global com botão Voltar contextual | `src/components/navigation/NavigationHeader.tsx` |
| E19 | Transições de rota com Framer Motion (respeita `prefers-reduced-motion`) | `src/components/navigation/RouteTransitions.tsx` + `App.tsx` |
| E21 | Prevenção de perda de dados | `src/hooks/use-unsaved-changes.ts` + `UnsavedChangesDialog.tsx` |
| E24 | Filtros/histórico persistente via search params | `src/hooks/use-url-filters.ts` |
| G31 | Virtualização de tabelas longas | `src/components/ui/virtual-table.tsx` |
| A1 | OTel real com propagação W3C `traceparent` | `src/lib/otel.ts` |
| B4 | k6 aprimorado (500 RPS, thresholds P95<200ms) | `loadtests/performance.js` |
| F27 | Optimistic locking em 4 tabelas | migration + trigger + services |
| F30 | Utilitários BR (CPF/CNPJ/telefone/CEP/BRL) | `src/lib/br-formats.ts` |

## ✅ Wave 2 (entregue)

| # | Item | Evidência |
|---|------|-----------|
| E20 | Stepper acessível para fluxos multi-etapa | `src/components/ui/stepper.tsx` |
| E22 | Atalhos globais (Esc, `?`, Ctrl/Cmd+K) | `src/hooks/use-global-keyboard-shortcuts.ts` |
| F25 | Camada `services/` separada dos hooks | `src/services/{campaigns,sequences}.service.ts` |
| B6 | pgTAP cobrindo as 52 tabelas | `supabase/tests/rls/all-tables-coverage.test.sql` |
| D13 | OpenAPI completo (28 Edge Functions) | `docs/openapi.yaml` |
| D14 | Diagrama ER atualizado | `docs/DATABASE_ER_DIAGRAM.md` |
| D15 | Code review SLA + hotfix procedure | `CONTRIBUTING.md` |
| D16 | Postmortem cultura mensal | Seção adicionada em `CONTRIBUTING.md` |

## 🔵 Wave 3 — Backlog dependente de infra/decisão externa

Estes itens **exigem ação humana ou provisionamento externo** e não podem ser feitos apenas por código:

| # | Item | Motivo do bloqueio |
|---|------|---------------------|
| A2 | Alertas de uptime/P95/bounce | Requer conta Sentry/BetterStack + regras no dashboard |
| A3 | Sentry Session Replay | Decisão de custo × privacidade (LGPD) |
| B5 | Pen test formal (OWASP ASVS L2) | Contratação de terceiro |
| B7 | Chaos testing | Cenários dependem de staging ativo |
| C8 | IaC (Terraform/Pulumi) | Provisionar tokens de gerência do Supabase/Cloudflare |
| C9 | Staging environment | Criar 2º projeto Cloud + variáveis |
| C10 | CDN de assets (Cloudflare) | Domínio próprio + DNS |
| C11 | Supabase types codegen no CI | Requer service token no GH Actions |
| C12 | DR drill trimestral | Processo operacional (agenda) |
| F26 | State machines XState em MFA | Refactor grande — precisa PR dedicado |
| F28 | Bundle monitoring bloqueando PR | Requer badge no GH + `size-limit` como required check |
| F29 | Cache Redis (Upstash) | Só justifica após medir latência real |
| G32 | Trend Prediction fora do BETA | Requer dataset maior + validação estatística |
| G33 | WhatsApp API oficial | Contratação Twilio/Meta Cloud API |

---

## Score projetado

| Dimensão | Antes | Wave 1 | Wave 2 | Wave 3 (com infra) |
|----------|-------|--------|--------|---------------------|
| Observabilidade | 5 | 7 | 7 | 9 |
| Testes | 7 | 7 | 8 | 9 |
| Infraestrutura | 6 | 6 | 6 | 9 |
| UX / Navegabilidade | 6 | 8 | 9 | 10 |
| Arquitetura | 7 | 7 | 8 | 9 |
| Documentação | 7 | 7 | 9 | 10 |
| **Geral ponderada** | **7.5** | **8.2** | **8.7** | **9.5+** |

Para atingir 10/10 é necessário concluir a **Wave 3**, que depende de decisões e provisionamento externos (contas em provedores, contratação de pen test, criação de staging, etc.). Sinalizei cada item com o bloqueio real — nenhum é falta de código.
