# Setup & Installation Guide

## Prerequisites

- Node.js 22 LTS
- MongoDB 7.5 Atlas (or local instance)
- MQTT Broker (mosquitto)
- Google Gemini API Key

## Environment Configuration

### 1. Backend .env

Create `backend/.env` with:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/greenhouse-os

# MQTT
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=
MQTT_PASSWORD=

# AI/LLM
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-3-flash
LLM_THINKING_ENABLED=false

# Session Management
SESSION_STORE_TYPE=memory
SESSION_TIMEOUT_MS=86400000

# Logging
LOG_LEVEL=info
```

## Installation Steps

### 1. Clone Repository

```bash
git clone https://github.com/SshgurkiratSingh/CU-Hackathon.git
cd CU-Hackathon
```

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Configure MongoDB

- Create MongoDB Atlas cluster
- Add connection string to `.env` as `MONGODB_URI`
- Ensure network access is configured

### 4. Setup MQTT (Optional)

For local MQTT broker:
```bash
# Docker
docker run -d --name mosquitto -p 1883:1883 eclipse-mosquitto

# Or install locally
brew install mosquitto  # macOS
```

### 5. Start Backend

```bash
npm start
```

Server will start on `http://localhost:3000`

## Verify Installation

### Health Check
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-16T17:30:00.000Z",
  "uptime": 12345
}
```

### Test Authentication
```bash
# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "farmer@example.com",
    "password": "SecurePassword123",
    "name": "John Farmer"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "farmer@example.com",
    "password": "SecurePassword123"
  }'
```

## Troubleshooting

### MongoDB Connection Failed
- Verify connection string in `.env`
- Check MongoDB Atlas network access (IP whitelist)
- Confirm credentials are correct

### MQTT Connection Failed
- Ensure MQTT broker is running
- Check broker URL in `.env`
- Verify port 1883 is accessible

### Gemini API Errors
- Confirm `GEMINI_API_KEY` is set correctly
- Check API key has Generative AI permissions
- Verify model name is supported

### Port 3000 Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

## Next Steps

- See [API Documentation](../api/API.md) for endpoints
- Check [Development Guide](../development/DEVELOPMENT.md) for development
- Review [Backend README](../../backend/README.md) for technical details
