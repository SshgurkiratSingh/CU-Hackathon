# Greenhouse OS - IoT Automation Platform

**Status:** Phase 1 MVP - Complete & Production Ready  
**Last Updated:** February 16, 2026

## Overview

Greenhouse OS is an intelligent IoT automation platform that leverages AI-driven decision-making to optimize greenhouse operations. The system monitors environmental conditions and automatically triggers actions to maintain optimal growing conditions.

### Key Features

- **Real-time Telemetry**: Monitor temperature, humidity, soil moisture, and CO2 levels
- **AI-Powered Decisions**: Gemini LLM integration for intelligent automation rules
- **Action Automation**: Automated triggering of greenhouse systems (irrigation, ventilation, heating)
- **IoT Marketplace**: Pre-built solutions marketplace for rapid deployment
- **Kiosk Interface**: Touch-screen dashboard for on-site monitoring
- **Memory System**: Historical data storage and trend analysis

## Tech Stack

| Component      | Technology                    |
| -------------- | ----------------------------- |
| Backend        | Node.js 22 LTS + Express 4.18 |
| Database       | MongoDB 7.5 Atlas             |
| Message Queue  | MQTT 5.0 (mosquitto)          |
| AI Engine      | Google Gemini 3 Flash         |
| Authentication | JWT + bcryptjs                |
| ORM            | Mongoose 7.5                  |
| Logging        | Pino                          |

## Project Structure

```
backend/
├── src/
│   ├── services/        # Business logic services
│   ├── routes/          # API endpoints (11 modules)
│   ├── schemas/         # MongoDB data models (8 schemas)
│   ├── middleware/      # Authentication & authorization
│   └── index.js         # Main application
├── .env                 # Environment configuration
└── README.md           # Backend setup guide
```

## Quick Links

- [Setup Guide](../setup/SETUP.md) - Installation and configuration
- [API Documentation](../api/API.md) - Complete endpoint reference
- [Development Guide](../development/DEVELOPMENT.md) - For developers
- [Backend README](../../backend/README.md) - Backend-specific details

## Phase 1 Deliverables

✅ 5 Core Services (750+ LOC)
✅ 11 Route Modules (47+ endpoints)
✅ 8 Data Models (MongoDB schemas)
✅ JWT Authentication & Authorization
✅ MQTT Real-time Messaging
✅ Gemini AI Integration
✅ Error Handling & Logging
✅ Production-ready Backend

## Getting Started

For detailed setup instructions, see [Setup Guide](../setup/SETUP.md).

```bash
# Start backend
cd backend
npm install
npm start
```

Backend runs on `http://localhost:3000`
