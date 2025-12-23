# Guia de Contribuição

Obrigado por considerar contribuir com o FUXICO! 🎉

## 📋 Como Contribuir

### 1. Fork e Clone

```bash
git clone https://github.com/SEU-USUARIO/fuxico.git
cd fuxico
npm install
```

### 2. Crie uma Branch

```bash
git checkout -b feature/minha-feature
# ou
git checkout -b fix/meu-bugfix
```

### 3. Faça suas Alterações

- Siga os padrões de código existentes
- Adicione testes para novas funcionalidades
- Atualize a documentação se necessário

### 4. Commit

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git commit -m "feat: adicionar nova funcionalidade"
git commit -m "fix: corrigir bug no rastreamento"
git commit -m "docs: atualizar README"
git commit -m "test: adicionar testes para hook"
git commit -m "chore: atualizar dependências"
```

### 5. Push e Pull Request

```bash
git push origin feature/minha-feature
```

Abra um Pull Request no GitHub.

## 🧪 Testes

```bash
# Rodar todos os testes
npm run test

# Testes com cobertura
npm run test:coverage

# Testes E2E
npm run test:e2e
```

## 📁 Estrutura do Projeto

```
src/
├── components/    # Componentes React
├── hooks/         # Hooks customizados
├── lib/           # Utilitários
├── pages/         # Páginas
└── __tests__/     # Testes
```

## 🔍 Code Review

- PRs precisam de pelo menos 1 aprovação
- CI deve passar (lint, testes)
- Cobertura de testes deve ser mantida

## 📝 Padrões de Código

- TypeScript strict mode
- ESLint + Prettier
- Componentes funcionais com hooks
- Naming: camelCase para funções, PascalCase para componentes

## 🐛 Reportar Bugs

Use as [Issues](https://github.com/adm01-debug/fuxico/issues) com o template de bug.

## 💡 Sugerir Features

Abra uma [Discussion](https://github.com/adm01-debug/fuxico/discussions) primeiro.

---

Dúvidas? Abra uma issue ou discussion!
