# FUXICO - Blueprint de Funcionalidades e Ferramentas

> **Versão:** 1.0  
> **Data:** Dezembro 2024  
> **Objetivo:** Documentação completa para replicação de padrões em novos projetos

---

## 📋 ÍNDICE

1. [Stack Tecnológico](#1-stack-tecnológico)
2. [Arquitetura de Pastas](#2-arquitetura-de-pastas)
3. [Banco de Dados (Tabelas)](#3-banco-de-dados-tabelas)
4. [Edge Functions (Backend)](#4-edge-functions-backend)
5. [Hooks Customizados](#5-hooks-customizados)
6. [Componentes Principais](#6-componentes-principais)
7. [Funcionalidades por Módulo](#7-funcionalidades-por-módulo)
8. [Integrações Externas](#8-integrações-externas)
9. [Bibliotecas e Dependências](#9-bibliotecas-e-dependências)
10. [Padrões de Código](#10-padrões-de-código)
11. [Segurança](#11-segurança)
12. [Observabilidade](#12-observabilidade)

---

## 1. STACK TECNOLÓGICO

| Camada | Tecnologia | Versão | Uso |
|--------|------------|--------|-----|
| **Frontend** | React | ^18.3.1 | Framework principal |
| **Build** | Vite | - | Bundler e dev server |
| **Linguagem** | TypeScript | - | Tipagem estática |
| **Estilização** | TailwindCSS | - | Utility-first CSS |
| **UI Components** | shadcn/ui | - | Componentes base (Radix) |
| **Backend** | Supabase Edge Functions | Deno | Serverless functions |
| **Banco de Dados** | PostgreSQL (Supabase) | - | Persistência |
| **Autenticação** | Supabase Auth | - | OAuth, Email/Password |
| **State Management** | React Query (TanStack) | ^5.83.0 | Cache e fetching |
| **Roteamento** | React Router DOM | ^6.30.1 | SPA routing |
| **Formulários** | React Hook Form | ^7.61.1 | Gerenciamento de forms |
| **Validação** | Zod | ^3.25.76 | Schema validation |
| **Gráficos** | Recharts | ^2.15.4 | Visualização de dados |
| **Notificações** | Sonner | ^1.7.4 | Toast notifications |
| **Temas** | next-themes | ^0.3.0 | Dark/Light mode |

---

## 2. ARQUITETURA DE PASTAS

```
src/
├── assets/                    # Imagens e assets estáticos
├── components/
│   ├── ui/                    # Componentes shadcn/ui base
│   ├── dashboard/             # Componentes do dashboard
│   ├── settings/              # Componentes de configurações
│   ├── tracking/              # Componentes de rastreamento
│   └── ...                    # Outros componentes feature-based
├── contexts/
│   └── AuthContext.tsx        # Contexto de autenticação
├── hooks/                     # Custom hooks
├── integrations/
│   └── supabase/
│       ├── client.ts          # Cliente Supabase (auto-gerado)
│       └── types.ts           # Tipos do banco (auto-gerado)
├── lib/                       # Utilitários e configurações
├── pages/                     # Páginas/Rotas
├── types/                     # Tipos TypeScript globais
└── __tests__/                 # Testes unitários

supabase/
├── functions/                 # Edge Functions
│   ├── _shared/               # Código compartilhado entre functions
│   └── [function-name]/       # Uma pasta por function
└── config.toml                # Configuração Supabase (auto-gerado)

docs/                          # Documentação
e2e-tests/                     # Testes E2E
chrome-extension/              # Extensão Chrome (opcional)
```

---

## 3. BANCO DE DADOS (TABELAS)

### Tabelas Core

| Tabela | Descrição | Campos Principais |
|--------|-----------|-------------------|
| `tracked_emails` | Emails rastreados | tracking_id, recipient_email, subject, sender_email, delivery_status, bounce_type |
| `tracking_events` | Eventos de abertura/clique | tracking_id, event_type, ip_address, user_agent, is_self_open |
| `tracked_links` | Links rastreados em emails | tracking_id, link_id, original_url, click_count |
| `link_click_events` | Detalhes de cliques | link_id, ip_address, browser, device_type, country, city |
| `tracked_documents` | Documentos rastreados | document_id, file_name, file_path, recipient_email |
| `document_events` | Eventos de documentos | document_id, event_type, page_number, duration_seconds |

### Tabelas de Configuração

| Tabela | Descrição | Campos Principais |
|--------|-----------|-------------------|
| `user_preferences` | Preferências do usuário | notify_on_open, notify_on_click, sound_enabled, auto_reminder_enabled |
| `alert_thresholds` | Limites de alerta | bounce_rate_warning, bounce_rate_critical, low_open_rate |
| `webhook_configs` | Configuração de webhooks | url, events[], is_active, secret |
| `bitrix24_config` | Integração Bitrix24 | webhook_url, enabled, auto_sync_contacts |

### Tabelas de Suporte

| Tabela | Descrição | Campos Principais |
|--------|-----------|-------------------|
| `campaigns` | Campanhas de email | name, description, status |
| `email_templates` | Templates de email | name, subject, body, category |
| `scheduled_emails` | Emails agendados | scheduled_at, status, sent_at |
| `follow_up_reminders` | Lembretes de follow-up | tracking_id, reminder_days, status |
| `contact_scores` | Pontuação de contatos | email, engagement_score, total_opens, total_clicks |

### Tabelas de Auditoria/Segurança

| Tabela | Descrição | Campos Principais |
|--------|-----------|-------------------|
| `email_audit_logs` | Logs de auditoria | direction, is_external, external_domain |
| `fraud_alerts` | Alertas de fraude | alert_type, severity, description |
| `bounce_alerts` | Alertas de bounce | domain, bounce_rate, threshold, alert_type |
| `domain_reputation` | Reputação de domínio | domain, reputation_score, spf_valid, dkim_valid |
| `deliverability_logs` | Logs de entregabilidade | domain, delivery_rate, hard_bounces, soft_bounces |

### Tabelas de Sistema

| Tabela | Descrição | Campos Principais |
|--------|-----------|-------------------|
| `user_roles` | Roles de usuário (RBAC) | user_id, role (admin/user) |
| `notification_history` | Histórico de notificações | type, title, message, is_read |
| `webhook_logs` | Logs de webhooks | event_type, success, response_status |
| `scheduled_reports` | Relatórios agendados | report_type, metrics[], recipients[] |
| `ab_tests` | Testes A/B | variant_a_subject, variant_b_subject, winner |
| `unsubscribed_emails` | Emails descadastrados | email, reason, source |
| `standalone_tracked_links` | Links avulsos rastreados | link_id, original_url, click_count |

### Views Materializadas

| View | Descrição |
|------|-----------|
| `email_stats_mv` | Estatísticas agregadas de emails (open_count, click_count, first_opened_at, etc.) |

### Funções de Banco

| Função | Descrição |
|--------|-----------|
| `get_emails_with_stats` | Busca emails com estatísticas paginadas |
| `get_user_tracking_stats` | Estatísticas gerais do usuário |
| `get_geo_stats` | Estatísticas geográficas |
| `calculate_domain_deliverability` | Calcula entregabilidade por domínio |
| `check_bounce_alerts` | Verifica alertas de bounce |
| `get_due_reminders` | Lembretes pendentes |
| `update_contact_score` | Atualiza score de contato |
| `recalculate_all_contact_scores` | Recalcula todos os scores |
| `refresh_email_stats_mv` | Atualiza view materializada |
| `has_role` | Verifica role do usuário (RBAC) |

---

## 4. EDGE FUNCTIONS (BACKEND)

### Funções de Tracking

| Function | Método | Auth | Descrição |
|----------|--------|------|-----------|
| `track-pixel` | GET | Público | Registra abertura via pixel 1x1 |
| `track-link` | GET | Público | Registra clique e redireciona |
| `track-beacon` | POST | Público | Tracking via Beacon API |
| `track-document` | GET/POST | Público | Rastreia visualização de documento |
| `create-tracking` | POST | JWT | Cria novo tracking de email |

### Funções de Estatísticas

| Function | Método | Auth | Descrição |
|----------|--------|------|-----------|
| `get-tracking-stats` | GET | JWT | Busca estatísticas de tracking |
| `export-stats` | POST | JWT | Exporta estatísticas (CSV/JSON) |

### Funções de Bounce

| Function | Método | Auth | Descrição |
|----------|--------|------|-----------|
| `register-bounce` | POST | JWT | Registra bounce de email |
| `check-deliverability` | POST | JWT | Verifica entregabilidade |

### Funções de Integrações

| Function | Método | Auth | Descrição |
|----------|--------|------|-----------|
| `bitrix24-webhook` | POST | Secret | Webhook do Bitrix24 |
| `webhook-dispatch` | POST | JWT | Dispara webhooks configurados |
| `sync-crm` | POST | JWT | Sincroniza com CRM |

### Funções de Notificação

| Function | Método | Auth | Descrição |
|----------|--------|------|-----------|
| `send-notification` | POST | JWT | Envia notificação |
| `send-email-notification` | POST | JWT | Envia notificação por email |
| `check-reminders` | POST | Cron | Verifica lembretes pendentes |

### Funções de IA

| Function | Método | Auth | Descrição |
|----------|--------|------|-----------|
| `ai-insights` | POST | JWT | Gera insights com IA |
| `ai-subject-suggestions` | POST | JWT | Sugestões de assunto |
| `ai-email-analysis` | POST | JWT | Análise de email |

### Funções Administrativas

| Function | Método | Auth | Descrição |
|----------|--------|------|-----------|
| `health-check` | GET | Público | Status da API |
| `refresh-stats` | POST | JWT/Cron | Atualiza view materializada |
| `cleanup-old-data` | POST | Cron | Limpeza de dados antigos |
| `generate-report` | POST | JWT | Gera relatório |

### Funções de Documento

| Function | Método | Auth | Descrição |
|----------|--------|------|-----------|
| `create-document-tracking` | POST | JWT | Cria tracking de documento |
| `generate-tracked-pdf` | POST | JWT | Gera PDF rastreável |

### Funções de Agendamento

| Function | Método | Auth | Descrição |
|----------|--------|------|-----------|
| `schedule-email` | POST | JWT | Agenda envio de email |
| `process-scheduled-emails` | POST | Cron | Processa emails agendados |

### Código Compartilhado (`_shared/`)

| Arquivo | Descrição |
|---------|-----------|
| `cors.ts` | Headers CORS |
| `logger.ts` | Logger estruturado |
| `validation.ts` | Schemas Zod |
| `supabase-client.ts` | Cliente Supabase |
| `auth.ts` | Helpers de autenticação |
| `rate-limit.ts` | Rate limiting |

---

## 5. HOOKS CUSTOMIZADOS

### Hooks de Dados

| Hook | Arquivo | Descrição |
|------|---------|-----------|
| `useAuth` | `AuthContext.tsx` | Autenticação e sessão |
| `useEmailStats` | `use-email-stats.ts` | Estatísticas de email |
| `useTrackingStats` | `use-tracking-stats.ts` | Stats gerais de tracking |
| `useDocumentTracking` | `use-document-tracking.ts` | Tracking de documentos |
| `useCampaigns` | `use-campaigns.ts` | CRUD de campanhas |
| `useTemplates` | `use-templates.ts` | Templates de email |
| `useWebhook` | `use-webhook.ts` | Configuração webhooks |
| `useScheduledEmails` | `use-scheduled-emails.ts` | Emails agendados |
| `useContactScore` | `use-contact-score.ts` | Scores de contato |
| `useABTests` | `use-ab-tests.ts` | Testes A/B |
| `useNotifications` | `use-notifications.ts` | Notificações |
| `useUserPreferences` | `use-user-preferences.ts` | Preferências |
| `useAlertThresholds` | `use-alert-thresholds.ts` | Limites de alerta |
| `useBounceAlerts` | `use-bounce-alerts.ts` | Alertas de bounce |
| `useFraudAlerts` | `use-fraud-alerts.ts` | Alertas de fraude |
| `useDeliverability` | `use-deliverability.ts` | Entregabilidade |
| `useDomainReputation` | `use-domain-reputation.ts` | Reputação de domínio |

### Hooks Utilitários

| Hook | Arquivo | Descrição |
|------|---------|-----------|
| `useDebounce` | `use-debounce.ts` | Debounce de valores |
| `useDebouncedValue` | `use-debounced-value.ts` | Valor com debounce |
| `useLocalStorage` | `use-local-storage.ts` | Persistência local |
| `useClipboard` | `use-clipboard.ts` | Copiar para clipboard |
| `useMediaQuery` | `use-media-query.ts` | Media queries |
| `useMobile` | `use-mobile.tsx` | Detecção mobile |
| `useToast` | `use-toast.ts` | Toast notifications |
| `useSidebar` | `use-sidebar.tsx` | Estado da sidebar |

---

## 6. COMPONENTES PRINCIPAIS

### Layout

| Componente | Descrição |
|------------|-----------|
| `AppSidebar` | Sidebar principal do dashboard |
| `SidebarProvider` | Provider da sidebar |
| `ProtectedRoute` | Rota protegida por auth |
| `ThemeProvider` | Provider de tema (dark/light) |

### Dashboard

| Componente | Descrição |
|------------|-----------|
| `DashboardHome` | Página inicial do dashboard |
| `DashboardStats` | Cards de estatísticas |
| `DashboardCharts` | Gráficos do dashboard |
| `EmailList` | Lista de emails rastreados |
| `EmailDetails` | Detalhes de um email |
| `RecentActivity` | Atividade recente |
| `QuickActions` | Ações rápidas |

### Tracking

| Componente | Descrição |
|------------|-----------|
| `TrackingForm` | Formulário de criação |
| `TrackingPixelGenerator` | Gerador de pixel |
| `LinkTracker` | Rastreador de links |
| `DocumentUploader` | Upload de documentos |
| `DocumentViewer` | Visualizador de docs |

### Configurações

| Componente | Descrição |
|------------|-----------|
| `SettingsLayout` | Layout de configurações |
| `NotificationSettings` | Config de notificações |
| `WebhookSettings` | Config de webhooks |
| `IntegrationSettings` | Config de integrações |
| `AlertSettings` | Config de alertas |
| `ProfileSettings` | Perfil do usuário |

### Relatórios

| Componente | Descrição |
|------------|-----------|
| `ReportsPage` | Página de relatórios |
| `ReportBuilder` | Construtor de relatórios |
| `ReportScheduler` | Agendamento de relatórios |
| `ExportOptions` | Opções de exportação |

### UI Base (shadcn)

| Componente | Origem |
|------------|--------|
| `Button`, `Input`, `Label` | shadcn/ui |
| `Card`, `Dialog`, `Sheet` | shadcn/ui |
| `Table`, `Tabs`, `Select` | shadcn/ui |
| `Toast`, `Tooltip`, `Popover` | shadcn/ui |
| `Form`, `Checkbox`, `Switch` | shadcn/ui |
| `Avatar`, `Badge`, `Progress` | shadcn/ui |
| `Accordion`, `Alert`, `Calendar` | shadcn/ui |
| `Command`, `DropdownMenu`, `NavigationMenu` | shadcn/ui |
| `ScrollArea`, `Separator`, `Skeleton` | shadcn/ui |
| `Slider`, `Textarea`, `Toggle` | shadcn/ui |

---

## 7. FUNCIONALIDADES POR MÓDULO

### 📧 Módulo: Email Tracking

| Funcionalidade | Ferramenta/Componente |
|----------------|----------------------|
| Pixel de rastreamento 1x1 | `track-pixel` edge function |
| Detecção de abertura | `tracking_events` table |
| Detecção de self-open | `is_self_open` field |
| Múltiplas aberturas | `open_count` em `email_stats_mv` |
| Rastreamento de links | `track-link` edge function |
| Geolocalização | `country`, `city` em `link_click_events` |
| Device detection | `device_type`, `browser`, `os` |
| Metadados customizados | `metadata` JSONB field |

### 📄 Módulo: Document Tracking

| Funcionalidade | Ferramenta/Componente |
|----------------|----------------------|
| Upload de documentos | `DocumentUploader` component |
| Geração de PDF rastreável | `generate-tracked-pdf` function |
| Tracking de visualização | `track-document` function |
| Tempo por página | `duration_seconds` em `document_events` |
| Download tracking | `event_type = 'download'` |

### 📊 Módulo: Analytics/Reports

| Funcionalidade | Ferramenta/Componente |
|----------------|----------------------|
| Dashboard de stats | `DashboardStats` + Recharts |
| Gráficos de linha/barra | Recharts library |
| Exportação CSV/JSON | `export-stats` function |
| Relatórios agendados | `scheduled_reports` table |
| View materializada | `email_stats_mv` |
| Geo stats | `get_geo_stats` function |

### ⏰ Módulo: Scheduling

| Funcionalidade | Ferramenta/Componente |
|----------------|----------------------|
| Agendamento de emails | `scheduled_emails` table |
| Processamento automático | `process-scheduled-emails` cron |
| Follow-up reminders | `follow_up_reminders` table |
| Verificação de lembretes | `check-reminders` function |

### 🎯 Módulo: Campaigns & A/B

| Funcionalidade | Ferramenta/Componente |
|----------------|----------------------|
| Criação de campanhas | `campaigns` table |
| Templates reutilizáveis | `email_templates` table |
| Testes A/B | `ab_tests` table |
| Winner detection | `winner` field + lógica |

### 🔔 Módulo: Notifications

| Funcionalidade | Ferramenta/Componente |
|----------------|----------------------|
| Notificações in-app | `notification_history` + Sonner |
| Desktop notifications | Browser Notification API |
| Email notifications | `send-email-notification` function |
| Som de notificação | `sound_enabled` preference |
| Histórico | `notification_history` table |

### 🔗 Módulo: Webhooks

| Funcionalidade | Ferramenta/Componente |
|----------------|----------------------|
| Configuração de webhooks | `webhook_configs` table |
| Dispatch de eventos | `webhook-dispatch` function |
| Logs de webhook | `webhook_logs` table |
| Secret/assinatura | `secret` field |
| Retry logic | Implementado na function |

### 📈 Módulo: Deliverability

| Funcionalidade | Ferramenta/Componente |
|----------------|----------------------|
| Taxa de entrega | `deliverability_logs` table |
| Detecção de bounce | `register-bounce` function |
| Bounce hard/soft | `bounce_type` field |
| Reputação de domínio | `domain_reputation` table |
| SPF/DKIM/DMARC check | `spf_valid`, `dkim_valid`, `dmarc_valid` |
| Alertas de bounce | `bounce_alerts` table |

### 🛡️ Módulo: Security/Audit

| Funcionalidade | Ferramenta/Componente |
|----------------|----------------------|
| Logs de auditoria | `email_audit_logs` table |
| Alertas de fraude | `fraud_alerts` table |
| RBAC (roles) | `user_roles` + `has_role()` |
| Detecção externa | `is_external` field |
| Limites de alerta | `alert_thresholds` table |

### 🤖 Módulo: AI

| Funcionalidade | Ferramenta/Componente |
|----------------|----------------------|
| Insights automáticos | `ai-insights` function |
| Sugestões de assunto | `ai-subject-suggestions` function |
| Análise de email | `ai-email-analysis` function |
| Modelos suportados | Gemini, GPT (via Lovable AI) |

### 👥 Módulo: CRM/Integrations

| Funcionalidade | Ferramenta/Componente |
|----------------|----------------------|
| Bitrix24 | `bitrix24_config` + `bitrix24-webhook` |
| HubSpot | `crm/hubspot-adapter.ts` |
| Salesforce | `crm/salesforce-adapter.ts` |
| Pipedrive | `crm/pipedrive-adapter.ts` |
| Zoho | `crm/zoho-adapter.ts` |
| Score de contato | `contact_scores` table |
| Sync automático | `sync-crm` function |

### 📱 Módulo: UI/UX

| Funcionalidade | Ferramenta/Componente |
|----------------|----------------------|
| Dark/Light mode | `next-themes` + `ThemeProvider` |
| Responsivo | TailwindCSS breakpoints |
| Toast notifications | Sonner |
| Skeleton loading | shadcn Skeleton |
| Infinite scroll | React Query + IntersectionObserver |
| Debounce search | `useDebounce` hook |

---

## 8. INTEGRAÇÕES EXTERNAS

### CRMs Suportados

| CRM | Tipo | Funcionalidades |
|-----|------|-----------------|
| **Bitrix24** | Webhook | Sync contatos, deals, atividades |
| **HubSpot** | API | Sync contatos, deals |
| **Salesforce** | API | Sync leads, oportunidades |
| **Pipedrive** | API | Sync pessoas, deals |
| **Zoho CRM** | API | Sync leads, contatos |

### Outros Serviços

| Serviço | Uso |
|---------|-----|
| **Sentry** | Error tracking (APM) |
| **Web Vitals** | Performance monitoring |
| **Outlook Add-in** | Extensão para Outlook |
| **Chrome Extension** | Extensão para Gmail |

---

## 9. BIBLIOTECAS E DEPENDÊNCIAS

### Core

```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.30.1",
  "typescript": "implícito via vite"
}
```

### UI/Styling

```json
{
  "@radix-ui/*": "vários componentes",
  "tailwindcss": "implícito",
  "tailwind-merge": "^2.6.0",
  "tailwindcss-animate": "^1.0.7",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "lucide-react": "^0.462.0"
}
```

### Data/State

```json
{
  "@tanstack/react-query": "^5.83.0",
  "@supabase/supabase-js": "^2.88.0",
  "zod": "^3.25.76",
  "react-hook-form": "^7.61.1",
  "@hookform/resolvers": "^3.10.0"
}
```

### Visualização

```json
{
  "recharts": "^2.15.4",
  "react-day-picker": "^8.10.1",
  "date-fns": "^3.6.0"
}
```

### UX

```json
{
  "sonner": "^1.7.4",
  "next-themes": "^0.3.0",
  "cmdk": "^1.1.1",
  "vaul": "^0.9.9",
  "embla-carousel-react": "^8.6.0",
  "input-otp": "^1.4.2",
  "react-resizable-panels": "^2.1.9"
}
```

### Testing

```json
{
  "vitest": "^2.1.9",
  "@testing-library/react": "^16.3.1",
  "@testing-library/jest-dom": "^6.9.1"
}
```

---

## 10. PADRÕES DE CÓDIGO

### Estrutura de Hook (React Query)

```typescript
// use-[recurso].ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRecurso() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['recurso'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tabela')
        .select('*');
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const { error } = await supabase.from('tabela').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurso'] });
    },
  });

  return { data, isLoading, error, create: createMutation.mutateAsync };
}
```

### Estrutura de Edge Function

```typescript
// supabase/functions/[nome]/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const log = createLogger('nome-function');

const RequestSchema = z.object({
  campo: z.string(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const validated = RequestSchema.parse(body);
    
    log.info('Processando', { campo: validated.campo });
    
    // Lógica...
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    log.error('Erro', { error: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

### Estrutura de Componente

```tsx
// ComponentName.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRecurso } from '@/hooks/use-recurso';

interface ComponentNameProps {
  prop1: string;
  onAction?: () => void;
}

export function ComponentName({ prop1, onAction }: ComponentNameProps) {
  const { data, isLoading } = useRecurso();
  const [state, setState] = useState('');

  if (isLoading) return <Skeleton />;

  return (
    <div className="...">
      {/* JSX */}
    </div>
  );
}
```

---

## 11. SEGURANÇA

### Row Level Security (RLS)

```sql
-- Padrão: usuário só vê seus próprios dados
CREATE POLICY "Users can view own data"
ON public.tabela FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data"
ON public.tabela FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data"
ON public.tabela FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own data"
ON public.tabela FOR DELETE
USING (auth.uid() = user_id);
```

### Autenticação

| Método | Configuração |
|--------|--------------|
| Email/Password | Habilitado |
| Auto-confirm | Habilitado (dev) |
| OAuth | Google (opcional) |

### Validação

| Camada | Ferramenta |
|--------|------------|
| Frontend | Zod + React Hook Form |
| Backend | Zod nas Edge Functions |
| Banco | RLS + Constraints |

---

## 12. OBSERVABILIDADE

### Logging

| Componente | Ferramenta |
|------------|------------|
| Edge Functions | `createLogger` (structured) |
| Frontend | Console + Sentry |
| Banco | Supabase Logs |

### APM (Application Performance Monitoring)

| Métrica | Ferramenta |
|---------|------------|
| Web Vitals | `src/lib/apm.ts` |
| Error Tracking | Sentry |
| Request Timing | Custom timing |

### Alertas

| Tipo | Configuração |
|------|--------------|
| Bounce Rate | `alert_thresholds` table |
| Fraude | `fraud_alerts` table |
| Entregabilidade | `deliverability_logs` |

---

## 📋 CHECKLIST PARA NOVOS PROJETOS

### Essencial

- [ ] Estrutura de pastas padrão
- [ ] Supabase client configurado
- [ ] AuthContext implementado
- [ ] ProtectedRoute configurado
- [ ] Tema (dark/light) configurado
- [ ] Toast notifications (Sonner)
- [ ] React Query provider

### Backend

- [ ] Edge Functions com Zod validation
- [ ] Logger estruturado
- [ ] CORS headers
- [ ] RLS em todas as tabelas
- [ ] Funções de banco otimizadas

### Frontend

- [ ] shadcn/ui configurado
- [ ] TailwindCSS customizado
- [ ] Hooks de dados (React Query)
- [ ] Hooks utilitários
- [ ] Componentes reutilizáveis

### Qualidade

- [ ] Testes unitários (Vitest)
- [ ] Testes E2E (opcional)
- [ ] TypeScript strict
- [ ] ESLint configurado

---

> **Nota:** Este documento deve ser atualizado conforme novas funcionalidades são adicionadas ao sistema.
