# 📧 FUXICO - Email Tracking System

> Sistema completo de rastreamento de emails com dashboard analítico, integração CRM e extensão Chrome.

[![CI/CD Pipeline](https://github.com/seuusuario/fuxico/actions/workflows/ci.yml/badge.svg)](https://github.com/seuusuario/fuxico/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/gh/seuusuario/fuxico/branch/main/graph/badge.svg)](https://codecov.io/gh/seuusuario/fuxico)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitetura](#-arquitetura)
- [Instalação](#-instalação)
- [Desenvolvimento](#-desenvolvimento)
- [Testes](#-testes)
- [Deploy](#-deploy)
- [API Reference](#-api-reference)
- [Contribuição](#-contribuição)

---

## 🎯 Visão Geral

O FUXICO é um sistema de rastreamento de emails que permite:

- 📊 **Rastrear aberturas e cliques** em emails enviados
- 📈 **Dashboard analítico** com métricas de engajamento
- 🔗 **Rastreamento de links** com estatísticas detalhadas
- 📄 **Rastreamento de documentos** PDF com visualização
- 🔔 **Notificações em tempo real** de aberturas
- 🏢 **Integração com Bitrix24** CRM
- 🛡️ **Sistema de auditoria** com detecção de fraudes

---

## 🛠 Stack Tecnológico

### Frontend
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| React | 18.3 | Framework UI |
| TypeScript | 5.8 | Tipagem estática |
| Vite | 5.4 | Build tool |
| TailwindCSS | 3.4 | Estilização |
| shadcn/ui | - | Componentes UI |
| TanStack Query | 5 | State management |
| React Router | 6 | Navegação |
| Recharts | - | Gráficos |

### Backend
| Tecnologia | Uso |
|------------|-----|
| Supabase | BaaS (Auth, Database, Storage, Realtime) |
| PostgreSQL | Banco de dados |
| Edge Functions | Serverless functions (Deno) |
| Row Level Security | Segurança de dados |

### Extensão Chrome
| Tecnologia | Uso |
|------------|-----|
| Manifest V3 | Configuração da extensão |
| Content Scripts | Injeção no Gmail |
| Service Worker | Background tasks |

---

## 🏗 Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────────┤
│  Pages          │  Components       │  Hooks                    │
│  - Dashboard    │  - EmailTable     │  - useTrackedEmails       │
│  - Auth         │  - AuditTab       │  - useRealtimeNotifs      │
│  - Settings     │  - BitrixTab      │  - useBitrix24            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE (Backend)                           │
├─────────────────────────────────────────────────────────────────┤
│  Edge Functions          │  Database                            │
│  - get-tracking-stats    │  - tracked_emails                    │
│  - track-pixel           │  - tracking_events                   │
│  - track-link            │  - tracked_links                     │
│  - bitrix24-sync         │  - email_audit_logs                  │
│  - webhook-dispatch      │  - fraud_alerts                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  CHROME EXTENSION                               │
├─────────────────────────────────────────────────────────────────┤
│  Content Script (Gmail)  │  Popup         │  Service Worker     │
│  - Intercepta envio      │  - Login       │  - Notificações     │
│  - Injeta pixel          │  - Stats       │  - Sync             │
│  - Indicadores visuais   │  - Toggle      │  - Cache            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Instalação

### Pré-requisitos

- Node.js 20+
- pnpm 8+
- Conta Supabase
- Docker (opcional, para desenvolvimento local)

### Setup

```bash
# 1. Clone o repositório
git clone https://github.com/seuusuario/fuxico.git
cd fuxico

# 2. Instale as dependências
pnpm install

# 3. Configure as variáveis de ambiente
cp .env.example .env

# 4. Configure o Supabase
# - Crie um projeto em https://supabase.com
# - Copie URL e ANON_KEY para o .env
# - Execute as migrations

pnpm supabase db push

# 5. Inicie o servidor de desenvolvimento
pnpm dev
```

### Variáveis de Ambiente

```env
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key

# Opcional
VITE_LOG_ENDPOINT=https://seu-logging-service.com/api/logs
```

---

## 💻 Desenvolvimento

### Estrutura de Pastas

```
fuxico/
├── src/
│   ├── components/
│   │   ├── dashboard/      # Componentes do dashboard
│   │   └── ui/             # shadcn/ui components
│   ├── hooks/              # React hooks customizados
│   ├── lib/                # Utilitários e configurações
│   ├── pages/              # Páginas da aplicação
│   └── __tests__/          # Testes
├── supabase/
│   ├── functions/          # Edge Functions
│   └── migrations/         # Migrations SQL
├── extension/              # Extensão Chrome
└── public/                 # Assets estáticos
```

### Scripts Disponíveis

```bash
# Desenvolvimento
pnpm dev              # Inicia servidor dev (Vite)
pnpm build            # Build de produção
pnpm preview          # Preview do build

# Qualidade
pnpm lint             # ESLint
pnpm typecheck        # TypeScript check
pnpm test             # Testes unitários
pnpm test:coverage    # Testes com coverage

# Supabase
pnpm supabase start   # Inicia Supabase local
pnpm supabase db push # Aplica migrations
pnpm supabase functions serve # Dev de Edge Functions
```

### Convenções de Código

- **Commits**: Conventional Commits (`feat:`, `fix:`, `docs:`, etc.)
- **Branches**: `feature/`, `fix/`, `chore/`
- **Componentes**: PascalCase
- **Hooks**: `use-` prefix em kebab-case
- **Testes**: `.test.ts` ou `.spec.ts`

---

## 🧪 Testes

### Executando Testes

```bash
# Todos os testes
pnpm test

# Watch mode
pnpm test:watch

# Com coverage
pnpm test:coverage

# Arquivo específico
pnpm test src/__tests__/hooks/use-tracking.test.ts
```

### Estrutura de Testes

```typescript
// src/__tests__/hooks/use-tracking.test.ts
import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

describe('useTrackedEmails', () => {
  it('deve buscar emails com sucesso', async () => {
    const { result } = renderHook(() => useTrackedEmails())
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
  })
})
```

### Coverage Mínimo

| Métrica | Mínimo |
|---------|--------|
| Statements | 70% |
| Branches | 60% |
| Functions | 70% |
| Lines | 70% |

---

## 🚀 Deploy

### Pipeline CI/CD

O projeto usa GitHub Actions para CI/CD:

1. **Lint & Typecheck** - ESLint + TypeScript
2. **Tests** - Vitest com coverage
3. **Build** - Vite production build
4. **Deploy Functions** - Supabase Edge Functions
5. **Deploy Frontend** - Vercel/Netlify

### Deploy Manual

```bash
# 1. Build
pnpm build

# 2. Deploy Edge Functions
pnpm supabase functions deploy

# 3. Deploy frontend (exemplo Vercel)
vercel --prod
```

### Configuração de Secrets

Configure os seguintes secrets no GitHub:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `VERCEL_TOKEN` (se usar Vercel)

---

## 📡 API Reference

### Edge Functions

#### GET /get-tracking-stats

Retorna estatísticas de emails rastreados.

```typescript
// Request
GET /get-tracking-stats?limit=50&offset=0
Authorization: Bearer <token>

// Response
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tracking_id": "string",
      "recipient_email": "string",
      "subject": "string",
      "opens": 5,
      "clicks": 2,
      "first_opened_at": "ISO8601"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

#### GET /track-pixel

Registra abertura de email via pixel.

```
GET /track-pixel?id=<tracking_id>
```

Retorna GIF 1x1 transparente.

#### POST /create-tracking

Cria novo rastreamento.

```typescript
// Request
POST /create-tracking
Authorization: Bearer <token>
{
  "recipient_email": "user@example.com",
  "subject": "Email Subject",
  "sender_email": "sender@example.com"
}

// Response
{
  "success": true,
  "tracking_id": "uuid",
  "pixel_url": "https://..."
}
```

---

## 🤝 Contribuição

1. Fork o repositório
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

### Guidelines

- Siga as convenções de código
- Escreva testes para novas funcionalidades
- Atualize a documentação quando necessário
- Use Conventional Commits

---

## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## 📞 Suporte

- 📧 Email: suporte@fuxico.app
- 💬 Discord: [Link do Discord]
- 📚 Docs: [Link da documentação]

---

<p align="center">
  Feito com ❤️ pela equipe FUXICO
</p>
