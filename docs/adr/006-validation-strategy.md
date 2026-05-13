# ADR-006: Validation Strategy

## Status
Aceito

## Contexto
A integridade dos dados é crítica para o FUXICO, especialmente em eventos de tracking e segurança.

## Decisão
1. **Schema-First:** Utilizar **Zod** como a única fonte de verdade para validação de esquemas.
2. **Compartilhamento:** Os schemas devem ser definidos em `src/schemas/` e reutilizados em:
   - Validação de formulários (Frontend).
   - Validação de inputs em Edge Functions (Backend).
   - Validação de retornos de funções RPC.
3. **Runtime Safety:** Substituir castings de tipo inseguros (`as Type`) por validações seguras (`.parse()` ou `.safeParse()`).

## Consequências
- Eliminação de bugs de "data mismatch".
- Melhor documentação viva dos dados do sistema.
- Segurança reforçada contra inputs maliciosos.
