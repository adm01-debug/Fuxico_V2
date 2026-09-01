# API Reference Completa

## Autenticação

```
Authorization: Bearer <JWT_TOKEN>
```

## Endpoints

### POST /create-tracking
Cria novo rastreamento.

**Request:**
```json
{"recipientEmail": "string", "subject": "string", "trackOpens": true}
```

**Response:**
```json
{"success": true, "data": {"trackingId": "uuid", "pixelUrl": "string"}}
```

### GET /get-tracking-stats
Lista estatísticas.

**Query Params:** `limit`, `offset`, `dateFrom`, `dateTo`

### POST /report-bounce
Reporta bounce.

**Request:**
```json
{"trackingId": "string", "bounceType": "hard|soft", "reason": "string"}
```

### GET /geo-lookup
Busca geolocalização.

**Query:** `ip=1.2.3.4`

## Webhooks

Eventos: `email.opened`, `email.clicked`, `email.bounced`

## Rate Limits

- 100 requests/minuto
- Header: `X-RateLimit-Remaining`
