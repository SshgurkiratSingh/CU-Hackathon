#!/bin/bash

# Comprehensive startup script for Greenhouse OS Backend
# Handles: services check, MongoDB/Redis setup, environment config, backend start

set -e

PROJECT_DIR="/home/gurkirat/Projects/CU-Hackathon"
LOG_DIR="$PROJECT_DIR/logs"
ENV_FILE="$PROJECT_DIR/.env"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

log_error() {
  echo -e "${RED}✗ $1${NC}"
}

log_info() {
  echo -e "${YELLOW}ℹ $1${NC}"
}

log_header() {
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Create logs directory
mkdir -p "$LOG_DIR"

log_header "🌱 Greenhouse OS Backend - Startup Script"

# Step 1: Setup environment file
log_header "STEP 1: Environment Configuration"

if [ ! -f "$ENV_FILE" ]; then
  log_info "Creating .env from .env.example"
  cp "$PROJECT_DIR/.env.example" "$ENV_FILE"
  
  # Update critical variables
  sed -i "s|MONGODB_URI=.*|MONGODB_URI=mongodb://localhost:27017/greenhouse-os|g" "$ENV_FILE"
  sed -i "s|REDIS_URL=.*|REDIS_URL=redis://localhost:6379|g" "$ENV_FILE"
  sed -i "s|MQTT_BROKER=.*|MQTT_BROKER=mqtt://localhost:1883|g" "$ENV_FILE"
  sed -i "s|JWT_SECRET=.*|JWT_SECRET=dev-secret-key-$(openssl rand -hex 16)|g" "$ENV_FILE"
  
  log_success ".env file created and configured"
else
  log_success ".env file already exists"
fi

# Step 2: Check and setup MongoDB
log_header "STEP 2: MongoDB Setup"

if command -v mongod &> /dev/null; then
  log_info "MongoDB installed"
  if ! pgrep -x "mongod" > /dev/null; then
    log_info "Starting MongoDB..."
    mkdir -p /tmp/mongodb-data
    mongod --dbpath /tmp/mongodb-data --logpath "$LOG_DIR/mongodb.log" --fork > /dev/null 2>&1
    sleep 2
    if pgrep -x "mongod" > /dev/null; then
      log_success "MongoDB started"
    else
      log_error "MongoDB failed to start - continuing without it"
      log_info "To install: sudo apt-get install -y mongodb"
    fi
  else
    log_success "MongoDB already running"
  fi
else
  log_error "MongoDB not installed"
  log_info "To install: sudo apt-get install -y mongodb"
  log_info "Or use MongoDB Atlas: Update MONGODB_URI in .env"
fi

# Step 3: Check and setup Redis
log_header "STEP 3: Redis Setup"

if command -v redis-server &> /dev/null; then
  log_info "Redis installed"
  if ! pgrep -x "redis-server" > /dev/null; then
    log_info "Starting Redis..."
    redis-server --daemonize yes --logfile "$LOG_DIR/redis.log" > /dev/null 2>&1
    sleep 1
    if pgrep -x "redis-server" > /dev/null; then
      log_success "Redis started"
    else
      log_error "Redis failed to start - continuing without it"
    fi
  else
    log_success "Redis already running"
  fi
else
  log_error "Redis not installed"
  log_info "To install: sudo apt-get install -y redis-server"
  log_info "Or use Redis Cloud: Update REDIS_URL in .env"
fi

# Step 4: Check and setup MQTT
log_header "STEP 4: MQTT Broker Setup"

if command -v mosquitto &> /dev/null; then
  if ! pgrep -x "mosquitto" > /dev/null; then
    log_info "Starting MQTT broker (mosquitto)..."
    mosquitto -d -p 1883 -c /etc/mosquitto/mosquitto.conf > /dev/null 2>&1 || \
    mosquitto -d -p 1883 > "$LOG_DIR/mosquitto.log" 2>&1
    sleep 1
    if netstat -an 2>/dev/null | grep -q ":1883"; then
      log_success "MQTT broker started"
    else
      log_error "MQTT broker failed to start"
    fi
  else
    log_success "MQTT broker already running"
  fi
else
  log_error "mosquitto not installed"
  log_info "To install: sudo apt-get install -y mosquitto"
fi

# Step 5: Install npm dependencies if needed
log_header "STEP 5: Node Dependencies"

if [ ! -d "$PROJECT_DIR/node_modules" ] || [ -z "$(npm list express 2>/dev/null | grep express)" ]; then
  log_info "Installing npm dependencies..."
  cd "$PROJECT_DIR"
  npm install > "$LOG_DIR/npm-install.log" 2>&1
  log_success "Dependencies installed"
else
  log_success "Dependencies already installed"
fi

# Step 6: Check backend server
log_header "STEP 6: Backend Server Status"

cd "$PROJECT_DIR"

if [ -f "src/index.js" ]; then
  log_success "Backend code found"
  
  # Check if server is already running
  if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    log_success "Backend already running on port 3000"
    log_info "Access the API at: http://localhost:3000"
  else
    log_info "Starting backend server..."
    log_info "Server will run on: http://localhost:3000"
    log_info "Logs will be saved to: $LOG_DIR/backend.log"
    
    # Start backend in background
    NODE_ENV=development npm start > "$LOG_DIR/backend.log" 2>&1 &
    BACKEND_PID=$!
    
    # Wait for server to start
    sleep 3
    
    if ps -p $BACKEND_PID > /dev/null; then
      log_success "Backend server started (PID: $BACKEND_PID)"
      
      # Test health endpoint
      sleep 2
      if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        log_success "Backend health check passed"
      else
        log_info "Health check pending - server still initializing"
      fi
    else
      log_error "Backend failed to start"
      log_info "Check logs: tail -f $LOG_DIR/backend.log"
      exit 1
    fi
  fi
else
  log_error "Backend code not found at src/index.js"
  exit 1
fi

# Summary
log_header "📊 Startup Summary"

echo ""
echo "Services Status:"
pgrep -x "mongod" > /dev/null && echo "  ✓ MongoDB running" || echo "  ✗ MongoDB NOT running"
pgrep -x "redis-server" > /dev/null && echo "  ✓ Redis running" || echo "  ✗ Redis NOT running"
netstat -an 2>/dev/null | grep -q ":1883" && echo "  ✓ MQTT broker running" || echo "  ✗ MQTT broker NOT running"
lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 && echo "  ✓ Backend running (port 3000)" || echo "  ✗ Backend NOT running"

echo ""
echo "🚀 Quick Start Guide:"
echo "  1. Test APIs: bash $PROJECT_DIR/test-api.sh"
echo "  2. Publish MQTT: bash $PROJECT_DIR/publish-mqtt.sh"
echo "  3. View logs: tail -f $LOG_DIR/backend.log"
echo "  4. API Docs: http://localhost:3000/api-docs"
echo "  5. Dashboard: http://localhost:3000/kiosk"

echo ""
echo "📝 Environment:"
echo "  API: http://localhost:3000"
echo "  MongoDB: mongodb://localhost:27017/greenhouse-os"
echo "  Redis: redis://localhost:6379"
echo "  MQTT: mqtt://localhost:1883"
echo "  Logs: $LOG_DIR/"

echo ""
log_success "Greenhouse OS Backend ready for testing!"
log_header "Running in development mode"

# Keep the process running
wait
