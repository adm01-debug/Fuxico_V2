# 📚 FUXICO - Documentação Técnica

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Instalação](#instalação)
4. [Configuração](#configuração)
5. [Edge Functions](#edge-functions)
6. [Banco de Dados](#banco-de-dados)
7. [Chrome Extension](#chrome-extension)
8. [API Reference](#api-reference)

---

## 🎯 Visão Geral

O **FUXICO** é um sistema completo de rastreamento de emails que permite:

- 📧 **Rastrear aberturas** de emails via pixel invisível
- 🔗 **Rastrear cliques** em links
- 📄 **Rastrear documentos** PDF com análise de visualização
- 📊 **Analytics** detalhados de engajamento
- 🔔 **Notificações** em tempo real
- 🔄 **Integração** com Bitrix24 CRM

### Stack Tecnológico

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 18 + TypeScript + Vite |
| UI | TailwindCSS + shadcn/ui |
| State | TanStack Query v5 |
| Backend | Supabase Edge Functions (Deno) |
| Database | PostgreSQL + RLS |
| Realtime | Supabase Realtime |
| Extension | Chrome Extension Manifest V3 |

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        CHROME EXTENSION                          │
│  ┌───────────┐  ┌───────────┐  ┌───────────────────────────┐   │
│  │ Popup.js  │  │ Content   │  │ Service Worker            │   │
│  │           │  │ (Gmail)   │  │ (Background Tasks)        │   │
│  └───────────┘  └───────────┘  └───────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
│  ┌───────────┐  ┌───────────┐  ┌───────────────────────────┐   │
│  │ Dashboard │  │ Hooks     │  │ Components                │   │
│  │ Pages     │  │ (13+)     │  │ (78 TSX)                  │   │
│  └───────────┘  └───────────┘  └───────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EDGE FUNCTIONS (Supabase)                    │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────┐   │
│  │ track-pixel    │  │ create-tracking│  │ bitrix24-sync   │   │
│  │ track-link     │  │ get-stats      │  │ webhook-dispatch│   │
│  │ track-document │  │ geo-lookup     │  │ ...             │   │
│  └────────────────┘  └────────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATABASE (PostgreSQL)                     │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────┐   │
│  │ tracked_emails │  │ tracking_events│  │ user_preferences│   │
│  │ tracked_links  │  │ tracked_docs   │  │ fraud_alerts    │   │
│  └────────────────┘  └────────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Instalação

### Pré-requisitos

- Node.js 20+
- npm ou bun
- Conta Supabase
- Chrome (para extensão)

### Passos

```bash
# 1. Clonar repositório
git clone https://github.com/adm01-debug/fuxico.git
cd fuxico

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais

# 4. Iniciar desenvolvimento
npm run dev
```

---

## 🔧 Configuração

### Variáveis de Ambiente

```env
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Bitrix24 (opcional)
BITRIX24_WEBHOOK_URL=https://xxx.bitrix24.com/rest/xxx/xxx/

# Geolocalização
IP_GEOLOCATION_API_KEY=xxx
```

---

## 🚀 Edge Functions

| Função | Endpoint | Descrição |
|--------|----------|-----------|
| `track-pixel` | GET `/track-pixel/:id` | Registra abertura de email |
| `track-link` | GET `/track-link/:id` | Registra clique em link |
| `create-tracking` | POST `/create-tracking` | Cria novo tracking |
| `get-tracking-stats` | GET `/get-tracking-stats` | Retorna estatísticas |
| `bitrix24-sync` | POST `/bitrix24-sync` | Sincroniza com CRM |

---

## 📊 Banco de Dados

### Tabelas Principais

- `tracked_emails` - Emails rastreados
- `tracking_events` - Eventos de abertura/clique
- `tracked_links` - Links com rastreamento
- `tracked_documents` - Documentos PDF
- `saved_filters` - Filtros salvos por usuário
- `entity_versions` - Histórico de versões

### Row Level Security (RLS)

Todas as tabelas possuem RLS habilitado, garantindo que usuários só acessem seus próprios dados.

---

## 🔌 Chrome Extension

### Instalação

1. Acesse `chrome://extensions`
2. Ative "Modo desenvolvedor"
3. Clique "Carregar sem compactação"
4. Selecione a pasta `chrome-extension`

### Funcionalidades

- ✅ Interceptação do botão Enviar do Gmail
- ✅ Injeção automática de pixel de rastreamento
- ✅ Indicadores visuais na inbox
- ✅ Notificações de abertura

---

## 📖 API Reference

Consulte [API.md](./API.md) para documentação completa da API.

---

## 📄 Licença

MIT License - veja [LICENSE](../LICENSE)

---

> Documentação atualizada em: Janeiro 2026
