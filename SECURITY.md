# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability within FUXICO, please send an email to 
**security@fuxico.app**. All security vulnerabilities will be promptly addressed.

**Please do NOT create a public GitHub issue for security vulnerabilities.**

### What to Include

When reporting a vulnerability, please include:

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact assessment
- Suggested fix (if any)
- Your contact information

### Response Timeline

- **Initial response**: Within 24 hours
- **Status update**: Within 72 hours
- **Resolution**: 7-14 days (depending on severity)

## Security Measures

FUXICO implements the following security measures:

### Data Protection
- All data encrypted at rest and in transit (TLS 1.3)
- Row Level Security (RLS) on all database tables
- Sensitive data hashing with bcrypt

### Authentication & Authorization
- JWT authentication with short expiration
- Refresh token rotation
- Role-based access control (RBAC)
- Session management with secure cookies

### API Security
- Rate limiting on all endpoints
- Input validation with Zod schemas
- CORS restricted to allowed origins
- Security headers (CSP, X-Frame-Options, etc.)

### Infrastructure
- Supabase managed infrastructure
- Automated security updates
- Regular security audits
- DDoS protection

## Bug Bounty Program

We currently do not have a formal bug bounty program, but we appreciate
responsible disclosure and will acknowledge security researchers who
report valid vulnerabilities.

## Contact

For security-related inquiries: security@fuxico.app
