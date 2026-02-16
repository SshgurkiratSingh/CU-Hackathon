#!/bin/bash

# Simplified start script for Greenhouse OS - Works without Docker/MongoDB/Redis
# Uses in-memory storage for quick testing

echo "🌱 Greenhouse OS Backend - In-Memory Testing Mode"
echo "===================================================="
echo ""

# Change to project directory
cd /home/gurkirat/Projects/CU-Hackathon

# Create .env if doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << 'EOF'
# Database
MONGODB_URI=mongodb://localhost:27017/greenhouse-os
MONGO_URI=mongodb://localhost:27017/greenhouse-os

# Redis
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# MQTT
MQTT_PROTOCOL=mqtt
MQTT_HOST=localhost
MQTT_PORT=1883
MQTT_USERNAME=
MQTT_PASSWORD=

# JWT
JWT_SECRET=dev-secret-key-change-in-production-$(date +%s)
JWT_EXPIRE=7d

# Gemini AI
GEMINI_API_KEY=demo-key
GEMINI_MODEL=gemini-2.0-flash
LLM_THINKING_ENABLED=true

# Application
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug
EOF
    echo "✓ .env created"
fi

# Check services
echo ""
echo "Checking services..."

MONGO_OK=0
REDIS_OK=0
MQTT_OK=0

# Try MongoDB
if mongosh --version > /dev/null 2>&1 || mongo --version > /dev/null 2>&1; then
    if ! pgrep mongod > /dev/null 2>&1; then
        echo "  Starting MongoDB..."
        mkdir -p /tmp/mongodb
        mongod --dbpath /tmp/mongodb --logpath /dev/null --fork > /dev/null 2>&1
        sleep 2
    fi
    if pgrep mongod > /dev/null 2>&1; then
        MONGO_OK=1
        echo "  ✓ MongoDB OK"
    fi
fi

# Try Redis
if command -v redis-server > /dev/null 2>&1; then
    if ! pgrep redis-server > /dev/null 2>&1; then
        echo "  Starting Redis..."
        redis-server --daemonize yes --port 6379 > /dev/null 2>&1
        sleep 1
    fi
    if pgrep redis-server > /dev/null 2>&1; then
        REDIS_OK=1
        echo "  ✓ Redis OK"
    fi
fi

# Try MQTT
if command -v mosquitto > /dev/null 2>&1; then
    if ! pgrep mosquitto > /dev/null 2>&1; then
        echo "  Starting MQTT..."
        mosquitto -d -p 1883 > /dev/null 2>&1
        sleep 1
    fi
    if pgrep mosquitto > /dev/null 2>&1 || netstat -an 2>/dev/null | grep -q ":1883"; then
        MQTT_OK=1
        echo "  ✓ MQTT OK"
    fi
fi

echo ""
if [ $MONGO_OK -eq 0 ]; then
    echo "⚠ MongoDB not available - testing with mock data"
fi
if [ $REDIS_OK -eq 0 ]; then
    echo "⚠ Redis not available - testing with in-memory sessions"
fi
if [ $MQTT_OK -eq 0 ]; then
    echo "⚠ MQTT not available - some real-time features will be disabled"
fi

echo ""
echo "Starting backend server..."
echo "  API: http://localhost:3000"
echo "  Health: http://localhost:3000/health"
echo ""

# Start backend
NODE_ENV=development npm start
