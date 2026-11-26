# Codex CLI neste repositório

Suplemento ao `AGENTS.md` da raiz — ele é a fonte das regras; aqui fica só o baseline local do Codex.

## Skill do repo

- Skill para Codex: `.agents/skills/fuxico-v2/SKILL.md`
- Skill equivalente para Claude: `.claude/skills/fuxico-v2/SKILL.md`
- Credenciais e MCPs privados ficam em `~/.codex/config.toml`, **nunca** neste repo.

## Baseline de MCP

Trate `.codex/config.toml` como o baseline padrão deste repositório: GitHub, Context7, Exa, Memory,
Playwright e Sequential Thinking.

## Multi-agente

- Explorer: levantamento de evidência, somente leitura
- Reviewer: correção, segurança e regressão
- Docs researcher: verificação de API e release notes

## Arquivos de workflow

Não há arquivos de workflow de tarefa gerados para este repo.
