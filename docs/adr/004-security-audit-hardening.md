# ADR-004: Security Audit Hardening (March 2026)

## Status
Accepted

## Context
A comprehensive security audit identified 9 critical and 19 high-severity vulnerabilities across the FUXICO platform, including SSRF, Open Redirect, LLM Prompt Injection, HTML Injection, and missing ownership checks.

## Decision
We implemented 8 rounds of security fixes creating 6 shared security modules:

1. **url-validator.ts** - Prevents SSRF by blocking private IPs, metadata endpoints, and non-HTTP protocols
2. **html-sanitizer.ts** - Strips dangerous HTML (script, iframe, event handlers) from email content
3. **llm-sanitizer.ts** - Detects prompt injection patterns and wraps user input with safe delimiters
4. **schemas.ts** - SafeMetadataSchema replacing z.record(z.unknown()) with bounded primitive-only records
5. **PrivateRoute.tsx** - Route-level auth guard redirecting unauthenticated users
6. **Security headers** - CSP without unsafe-inline, HSTS, Permissions-Policy

## Consequences
- All edge functions now validate metadata with SafeMetadataSchema (max 20 keys, primitives only)
- All email-sending functions sanitize HTML before storage
- LLM functions detect and block prompt injection attempts
- CORS no longer accepts wildcard chrome-extension:// origins
- TypeScript strict mode enabled across the codebase
- Coverage threshold enforced at 60% minimum

## References
- SYSTEM_AUDIT.md - Full audit report
- SCORECARD_22_DIMENSIONS.md - 22-dimension scoring
