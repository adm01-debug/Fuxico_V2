# 🎯 Service Level Objectives (SLOs) — FUXICO

## 1. Disponibilidade (Availability)

| Serviço | SLI | SLO |
|---------|-----|-----|
| Dashboard Web | Porcentagem de requisições 2xx/3xx | 99.9% |
| Tracking Pixel | Porcentagem de requisições 2xx (sucesso) | 99.99% |
| Edge Functions | Porcentagem de execuções com sucesso | 99.5% |
| Banco de Dados | Uptime do cluster Postgres | 99.95% |

## 2. Latência (Latency)

| Operação | Métrica | SLO |
|----------|---------|-----|
| Tracking Pixel | P95 Latência | < 100ms |
| Dashboard API | P95 Latência | < 500ms |
| Relatórios (RPC) | P95 Latência | < 2s |

## 3. Integridade de Dados

| Métrica | SLO |
|---------|-----|
| Perda de eventos | < 0.01% |
| Lag de Materialized View | < 1 min |

## 4. Alertas (Sentry/Monitoring)

- **Critical:** Dispara se taxa de erro > 1% em 5 min.
- **Warning:** Dispara se latência P99 > 2s em 15 min.
- **Info:** Novas exceções detectadas no Sentry.
