# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability, please send an email to 
security@fuxico.app. Do NOT create a public GitHub issue.

### What to include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Timeline:
- Initial response: 24 hours
- Status update: 72 hours
- Resolution: 7-14 days (depending on severity)

## Security Measures

### 🔒 IP Whitelist (NEW)

All Edge Functions are protected by IP whitelist. Only authorized IPs can access the API.

**Configuration:**
1. Set `WHITELISTED_IPS` environment variable in Supabase Dashboard
2. Or edit `supabase/functions/_shared/ip-whitelist.ts`

**See:** [docs/IP-SECURITY.md](docs/IP-SECURITY.md) for detailed configuration.

### Other Security Measures

- ✅ All data encrypted at rest and in transit
- ✅ Row Level Security (RLS) on all database tables
- ✅ Rate limiting on all API endpoints (100 req/min)
- ✅ Input validation with Zod schemas
- ✅ CORS restricted to allowed origins
- ✅ JWT authentication with expiration
- ✅ Security headers on all responses
- ✅ Request logging and monitoring

## Security Headers

All responses include:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## Rate Limiting

| Endpoint Type | Limit |
|--------------|-------|
| Public (tracking) | 1000 req/min |
| Authenticated | 100 req/min |
| Admin | 200 req/min |

## Audit Logging

All access attempts are logged:
- Successful accesses
- Blocked IPs
- Rate limit violations
- Authentication failures
