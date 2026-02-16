#!/bin/bash

# Quick Backend Service Test

BASE_URL="http://localhost:3000"

echo "=========================================="
echo "  Backend Service Quick Test"
echo "=========================================="
echo ""

# 1. Health
echo "[1/5] Health..."
curl -s -m 3 "$BASE_URL/health" | jq -r '"\(.status) - uptime: \(.uptime)s"'
echo ""

# 2. Auth
echo "[2/5] Authentication..."
TOKEN=$(curl -s -m 5 -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "TestPassword123"}' \
    | jq -r '.data.token // "FAILED"')
if [ "$TOKEN" != "FAILED" ] && [ -n "$TOKEN" ]; then
    echo "✅ Token received: ${TOKEN:0:30}..."
else
    echo "❌ Authentication FAILED"
    exit 1
fi
echo ""

# 3. Telemetry (with timeout)
echo "[3/5] Telemetry (timeout: 5s)..."
timeout 5 curl -s "$BASE_URL/api/telemetry?limit=2" \
    -H "Authorization: Bearer $TOKEN" | jq -r '"\(.success) - \(.message // "No message")"' || echo "⚠️  Timeout or error"
echo ""

# 4. Rules
echo "[4/5] Rules (timeout: 5s)..."
timeout 5 curl -s "$BASE_URL/api/rules?limit=2" \
    -H "Authorization: Bearer $TOKEN" | jq -r '"\(.success) - \(.message // "No message")"' || echo "⚠️  Timeout or error"
echo ""

# 5. Devices
echo "[5/5] Devices (timeout: 5s)..."
timeout 5 curl -s "$BASE_URL/api/devices?limit=2" \
    -H "Authorization: Bearer $TOKEN" | jq -r '"\(.success) - \(.message // "No message")"' || echo "⚠️  Timeout or error"
echo ""

echo "=========================================="
echo "  Test Complete"
echo "=========================================="
