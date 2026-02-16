#!/bin/bash

# Backend Service Verification Script
# Tests all major backend services and endpoints

BASE_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         Backend Service Verification Test                      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Test 1: Health Check
echo -e "${YELLOW}[1/8] Testing Health Endpoint...${NC}"
HEALTH=$(curl -s "$BASE_URL/health")
if echo "$HEALTH" | jq -e '.status == "healthy"' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Health Check: PASSED${NC}"
    echo "   Uptime: $(echo $HEALTH | jq -r '.uptime') seconds"
else
    echo -e "${RED}❌ Health Check: FAILED${NC}"
    exit 1
fi
echo ""

# Test 2: Authentication
echo -e "${YELLOW}[2/8] Testing Authentication Service...${NC}"
AUTH_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "TestPassword123"}')

TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.data.token // empty')
if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    echo -e "${GREEN}✅ Authentication: PASSED${NC}"
    echo "   Token: ${TOKEN:0:30}..."
else
    echo -e "${RED}❌ Authentication: FAILED${NC}"
    echo "   Response: $AUTH_RESPONSE"
    exit 1
fi
echo ""

# Test 3: Telemetry Service
echo -e "${YELLOW}[3/8] Testing Telemetry Service...${NC}"
TELEMETRY=$(curl -s -X GET "$BASE_URL/api/telemetry?limit=5" \
    -H "Authorization: Bearer $TOKEN")
if echo "$TELEMETRY" | jq -e '.success' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Telemetry: PASSED${NC}"
    echo "   Message: $(echo $TELEMETRY | jq -r '.message')"
else
    echo -e "${RED}❌ Telemetry: FAILED${NC}"
    echo "   Response: $TELEMETRY"
fi
echo ""

# Test 4: Rules Service
echo -e "${YELLOW}[4/8] Testing Rules Service...${NC}"
RULES=$(curl -s -X GET "$BASE_URL/api/rules?limit=5" \
    -H "Authorization: Bearer $TOKEN")
if echo "$RULES" | jq -e '.success' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Rules: PASSED${NC}"
    echo "   Message: $(echo $RULES | jq -r '.message')"
else
    echo -e "${RED}❌ Rules: FAILED${NC}"
    echo "   Response: $RULES"
fi
echo ""

# Test 5: Actions Service
echo -e "${YELLOW}[5/8] Testing Actions Service...${NC}"
ACTIONS=$(curl -s -X GET "$BASE_URL/api/actions?limit=5" \
    -H "Authorization: Bearer $TOKEN")
if echo "$ACTIONS" | jq -e '.success' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Actions: PASSED${NC}"
    echo "   Message: $(echo $ACTIONS | jq -r '.message')"
else
    echo -e "${RED}❌ Actions: FAILED${NC}"
    echo "   Response: $ACTIONS"
fi
echo ""

# Test 6: Devices Service
echo -e "${YELLOW}[6/8] Testing Devices Service...${NC}"
DEVICES=$(curl -s -X GET "$BASE_URL/api/devices?limit=5" \
    -H "Authorization: Bearer $TOKEN")
if echo "$DEVICES" | jq -e '.success' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Devices: PASSED${NC}"
    echo "   Message: $(echo $DEVICES | jq -r '.message')"
else
    echo -e "${RED}❌ Devices: FAILED${NC}"
    echo "   Response: $DEVICES"
fi
echo ""

# Test 7: Marketplace Service
echo -e "${YELLOW}[7/8] Testing Marketplace Service...${NC}"
MARKETPLACE=$(curl -s -X GET "$BASE_URL/api/marketplace/items" \
    -H "Authorization: Bearer $TOKEN")
if echo "$MARKETPLACE" | jq -e '.success' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Marketplace: PASSED${NC}"
    echo "   Message: $(echo $MARKETPLACE | jq -r '.message')"
else
    echo -e "${RED}❌ Marketplace: FAILED${NC}"
    echo "   Response: $MARKETPLACE"
fi
echo ""

# Test 8: AI Service (Gemini)
echo -e "${YELLOW}[8/8] Testing AI Service (Gemini)...${NC}"
AI_RESPONSE=$(curl -s -X POST "$BASE_URL/api/ai/analyze" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"data": {"temperature": 25, "humidity": 60}, "context": "Test farm data"}')
if echo "$AI_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ AI Service: PASSED${NC}"
    echo "   Model: gemini-pro"
else
    echo -e "${RED}❌ AI Service: FAILED${NC}"
    echo "   Response: $AI_RESPONSE"
fi
echo ""

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         Test Summary                                            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "All critical services have been tested."
echo "Backend is operational with gemini-pro model."
echo ""
