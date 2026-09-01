# CONTRIBUTING — FUXICO

## Code Review SLA

| Prioridade | Primeira resposta | Merge target |
|------------|-------------------|---------------|
| 🔴 Hotfix (P0) | 30 min | 2 horas |
| 🟠 P1 (bloqueia release) | 4 horas | 24 horas |
| 🟡 P2 (feature normal) | 1 dia útil | 3 dias úteis |
| 🟢 P3 (nice-to-have) | 3 dias úteis | 1 semana |

## Definition of Done

- [ ] Testes unitários e de integração passando (`bun run test`)
- [ ] `bun run typecheck` e `bun run lint` sem erros
- [ ] Cobertura ≥ 80% (SonarJS)
- [ ] Migrations com RLS + GRANTS explícitos
- [ ] Documentação atualizada (README, ADR se decisão arquitetural)
- [ ] Screenshots ou vídeo em PRs de UI

## Hotfix Procedure

1. **Detecção**: alerta Sentry / usuário / monitoramento aciona P0.
2. **Branch**: `hotfix/<slug>` a partir de `main` (nunca a partir de `develop`).
3. **Correção mínima**: aplicar o menor patch possível — nada de refactor.
4. **Teste obrigatório**: incluir teste regressivo que reproduza o bug ANTES do fix.
5. **PR expedito**: revisor sênior + owner de módulo assinam em até 30 min.
6. **Deploy imediato**: após merge, Deploy Ops promove para produção.
7. **Postmortem**: 24h após incidente, seguindo `docs/POSTMORTEM_TEMPLATE.md`.
8. **Retro**: incluir no runbook (`docs/RUNBOOK.md`) se pattern novo.

## Postmortem Cultura Mensal

- Toda 1ª sexta do mês: revisão dos incidentes do mês anterior.
- Ação: pelo menos 1 melhoria estrutural extraída de cada incidente.
- Documento: `docs/postmortems/YYYY-MM-DD-<slug>.md`.

## Convenções

- Commits: [Conventional Commits](https://www.conventionalcommits.org/)
- Branches: `feat/`, `fix/`, `hotfix/`, `chore/`, `docs/`, `refactor/`
- Nunca commit direto em `main` — apenas via PR aprovado.
