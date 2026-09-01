# ADR-001: Arquitetura de Email Tracking

## Status
Aceito

## Contexto
O FUXICO precisa rastrear aberturas de emails de forma confiável, mesmo com as restrições de privacidade dos clientes de email modernos.

## Decisão
Utilizamos uma abordagem híbrida:
1. **Pixel de rastreamento**: Imagem 1x1 transparente para detectar aberturas
2. **Links rastreados**: URLs com IDs únicos para detectar cliques
3. **Edge Functions**: Supabase Edge Functions para baixa latência global

## Consequências

### Positivas
- Latência global baixa (~50ms)
- Escalabilidade automática
- Sem necessidade de gerenciar servidores

### Negativas
- Dependência do Supabase
- Custo baseado em invocações

## Alternativas Consideradas
1. **Servidor próprio**: Descartado por complexidade operacional
2. **AWS Lambda**: Descartado por custo e complexidade
3. **Cloudflare Workers**: Considerado, mas Supabase oferece integração melhor

---

# ADR-002: Stack Frontend

## Status
Aceito

## Contexto
Necessidade de uma interface moderna, responsiva e performática.

## Decisão
- **React 18**: Biblioteca madura com ecossistema rico
- **TypeScript**: Type safety e melhor DX
- **TailwindCSS + shadcn/ui**: Estilização rápida e consistente
- **TanStack Query**: Gerenciamento de estado servidor otimizado
- **Vite**: Build tool rápido

## Consequências
- Desenvolvimento rápido com componentes reutilizáveis
- Bundle otimizado com tree-shaking
- Tipagem forte reduz bugs em produção

---

# ADR-003: Autenticação e Segurança

## Status
Aceito

## Contexto
Proteção de dados sensíveis de usuários e emails rastreados.

## Decisão
- **Supabase Auth**: Autenticação OAuth e email/senha
- **Row Level Security (RLS)**: Isolamento de dados por usuário
- **CSP Headers**: Proteção contra XSS
- **Rate Limiting**: Proteção contra abuse

## Consequências
- Cada usuário só acessa seus próprios dados
- APIs protegidas contra abusos
- Conformidade com boas práticas de segurança

