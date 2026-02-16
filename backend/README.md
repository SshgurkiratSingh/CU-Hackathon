# Greenhouse OS Backend

Production-ready Node.js backend for Greenhouse OS with AI-powered decision logic, real-time MQTT pub/sub, and MongoDB persistence.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
node src/index.js

# Or with hot-reload
npm run dev
```

Server runs on **http://localhost:3000**

## 📋 Prerequisites

- Node.js >= 18.0.0
- MongoDB Atlas account (connection string in `.env`)
- Gemini API key (in `.env`)
- MQTT broker (default: localhost:1883)

## 🔧 Configuration

Create `.env` file with:

```env
MONGO_URI=mongodb+srv://...
MONGO_DB_NAME=CU
GEMINI_API_KEY=your-api-key
GEMINI_MODEL=gemini-2.0-flash-exp-01-21
JWT_SECRET=your-secret
MQTT_HOST=localhost
MQTT_PORT=1883
PORT=3000
```

## 📁 Project Structure

```
src/
├── index.js              # Express server & initialization
├── middleware/           # Auth & validation middleware
├── services/             # Business logic services
│   ├── SessionManager    # JWT + in-memory sessions
│   ├── GeminiService     # AI inference
│   ├── LogicEngine       # Rule evaluation
│   ├── ActionDispatcher  # MQTT actions
│   └── ...
├── routes/               # API endpoints (11 modules, 60+)
└── schemas/              # MongoDB models (Mongoose)
```

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/register` - Create user account
- `POST /api/auth/login` - Get JWT token
- `POST /api/auth/logout` - Revoke session
- `POST /api/auth/kiosk` - Create kiosk session

### Telemetry

- `GET /api/telemetry` - Get sensor data
- `POST /api/telemetry` - Store sensor reading

### Rules & AI

- `GET /api/rules` - List automation rules
- `POST /api/rules` - Create rule with Gemini AI
- `PUT /api/rules/:id` - Update rule
- `DELETE /api/rules/:id` - Delete rule

### Actions

- `GET /api/actions` - List pending actions
- `POST /api/actions` - Create action
- `GET /api/actions/:id` - Get action status

### Device Shadow

- `GET /api/shadow/:deviceId` - Get device state
- `PATCH /api/shadow/:deviceId` - Update state

### Additional Modules

- `/api/alerts` - Alert management
- `/api/settings` - System configuration
- `/api/marketplace` - Service discovery
- `/api/memory` - LLM thinking logs
- `/api/devices` - Device management
- `/api/kiosk` - Kiosk display interface

## 🔑 Key Features

✅ **No Redis**: In-memory session storage  
✅ **Latest Gemini Model**: gemini-2.0-flash-exp-01-21  
✅ **MongoDB Persistence**: Cloud Atlas integration  
✅ **Real-time MQTT**: IoT pub/sub messaging  
✅ **JWT Authentication**: Secure API access  
✅ **AI Decision Logic**: Gemini-powered rules  
✅ **Kiosk Mode**: Touchscreen interface support

## 📊 Services

| Service            | Purpose                  |
| ------------------ | ------------------------ |
| SessionManager     | JWT + in-memory sessions |
| GeminiService      | AI inference & analysis  |
| LogicEngine        | Rule evaluation engine   |
| MarketplaceService | Service discovery        |
| KioskService       | Kiosk UI operations      |
| ActionDispatcher   | MQTT event publishing    |
| MemoryService      | LLM decision logging     |

## 🧪 Testing

```bash
# Health check
curl http://localhost:3000/health

# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@farm.com","password":"Pass123!","name":"Farmer","role":"farmer"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@farm.com","password":"Pass123!"}'

# Get token from login response, then:
curl http://localhost:3000/api/telemetry \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🗄️ MongoDB Collections

Automatically created by Mongoose:

- `users` - User accounts
- `telemetries` - Sensor readings
- `rules` - Automation rules
- `actions` - Scheduled actions
- `shadows` - Device state
- `alerts` - System alerts
- `settings` - Configuration
- `llmthinkinglog` - AI decision history

## 🚨 Error Handling

All endpoints return structured responses:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {},
  "timestamp": "2026-02-16T12:00:00.000Z"
}
```

## 📝 Logging

Pino structured logging to stdout. Set `LOG_LEVEL` environment variable:

- `debug` - Verbose output
- `info` - Standard output (default)
- `warn` - Warnings only
- `error` - Errors only

## 🔐 Security

- Passwords hashed with bcryptjs
- JWT tokens expire after 24h (configurable)
- Kiosk sessions expire after 8h
- CORS enabled for frontend integration
- Request validation with joi

## 📦 Dependencies

```json
{
  "express": "^4.18.2",
  "mongoose": "^7.5.0",
  "mqtt": "^5.0.0",
  "@google/generative-ai": "^0.24.1",
  "jsonwebtoken": "^9.0.2",
  "bcryptjs": "^2.4.3",
  "pino": "^8.16.1"
}
```

**No Redis** ✅  
**No Express server bundled** ✅

## 🚀 Production Deployment

```bash
# Build (no build needed - Node.js project)
npm ci

# Start
NODE_ENV=production node src/index.js

# Docker
docker build -t greenhouse-backend .
docker run -p 3000:3000 --env-file .env greenhouse-backend
```

## 📞 Support

- Health check: `GET /health`
- Logs: stdout (Pino format)
- Issues: Check MongoDB connection & Gemini API key

---

**Status**: ✅ Production Ready  
**Last Updated**: 2026-02-16
