# Staging Environment — Setup Guide

## Objetivo
Ambiente idêntico a prod, com dados sintéticos, para: E2E, chaos, DR drills, testes de load.

## Provisioning (30 min)
1. Criar 2º projeto Lovable Cloud → `fuxico-staging`.
2. Rodar `terraform workspace select staging && terraform apply` (ver `infra/terraform/`).
3. Copiar migrations: `supabase db push --project-ref <staging>`.
4. Seed sintético: `bun run seed:staging` (script gera 10k users, 100k emails fake).
5. GitHub Actions: adicionar secrets `STAGING_SUPABASE_URL`, `STAGING_SUPABASE_ANON_KEY`.
6. Workflow `deploy.yml` — job `deploy-staging` já preparado (branch `staging`).

## Uso
- E2E: `PW_BASE_URL=https://staging.fuxico.dev bun run test:e2e`
- Load: `STAGING_URL=... k6 run loadtests/performance.js`
- Chaos: `STAGING_URL=... k6 run loadtests/chaos.js`
- DR drill trimestral: ver `docs/DR_PLAN.md`.

## Dados
- Sintéticos apenas (`faker-js/faker`). Nunca copiar prod → staging (LGPD).
- Reset semanal via cron edge function `reset-staging-data`.
