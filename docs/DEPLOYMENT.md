# FUXICO Deployment Guide

## Prerequisites

- Node.js 20+
- npm 10+
- Supabase CLI
- Docker (optional)

## Environment Variables

Create `.env` file:

```env
VITE_SUPABASE_URL=https://[PROJECT_ID].supabase.co
VITE_SUPABASE_ANON_KEY=[ANON_KEY]
```

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Supabase Setup

```bash
# Login to Supabase
supabase login

# Link project
supabase link --project-ref [PROJECT_ID]

# Push database migrations
supabase db push

# Deploy Edge Functions
supabase functions deploy
```

## Production Deployment

### Option 1: Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Option 2: Docker

```bash
# Build image
docker build -t fuxico .

# Run container
docker run -p 3000:3000 fuxico
```

### Option 3: Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

## CI/CD Pipeline

The project includes GitHub Actions workflows:

- `.github/workflows/ci.yml` - Lint, test, build
- `.github/workflows/security.yml` - Security scanning
- `.github/workflows/changelog.yml` - Auto changelog

## Monitoring

- APM: `src/lib/apm.ts` with Web Vitals
- Errors: Sentry integration
- Logs: Structured logging to console

## Health Check

```bash
curl https://[YOUR_DOMAIN]/functions/v1/health-check
```

## Rollback

```bash
# Supabase Edge Functions
supabase functions deploy [function-name] --version [previous-version]

# Frontend (Vercel)
vercel rollback
```
