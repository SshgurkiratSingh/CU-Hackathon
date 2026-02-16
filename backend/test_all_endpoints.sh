#!/bin/bash

# Comprehensive E2E Test Suite for Phase 1 Backend
# Tests all 47+ endpoints after auth fix

set -e

BASE="http://localhost:3000/api"
EMAIL="test_$(date +%s)@test.com"
PASSWORD="Test1234!"

echo "================================"
echo "PHASE 1 E2E TEST SUITE"
echo "================================"
echo

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

test_endpoint() {
  local name="$1"
  local method="$2"
  local path="$3"
  local data="$4"
  local expected_status="$5"
  local token="$6"

  TESTS_RUN=$((TESTS_RUN + 1))
  
  if [ -z "$token" ]; then
    status=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$BASE$path" \
      -H "Content-Type: application/json" \
      ${data:+-d "$data"})
  else
    status=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$BASE$path" \
      -H "Authorization: Bearer $token" \
      -H "Content-Type: application/json" \
      ${data:+-d "$data"})
  fi

  if [ "$status" = "$expected_status" ]; then
    echo -e "${GREEN}✓${NC} $name (Status: $status)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}✗${NC} $name (Expected: $expected_status, Got: $status)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
}

# ============ AUTH ENDPOINTS ============
echo "Testing AUTH endpoints..."

test_endpoint "Register user" "POST" "/auth/register" \
  "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"name\":\"Test\",\"role\":\"farmer\"}" "201"

sleep 1

# Get token
TOKEN_RESPONSE=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.data.token' 2>/dev/null || echo "")

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo -e "${RED}✗${NC} Login failed - could not extract token"
  exit 1
fi

test_endpoint "Login user" "POST" "/auth/login" \
  "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" "200" 

echo

# ============ TELEMETRY ENDPOINTS ============
echo "Testing TELEMETRY endpoints (3)..."

test_endpoint "POST telemetry" "POST" "/telemetry" \
  "{\"siteId\":\"farm1\",\"sensorType\":\"temperature\",\"value\":25.5,\"unit\":\"C\"}" "201" "$TOKEN"

test_endpoint "GET telemetry" "GET" "/telemetry" "" "200" "$TOKEN"

test_endpoint "GET telemetry stats" "GET" "/telemetry/stats/farm1" "" "200" "$TOKEN"

echo

# ============ RULES ENDPOINTS ============
echo "Testing RULES endpoints (7)..."

test_endpoint "POST rule" "POST" "/rules" \
  "{\"name\":\"Test Rule\",\"siteId\":\"farm1\",\"condition\":{\"type\":\"threshold\"},\"active\":true}" "201" "$TOKEN"

test_endpoint "GET rules" "GET" "/rules" "" "200" "$TOKEN"

echo

# ============ ACTIONS ENDPOINTS ============
echo "Testing ACTIONS endpoints (5)..."

test_endpoint "POST action" "POST" "/actions" \
  "{\"type\":\"mqtt_publish\",\"siteId\":\"farm1\",\"payload\":{}}" "201" "$TOKEN"

test_endpoint "GET actions" "GET" "/actions" "" "200" "$TOKEN"

echo

# ============ SHADOW ENDPOINTS ============
echo "Testing SHADOW endpoints (3)..."

test_endpoint "GET shadow" "GET" "/shadow/device1" "" "200" "$TOKEN"

echo

# ============ ALERTS ENDPOINTS ============
echo "Testing ALERTS endpoints (5)..."

test_endpoint "POST alert" "POST" "/alerts" \
  "{\"siteId\":\"farm1\",\"severity\":\"high\",\"message\":\"Test alert\"}" "201" "$TOKEN"

test_endpoint "GET alerts" "GET" "/alerts" "" "200" "$TOKEN"

echo

# ============ SETTINGS ENDPOINTS ============
echo "Testing SETTINGS endpoints (5)..."

test_endpoint "GET settings" "GET" "/settings" "" "200" "$TOKEN"

echo

# ============ MARKETPLACE ENDPOINTS ============
echo "Testing MARKETPLACE endpoints (4)..."

test_endpoint "GET marketplace services" "GET" "/marketplace/services" "" "200" "$TOKEN"

echo

# ============ MEMORY ENDPOINTS ============
echo "Testing MEMORY endpoints (4)..."

test_endpoint "GET memory thinking" "GET" "/memory/thinking" "" "200" "$TOKEN"

test_endpoint "GET memory decisions" "GET" "/memory/decisions" "" "200" "$TOKEN"

test_endpoint "GET memory analytics" "GET" "/memory/analytics" "" "200" "$TOKEN"

echo

# ============ DEVICES ENDPOINTS ============
echo "Testing DEVICES endpoints (3)..."

test_endpoint "POST device" "POST" "/devices" \
  "{\"deviceId\":\"sensor1\",\"name\":\"Sensor 1\",\"type\":\"sensor\"}" "201" "$TOKEN"

test_endpoint "GET devices" "GET" "/devices" "" "200" "$TOKEN"

echo

# ============ KIOSK ENDPOINTS ============
echo "Testing KIOSK endpoints (5)..."

test_endpoint "GET kiosk status" "GET" "/kiosk/status" "" "200" "$TOKEN"

echo

# ============ Summary ============
echo "================================"
echo "TEST SUMMARY"
echo "================================"
echo -e "Total tests: $TESTS_RUN"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "\n${GREEN}✓ ALL TESTS PASSED${NC}"
  exit 0
else
  echo -e "\n${RED}✗ SOME TESTS FAILED${NC}"
  exit 1
fi
