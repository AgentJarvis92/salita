#!/bin/bash

# Salita Production Security Testing Script
# Generated: 2026-02-16 19:22 EST

BASE_URL="https://salita-production.up.railway.app"
REPORT_FILE="$HOME/.openclaw/workspace/projects/salita/qa-reports/security-test-results.txt"

echo "=== SALITA PRODUCTION SECURITY TESTING ===" > "$REPORT_FILE"
echo "Test Date: $(date)" >> "$REPORT_FILE"
echo "Target: $BASE_URL" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 1. Security Headers Test
echo "=== 1. SECURITY HEADERS TEST ===" >> "$REPORT_FILE"
echo "Testing security headers on main page..." >> "$REPORT_FILE"
HEADERS=$(curl -I -s "$BASE_URL")
echo "$HEADERS" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Check for specific headers
echo "Header Analysis:" >> "$REPORT_FILE"
echo "$HEADERS" | grep -i "content-security-policy" && echo "✅ CSP: Present" >> "$REPORT_FILE" || echo "❌ CSP: Missing" >> "$REPORT_FILE"
echo "$HEADERS" | grep -i "x-frame-options" && echo "✅ X-Frame-Options: Present" >> "$REPORT_FILE" || echo "❌ X-Frame-Options: Missing" >> "$REPORT_FILE"
echo "$HEADERS" | grep -i "x-content-type-options" && echo "✅ X-Content-Type-Options: Present" >> "$REPORT_FILE" || echo "❌ X-Content-Type-Options: Missing" >> "$REPORT_FILE"
echo "$HEADERS" | grep -i "x-xss-protection" && echo "✅ X-XSS-Protection: Present" >> "$REPORT_FILE" || echo "❌ X-XSS-Protection: Missing" >> "$REPORT_FILE"
echo "$HEADERS" | grep -i "referrer-policy" && echo "✅ Referrer-Policy: Present" >> "$REPORT_FILE" || echo "❌ Referrer-Policy: Missing" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Check for information leakage
echo "Information Leakage Check:" >> "$REPORT_FILE"
echo "$HEADERS" | grep -i "x-powered-by" && echo "⚠️  X-Powered-By detected (info leak)" >> "$REPORT_FILE" || echo "✅ No X-Powered-By header" >> "$REPORT_FILE"
echo "$HEADERS" | grep -i "server:" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 2. Protected Route Test
echo "=== 2. PROTECTED ROUTE ACCESS TEST ===" >> "$REPORT_FILE"
echo "Testing unauthorized access to protected routes..." >> "$REPORT_FILE"

# Test /dashboard (should redirect to login)
DASHBOARD_TEST=$(curl -I -s "$BASE_URL/dashboard")
echo "Testing /dashboard:" >> "$REPORT_FILE"
echo "$DASHBOARD_TEST" | head -n 5 >> "$REPORT_FILE"
if echo "$DASHBOARD_TEST" | grep -q "307.*login\|302.*login\|401"; then
    echo "✅ Dashboard properly protected (redirects to login)" >> "$REPORT_FILE"
else
    echo "❌ Dashboard may not be properly protected" >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

# Test /api routes without auth
echo "Testing API routes without authentication:" >> "$REPORT_FILE"
API_TEST=$(curl -I -s "$BASE_URL/api/user")
echo "$API_TEST" | head -n 5 >> "$REPORT_FILE"
if echo "$API_TEST" | grep -q "401\|403"; then
    echo "✅ API properly protected" >> "$REPORT_FILE"
else
    echo "⚠️  API may not require authentication" >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

# 3. Cookie Security Test
echo "=== 3. COOKIE SECURITY TEST ===" >> "$REPORT_FILE"
echo "Testing cookie security attributes..." >> "$REPORT_FILE"
COOKIE_TEST=$(curl -I -s -c - "$BASE_URL/login" | grep -i "set-cookie")
echo "$COOKIE_TEST" >> "$REPORT_FILE"

if echo "$COOKIE_TEST" | grep -qi "httponly"; then
    echo "✅ HttpOnly flag present" >> "$REPORT_FILE"
else
    echo "⚠️  HttpOnly flag may be missing" >> "$REPORT_FILE"
fi

if echo "$COOKIE_TEST" | grep -qi "secure"; then
    echo "✅ Secure flag present" >> "$REPORT_FILE"
else
    echo "⚠️  Secure flag may be missing" >> "$REPORT_FILE"
fi

if echo "$COOKIE_TEST" | grep -qi "samesite"; then
    echo "✅ SameSite attribute present" >> "$REPORT_FILE"
else
    echo "⚠️  SameSite attribute may be missing" >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

# 4. Input Validation Test (Email)
echo "=== 4. INPUT VALIDATION TEST ===" >> "$REPORT_FILE"
echo "Testing email validation (client-side observable via form behavior)" >> "$REPORT_FILE"
echo "Manual test required: Submit invalid email formats" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 5. OAuth Security Test
echo "=== 5. OAUTH REDIRECT SECURITY ===" >> "$REPORT_FILE"
echo "Testing Google OAuth redirect..." >> "$REPORT_FILE"
OAUTH_TEST=$(curl -L -s "$BASE_URL/auth/google" | head -n 20)
echo "$OAUTH_TEST" | grep -i "redirect_uri\|state" >> "$REPORT_FILE"
if echo "$OAUTH_TEST" | grep -q "salita-production.up.railway.app"; then
    echo "✅ OAuth redirect uses production URL" >> "$REPORT_FILE"
else
    echo "⚠️  OAuth redirect URL may not match production" >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

# 6. HTTPS Enforcement
echo "=== 6. HTTPS ENFORCEMENT ===" >> "$REPORT_FILE"
HTTP_TEST=$(curl -I -s "http://salita-production.up.railway.app" 2>&1 | head -n 5)
echo "$HTTP_TEST" >> "$REPORT_FILE"
if echo "$HTTP_TEST" | grep -qi "301\|302.*https\|upgrade-insecure-requests"; then
    echo "✅ HTTP redirects to HTTPS" >> "$REPORT_FILE"
else
    echo "⚠️  HTTP may not redirect to HTTPS" >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

echo "=== SECURITY TEST COMPLETE ===" >> "$REPORT_FILE"
echo "Review results above and perform manual browser-based tests for:" >> "$REPORT_FILE"
echo "- XSS injection attempts in forms" >> "$REPORT_FILE"
echo "- Password strength validation" >> "$REPORT_FILE"
echo "- CSRF token validation" >> "$REPORT_FILE"
echo "- Session timeout behavior" >> "$REPORT_FILE"
