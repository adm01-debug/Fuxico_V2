#!/bin/bash
# FUXICO Security Check Script
# Run before deploy to ensure security is properly configured

set -e

echo "🔒 FUXICO Security Pre-Deploy Check"
echo "======================================"
echo ""

ERRORS=0
WARNINGS=0

# Check 1: IP Whitelist configuration
echo "📋 Checking IP Whitelist..."
if [ -z "$WHITELISTED_IPS" ]; then
  echo "   ⚠️  WARNING: WHITELISTED_IPS not set in environment"
  echo "   ℹ️  Default IPs (localhost only) will be used"
  ((WARNINGS++))
else
  IPS=$(echo "$WHITELISTED_IPS" | tr ',' '\n' | wc -l)
  echo "   ✅ WHITELISTED_IPS configured with $IPS IP(s)"
fi

# Check 2: Supabase URL
echo ""
echo "📋 Checking Supabase Configuration..."
if [ -z "$SUPABASE_URL" ] && [ -z "$VITE_SUPABASE_URL" ]; then
  echo "   ❌ ERROR: SUPABASE_URL not configured"
  ((ERRORS++))
else
  echo "   ✅ Supabase URL configured"
fi

# Check 3: Service Role Key (should NOT be in frontend)
echo ""
echo "📋 Checking Service Role Key..."
if [ -n "$VITE_SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "   ❌ ERROR: Service Role Key exposed in VITE_ variable!"
  echo "   ℹ️  Service Role Key should ONLY be in Edge Functions"
  ((ERRORS++))
else
  echo "   ✅ Service Role Key not exposed in frontend"
fi

# Check 4: Edge Functions shared files
echo ""
echo "📋 Checking Edge Functions security files..."
if [ -f "supabase/functions/_shared/ip-whitelist.ts" ]; then
  echo "   ✅ ip-whitelist.ts exists"
else
  echo "   ❌ ERROR: ip-whitelist.ts not found"
  ((ERRORS++))
fi

if [ -f "supabase/functions/_shared/security-middleware.ts" ]; then
  echo "   ✅ security-middleware.ts exists"
else
  echo "   ❌ ERROR: security-middleware.ts not found"
  ((ERRORS++))
fi

# Summary
echo ""
echo "======================================"
if [ $ERRORS -gt 0 ]; then
  echo "❌ Security check FAILED: $ERRORS error(s), $WARNINGS warning(s)"
  echo ""
  echo "Fix the errors above before deploying!"
  exit 1
else
  echo "✅ Security check PASSED: 0 errors, $WARNINGS warning(s)"
  echo ""
  if [ $WARNINGS -gt 0 ]; then
    echo "⚠️  Review warnings before deploying to production"
  fi
  exit 0
fi
