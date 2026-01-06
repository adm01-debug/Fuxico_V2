# 🔍 FUXICO - Email Tracking System

Sistema completo de rastreamento de emails com pixel invisível, detecção de aberturas, cliques e integração com CRMs.

![Version](https://img.shields.io/badge/version-1.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)
![React](https://img.shields.io/badge/React-18.3-61dafb)

## 📋 Índice

- [Instalação](#-instalação)
- [Arquitetura](#-arquitetura)
- [API](#-api)
- [Funcionalidades](#-funcionalidades)
- [Configuração](#-configuração)
- [Desenvolvimento](#-desenvolvimento)

## 🚀 Instalação

### Pré-requisitos

- Node.js 18+
- npm ou bun
- Conta Supabase
- Chrome (para extensão)

### Passos

```bash
# Clonar repositório
git clone https://github.com/adm01-debug/fuxico.git
cd fuxico

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais Supabase

# Iniciar em desenvolvimento
npm run dev
```

### Extensão Chrome

1. Acesse `chrome://extensions`
2. Ative "Modo desenvolvedor"
3. Clique em "Carregar sem compactação"
4. Selecione a pasta `chrome-extension/`

## 🏗️ Arquitetura

```
fuxico/
├── src/                    # Frontend React
│   ├── components/         # Componentes UI
│   ├── hooks/              # Hooks customizados
│   ├── lib/                # Utilitários e configurações
│   ├── pages/              # Páginas da aplicação
│   └── integrations/       # Integrações (Supabase)
├── supabase/
│   ├── functions/          # Edge Functions (14)
│   └── migrations/         # Migrações SQL
├── chrome-extension/       # Extensão Chrome (Manifest V3)
├── e2e/                    # Testes E2E (Playwright)
└── docs/                   # Documentação API
```

### Stack Tecnológico

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 18 + TypeScript + Vite |
| UI | TailwindCSS + shadcn/ui |
| State | TanStack Query v5 |
| Backend | Supabase Edge Functions |
| Database | PostgreSQL + RLS |
| Auth | Supabase Auth |

## 📡 API

### Endpoints Principais

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/create-tracking` | POST | Criar rastreamento |
| `/track-pixel` | GET | Registrar abertura |
| `/track-link` | GET | Registrar clique |
| `/get-tracking-stats` | GET | Estatísticas |
| `/report-bounce` | POST | Reportar bounce |

Documentação completa: [docs/openapi.yaml](docs/openapi.yaml)

## ✨ Funcionalidades

- ✅ Rastreamento de aberturas (pixel invisível)
- ✅ Rastreamento de cliques em links
- ✅ Detecção de self-opens
- ✅ Detecção de bounces
- ✅ Notificações em tempo real
- ✅ Integração com CRMs (Bitrix24, HubSpot, Salesforce, Pipedrive)
- ✅ Auditoria de emails
- ✅ Alertas de fraude
- ✅ Internacionalização (PT-BR, EN-US, ES)
- ✅ Modo escuro
- ✅ PWA

## ⚙️ Configuração

### Variáveis de Ambiente

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

### CRM Integration

Configure na página de Settings > Integrações.

## 👨‍💻 Desenvolvimento

```bash
# Testes unitários
npm run test

# Testes E2E
npm run test:e2e

# Lint
npm run lint

# Build
npm run build
```

## 📄 Licença

MIT © FUXICO Team


## 🚀 Getting Started

### Pré-requisitos

- Node.js 18+
- npm ou bun
- Conta no Supabase

### Instalação Rápida

```bash
# Clone o repositório
git clone https://github.com/adm01-debug/fuxico.git
cd fuxico

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local

# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse http://localhost:5173

## 🤝 Como Contribuir

### 1. Fork e Clone

```bash
git clone https://github.com/seu-usuario/fuxico.git
git remote add upstream https://github.com/adm01-debug/fuxico.git
```

### 2. Crie uma Branch

```bash
git checkout -b feature/minha-feature
# ou
git checkout -b fix/meu-bugfix
```

### 3. Faça Commit (Conventional Commits)

```bash
git commit -m "feat: adiciona nova funcionalidade"
git commit -m "fix: corrige bug no componente"
git commit -m "docs: atualiza documentação"
```

### 4. Abra um Pull Request

- Descreva as mudanças claramente
- Inclua screenshots se aplicável
- Referencie issues relacionadas

### Padrões de Código

- ESLint + Prettier configurados
- TypeScript strict mode
- Testes obrigatórios para features novas
