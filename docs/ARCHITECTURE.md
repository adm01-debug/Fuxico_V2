# FUXICO Architecture

## System Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Chrome Ext.    │────▶│   Supabase      │────▶│   PostgreSQL    │
│  (Gmail)        │     │   Edge Functions│     │   (RLS)         │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  React Frontend │     │   Realtime      │     │   Materialized  │
│  (Dashboard)    │◀────│   Subscriptions │     │   Views         │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Component Architecture

### Frontend (React 18)

| Layer | Location | Files |
|-------|----------|-------|
| Pages | src/pages/ | 5 pages |
| Hooks | src/hooks/ | 13 custom hooks |
| Components | src/components/ | 78 TSX components |
| UI | src/components/ui/ | 49 shadcn components |
| Libs | src/lib/ | 8 utilities |

### Backend (Supabase Edge Functions)

| Function | Purpose | Auth |
|----------|---------|------|
| create-tracking | Create email tracking | Required |
| get-tracking-stats | Fetch statistics | Required |
| track-pixel | Record email opens | Public |
| track-link | Record link clicks | Public |
| webhook-dispatch | External webhooks | Required |
| bitrix24-sync | CRM integration | Required |

### Database Schema

#### Core Tables
- `tracked_emails` - Email tracking records
- `tracking_events` - Open/click events
- `tracked_links` - Link tracking
- `tracked_documents` - Document tracking

#### Supporting Tables
- `user_preferences` - User settings
- `user_roles` - RBAC roles
- `email_audit_logs` - Audit trail
- `fraud_alerts` - Security alerts

### Security Layers

1. **Network**: CORS, Rate Limiting, CSP Headers
2. **Authentication**: JWT via Supabase Auth
3. **Authorization**: Row Level Security (RLS)
4. **Validation**: Zod schemas on all inputs
5. **Monitoring**: Structured logging, APM

## Data Flow

### Email Tracking Flow
1. Chrome Extension intercepts Gmail send
2. Creates tracking via Edge Function
3. Injects pixel and rewrites links
4. Email sent with tracking
5. Recipient opens → pixel fires → event recorded
6. Dashboard updates via Realtime subscription

### Document Tracking Flow
1. User uploads document
2. Generates tracked PDF with watermark
3. Viewer opens document
4. Events recorded (view, scroll, time)
5. Analytics aggregated in materialized view
