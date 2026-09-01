# ADR-005: State Management Strategy

## Status
Aceito

## Contexto
O projeto precisa gerenciar estados complexos de servidor (cache, loading, error, polling de tracking) e estados de UI (filtros, modais, tema).

## Decisão
1. **Server State:** Utilizar **TanStack Query (React Query) v5**. 
   - Centraliza cache e sincronização com Supabase.
   - Configurações globais de `staleTime` e `gcTime` para otimizar performance.
2. **UI State:** Utilizar **React Context API** e **Hooks nativos** (`useState`, `useReducer`).
   - Evitar bibliotecas externas como Redux ou Zustand para manter o bundle size reduzido, a menos que surja necessidade de sincronização complexa entre múltiplos domínios de UI.
3. **Form State:** Utilizar **React Hook Form** com integração Zod.

## Consequências
- Código mais previsível e padronizado.
- Facilidade em implementar estados de carregamento (skeletons).
- Menor overhead de boilerplate.
