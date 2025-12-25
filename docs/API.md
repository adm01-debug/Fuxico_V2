# FUXICO API Documentation

## Base URL

```
https://[PROJECT_ID].supabase.co/functions/v1
```

## Authentication

All authenticated endpoints require a Bearer token:

```
Authorization: Bearer <JWT_TOKEN>
```

## Endpoints

### Create Tracking

```http
POST /create-tracking
```

**Request Body:**
```json
{
  "recipientEmail": "user@example.com",
  "subject": "Email Subject",
  "senderEmail": "sender@example.com",
  "metadata": {}
}
```

**Response:**
```json
{
  "success": true,
  "trackingId": "abc123",
  "pixelUrl": "https://.../track-pixel?t=abc123",
  "links": []
}
```

### Get Tracking Stats

```http
GET /get-tracking-stats?limit=100&offset=0
```

**Query Parameters:**
- `limit` (optional): 1-500, default 100
- `offset` (optional): default 0
- `cursor` (optional): ISO datetime for pagination
- `status` (optional): all|opened|clicked|bounced

**Response:**
```json
{
  "emails": [...],
  "pagination": {
    "limit": 100,
    "offset": 0,
    "nextCursor": "2025-01-01T00:00:00Z",
    "hasMore": true
  }
}
```

### Track Pixel (Public)

```http
GET /track-pixel?t={trackingId}
```

Returns 1x1 transparent GIF and records open event.

### Track Link (Public)

```http
GET /track-link?l={linkId}&t={trackingId}
```

Records click event and redirects to original URL.

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| create-tracking | 100/min |
| get-tracking-stats | 60/min |
| track-pixel | 200/min |
| track-link | 100/min |

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Validation error |
| 401 | Unauthorized |
| 404 | Resource not found |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

## Webhooks

Configure webhooks in Settings to receive real-time events:

```json
{
  "event": "email.opened",
  "trackingId": "abc123",
  "timestamp": "2025-01-01T00:00:00Z",
  "data": {
    "ip": "1.2.3.4",
    "userAgent": "...",
    "location": {...}
  }
}
```
