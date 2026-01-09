# Arquitetura Detalhada

## Visão Geral

```
┌─────────────────┐     ┌─────────────────┐
│  Chrome Ext     │────▶│   Supabase      │
└─────────────────┘     │   Edge Func     │
                        └────────┬────────┘
┌─────────────────┐              │
│   React App     │──────────────┤
└─────────────────┘              ▼
                        ┌─────────────────┐
                        │   PostgreSQL    │
                        │   + RLS         │
                        └─────────────────┘
```

## Componentes

### Frontend
- React 18 + TypeScript
- TanStack Query (cache)
- shadcn/ui (componentes)

### Backend
- 35 Edge Functions
- Deno runtime
- Zod validation

### Database
- PostgreSQL 15
- 12 tabelas principais
- RLS em todas tabelas
- 18 índices otimizados

## Fluxo de Dados

1. Email enviado com pixel
2. Destinatário abre → GET /track-pixel
3. Edge Function registra evento
4. Dashboard atualiza via realtime
5. Webhook dispara para integrações
