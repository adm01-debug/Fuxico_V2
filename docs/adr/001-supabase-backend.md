# ADR-001: Uso do Supabase como Backend

## Status
Aceito

## Contexto
O FUXICO precisa de um backend robusto que suporte:
- Autenticação de usuários
- Banco de dados PostgreSQL
- Edge Functions para lógica de negócio
- Real-time subscriptions
- Row Level Security (RLS)

## Decisão
Utilizar Supabase como plataforma de backend principal.

### Justificativa
1. **PostgreSQL nativo**: Banco de dados robusto e escalável
2. **Auth integrado**: Supabase Auth com suporte a OAuth
3. **Edge Functions**: Deno runtime para lógica serverless
4. **RLS**: Segurança em nível de linha para multi-tenancy
5. **Real-time**: WebSocket nativo para notificações
6. **Custo**: Tier gratuito generoso para MVP

## Consequências
### Positivas
- Desenvolvimento rápido
- Segurança integrada
- Escalabilidade automática
- SDK TypeScript tipado

### Negativas
- Vendor lock-in parcial
- Limites no tier gratuito
- Curva de aprendizado para RLS

## Alternativas Consideradas
1. **Firebase**: Menos controle sobre SQL, NoSQL
2. **AWS Amplify**: Mais complexo, maior curva de aprendizado
3. **Backend custom**: Maior custo de desenvolvimento

## Data
Dezembro 2024

## Autores
Equipe FUXICO
