#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Testing Gemini LLM Integration ===${NC}\n"

# Step 1: Register a user
echo -e "${BLUE}1. Registering user...${NC}"
REGISTER=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123",
    "name": "Test User"
  }')

echo $REGISTER | jq .

# Extract token
TOKEN=$(echo $REGISTER | jq -r '.data.token' 2>/dev/null)
if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo -e "${RED}✗ Failed to get auth token${NC}\n"
  exit 1
fi
echo -e "${GREEN}✓ Auth token obtained${NC}\n"

# Step 2: Test Gemini analyze endpoint
echo -e "${BLUE}2. Testing Gemini AI Analysis...${NC}"
ANALYSIS=$(curl -s -X POST http://localhost:3000/api/ai/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "condition": "High temperature and low soil moisture in greenhouse",
    "context": "Tomato farming - automated greenhouse"
  }')

echo $ANALYSIS | jq .

if echo $ANALYSIS | jq -e '.success' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Gemini LLM Analysis successful${NC}\n"
else
  echo -e "${RED}✗ Gemini LLM Analysis failed${NC}\n"
fi

# Step 3: Test Gemini decision endpoint
echo -e "${BLUE}3. Testing Gemini AI Decision Making...${NC}"
DECISION=$(curl -s -X POST http://localhost:3000/api/ai/decide \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "condition": "Temperature: 35°C, Humidity: 40%, Soil Moisture: 30%",
    "options": ["Activate cooling", "Start irrigation", "Increase ventilation"],
    "farm_id": "farm_123"
  }')

echo $DECISION | jq .

if echo $DECISION | jq -e '.success' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Gemini LLM Decision Making successful${NC}\n"
else
  echo -e "${RED}✗ Gemini LLM Decision Making failed${NC}\n"
fi

# Step 4: Test summarization endpoint
echo -e "${BLUE}4. Testing Gemini AI Summarization...${NC}"
SUMMARY=$(curl -s -X POST http://localhost:3000/api/ai/summarize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "telemetry": {
      "temperature": "35.2°C",
      "humidity": "42%",
      "soil_moisture": "28%",
      "co2": "450ppm"
    }
  }')

echo $SUMMARY | jq .

if echo $SUMMARY | jq -e '.success' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Gemini LLM Summarization successful${NC}\n"
else
  echo -e "${RED}✗ Gemini LLM Summarization failed${NC}\n"
fi

echo -e "${BLUE}=== Test Complete ===${NC}"
