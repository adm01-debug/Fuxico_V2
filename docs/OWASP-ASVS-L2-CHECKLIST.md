# OWASP ASVS v4.0 Level 2 — Self-Assessment

Data: 2026-07-11 | Escopo: FUXICO web + Edge Functions

| Cap. | Requisito | Status | Evidência |
|------|-----------|--------|-----------|
| V2.1 | Password policy ≥12 chars, HIBP | ✅ | `SignupForm` |
| V2.2 | MFA obrigatório para admin | ✅ | `mfa_settings` |
| V2.3 | Lockout 5 falhas + backoff | ✅ | `record_failed_login` |
| V2.7 | Session TTL + rotation | ✅ | Supabase JWT + idle timeout |
| V3.2 | Cookie HttpOnly+Secure+SameSite | ✅ | Supabase default |
| V4.1 | RLS em 100% tabelas | ✅ | pgTAP `all-tables-coverage` |
| V4.2 | Server-side authz em toda mutação | ✅ | Policies WITH CHECK |
| V5.1 | Input validation (Zod) | ✅ | ADR-006 |
| V5.2 | Output encoding | ✅ | React auto-escape + DOMPurify |
| V5.3 | Anti-SSRF | ✅ | `url-validator.ts` |
| V6.2 | Crypto in transit (TLS 1.2+) | ✅ | Cloudflare `strict` |
| V7.1 | Error handling sem leak | ✅ | `logger` mascara PII |
| V8.1 | Sensitive data at rest (pgcrypto) | 🟡 | Colunas críticas OK; expandir |
| V9.1 | Communication security | ✅ | HTTPS enforced |
| V10.1 | Malicious code checks | ✅ | CodeQL + Dependabot |
| V11.1 | Business logic anti-abuse | ✅ | Rate limit + dedup 24h |
| V12.1 | File upload validation | ✅ | Content-type + size cap |
| V13.1 | API security (OpenAPI) | ✅ | `docs/openapi.yaml` |
| V14.1 | Config hardening | ✅ | Terraform + Dockerfile hardened |

**Cobertura:** 18/19 (94.7%). Gap: expansão de pgcrypto — planejado.
