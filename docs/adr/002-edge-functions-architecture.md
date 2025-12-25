# ADR-002: Arquitetura de Edge Functions

## Status
Aceito

## Data
2025-12-25

## Contexto

O FUXICO precisa de funções serverless para processar eventos de rastreamento de emails em tempo real. Os requisitos principais são:

1. **Baixa latência**: Eventos como abertura de pixel precisam responder em <100ms
2. **Alta disponibilidade**: O rastreamento não pode falhar por indisponibilidade
3. **Escalabilidade**: Suportar picos de milhares de requisições simultâneas
4. **Segurança**: Proteção contra abuso e CSRF
5. **Integração**: Comunicação eficiente com banco de dados PostgreSQL

## Decisão

Utilizamos **Supabase Edge Functions** (Deno Runtime) com a seguinte arquitetura:

### Estrutura de Arquivos

```
supabase/functions/
├── _shared/                    # Código compartilhado
│   ├── cors.ts                 # CORS restritivo por whitelist
│   ├── rate-limit.ts           # Rate limiting por IP
│   ├── schemas.ts              # Validação com Zod
│   ├── security-headers.ts     # Headers de segurança
│   └── logger.ts               # Logging estruturado JSON
├── _tests/                     # Testes de integração
│   └── integration-suite.test.ts
├── create-tracking/
├── get-tracking-stats/
├── track-pixel/
├── track-link/
├── webhook-dispatch/
└── ... (outras funções)
```

### Padrões Implementados

1. **CORS Restritivo**
   - Whitelist de domínios permitidos
   - Suporte a Chrome Extension
   - Domínios *.supabase.co e *.lovable.app

2. **Rate Limiting**
   - Por IP com janela deslizante
   - Limites específicos por função
   - Storage em memória (Deno KV quando disponível)

3. **Validação de Input**
   - Schemas Zod para todos os endpoints
   - Sanitização automática de dados
   - Mensagens de erro estruturadas

4. **Logging Estruturado**
   - Formato JSON para agregação
   - Níveis: debug, info, warn, error
   - Trace ID para correlação
   - Sanitização de dados sensíveis

5. **Headers de Segurança**
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - X-XSS-Protection
   - Referrer-Policy

### Funções por Categoria

| Categoria | Funções | Auth | Rate Limit |
|-----------|---------|------|------------|
| Tracking | track-pixel, track-link, track-document | Não* | Alto |
| CRUD | create-tracking, get-tracking-stats | Sim | Médio |
| Integração | bitrix24-sync, webhook-dispatch | Sim | Baixo |
| Utilitários | geo-lookup, health-check | Não | Alto |

*Funções de tracking não requerem auth pois são chamadas por clientes de email

## Consequências

### Positivas

- **Latência**: ~50-100ms em média (edge locations globais)
- **Deploy**: Automático via `supabase functions deploy`
- **Escala**: Automática até milhares de req/s
- **Custo**: Pay-per-use, sem servidores ociosos
- **Isolamento**: Cada função é isolada (segurança)
- **TypeScript**: Suporte nativo com Deno

### Negativas

- **Cold starts**: ~200-500ms na primeira requisição
- **Limite de memória**: 150MB por função
- **Timeout**: Máximo 150 segundos
- **Debug**: Limitado em produção (mitigado com logging)
- **Estado**: Sem persistência entre requisições (stateless)

### Riscos Mitigados

| Risco | Mitigação |
|-------|-----------|
| DDoS | Rate limiting + CORS restritivo |
| Injection | Validação Zod |
| CSRF | CORS whitelist |
| Data leak | Sanitização de logs |
| Cold start | Warm-up via health-check |

## Alternativas Consideradas

### AWS Lambda
- ✅ Mais maduro, maior ecossistema
- ❌ Complexidade de setup (API Gateway, IAM)
- ❌ Custo de NAT Gateway para VPC
- ❌ Integração manual com Supabase

### Cloudflare Workers
- ✅ Latência ainda menor (edge computing)
- ✅ Excelente para rate limiting (KV nativo)
- ❌ Menos integração com Supabase
- ❌ Limite de CPU time (50ms)

### Vercel Functions
- ✅ Boa integração com React/Next.js
- ❌ Não é edge por padrão
- ❌ Vendor lock-in maior
- ❌ Limites do plano free

### Self-hosted (Kubernetes)
- ✅ Controle total
- ❌ Complexidade operacional alta
- ❌ Custo de infraestrutura
- ❌ Time-to-market maior

## Métricas de Sucesso

- Latência P95 < 200ms
- Disponibilidade > 99.9%
- Taxa de erro < 0.1%
- Cold start rate < 5%

## Referências

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Runtime](https://deno.land/)
- [Zod Schema Validation](https://zod.dev/)

---

*Última atualização: 2025-12-25*
