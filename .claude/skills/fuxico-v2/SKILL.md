---
name: fuxico-v2
description: Convenções de código e commit do Fuxico V2 (TypeScript, Conventional Commits). Use ao alterar código, criar testes ou escrever mensagem de commit neste repositório; as regras operacionais ficam em AGENTS.md.
---

# Fuxico V2 — convenções

As regras de trabalho (banco, fluxo Git, PR, comunicação) estão em `AGENTS.md` na raiz — este skill só
resume convenções de código e commit.

## Commits

Padrão Conventional Commits, cobrado pelo hook `commit-msg` do husky
(`npx --no-install commitlint --edit "$1"`, config `@commitlint/config-conventional` em
`commitlint.config.js`): `<tipo>(<escopo>): <descrição>` — escopo opcional e minúsculo; assunto não
vazio, sem ponto final, sem Sentence/Start/PascalCase/UPPERCASE; cabeçalho ≤ 100 caracteres; tipos:
`feat fix docs style refactor perf test build ci chore revert`. Mensagem em PT-BR, modo imperativo,
primeira linha curta.

Exemplo: `fix(auth): corrige sessão perdida após refresh do token`

## Código

- Linguagem: TypeScript (front Vite + React em `src/`, edge functions Deno em `supabase/functions/`).
- Funções `camelCase`, classes/componentes `PascalCase`, constantes `SCREAMING_SNAKE_CASE`.
- Exports nomeados; siga o padrão de import do arquivo vizinho (alias `@/` → `src/`).
- Testes unitários ao lado do módulo (`__tests__/`) ou em `tests/`; E2E em `e2e/` (Playwright); rode só
  o que tocou: `npx vitest run <caminho>`.
- Siga os padrões já existentes no módulo; não desvie sem motivo registrado na PR.
