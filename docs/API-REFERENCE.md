# FUXICO API Reference

Complete API documentation for FUXICO Email Tracking System.

## Base URL

```
Production: https://your-project.supabase.co/functions/v1
Development: http://localhost:54321/functions/v1
```

## Authentication

All authenticated endpoints require a Bearer token:

```
Authorization: Bearer <your-jwt-token>
```

---

## Edge Functions

### Email Tracking

#### Create Tracking

```http
POST /create-tracking
```

**Request Body:**
```json
{
  "recipient_email": "user@example.com",
  "subject": "Email subject",
  "sender_email": "sender@example.com",
  "metadata": {},
  "track_opens": true,
  "track_clicks": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tracking_id": "uuid",
    "pixel_url": "https://...",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### Get Tracking Stats

```http
GET /get-tracking-stats
```

**Query Parameters:**
- `user_id`: UUID (required)
- `date_from`: ISO datetime
- `date_to`: ISO datetime
- `limit`: number (1-500, default: 100)
- `offset`: number (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "emails": [...],
    "total": 150,
    "page": 1
  }
}
```

#### Track Pixel

```http
GET /track-pixel?t={tracking_id}
```

Returns a 1x1 transparent GIF and logs the open event.

#### Track Link

```http
GET /track-link?id={link_id}
```

Logs click event and redirects to target URL.

---

### Document Tracking

#### Track Document

```http
POST /track-document
```

**Request Body:**
```json
{
  "document_id": "uuid",
  "event_type": "view|download|print|share",
  "page_number": 1,
  "time_spent_seconds": 30
}
```

---

### Bounces & Delivery

#### Report Bounce

```http
POST /report-bounce
```

**Request Body:**
```json
{
  "tracking_id": "uuid",
  "bounce_type": "hard|soft|complaint|unsubscribe",
  "bounce_reason": "Mailbox not found"
}
```

#### Check Deliverability

```http
POST /check-deliverability
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "check_mx": true,
  "check_smtp": false
}
```

---

### AI Features

#### Generate Followup

```http
POST /generate-followup
```

**Request Body:**
```json
{
  "email_id": "uuid",
  "tone": "professional|friendly|urgent",
  "max_length": 300
}
```

#### Suggest Subject

```http
POST /suggest-subject
```

**Request Body:**
```json
{
  "email_body": "Your email content...",
  "tone": "professional",
  "num_suggestions": 3
}
```

#### AI Insights

```http
POST /ai-insights
```

**Request Body:**
```json
{
  "user_id": "uuid",
  "insight_type": "engagement|trends|recommendations",
  "limit": 10
}
```

---

### Integrations

#### Bitrix24 Sync

```http
POST /bitrix24-sync
```

**Request Body:**
```json
{
  "action": "sync_contacts|sync_deals|full_sync",
  "entity_ids": [],
  "force": false
}
```

#### Webhook Dispatch

```http
POST /webhook-dispatch
```

**Request Body:**
```json
{
  "event_type": "email.opened|email.clicked|email.bounced",
  "payload": {},
  "webhook_url": "https://..."
}
```

#### Zapier Webhook

```http
POST /zapier-webhook
```

**Request Body:**
```json
{
  "trigger_type": "new_open",
  "data": {}
}
```

---

### Utilities

#### Health Check

```http
GET /health-check
```

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### Geo Lookup

```http
POST /geo-lookup
```

**Request Body:**
```json
{
  "ip_address": "192.168.1.1",
  "include_timezone": true
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Missing/invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limited |
| 500 | Internal Server Error |

## Rate Limits

- **Standard**: 100 requests/minute
- **Bulk Operations**: 10 requests/minute
- **Webhooks**: 1000 requests/hour

---

## Webhooks

### Event Types

- `email.opened` - Email was opened
- `email.clicked` - Link was clicked
- `email.bounced` - Email bounced
- `document.viewed` - Document was viewed

### Payload Format

```json
{
  "event": "email.opened",
  "timestamp": "2024-01-01T00:00:00Z",
  "data": {
    "tracking_id": "uuid",
    "email": "user@example.com",
    "ip_address": "192.168.1.1",
    "user_agent": "..."
  }
}
```

---

*Last updated: January 2026*
