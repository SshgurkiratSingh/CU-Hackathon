# Greenhouse OS - IoT Automation Platform

**Status:** ✅ Phase 1 MVP Complete | **Version:** 1.0.0 | **Date:** February 16, 2026

## 📋 Documentation

Comprehensive documentation organized by topic:

| Section | Purpose |
|---------|---------|
| [Project Overview](docs/project/README.md) | Project description and tech stack |
| [Setup Guide](docs/setup/SETUP.md) | Installation and configuration |
| [API Reference](docs/api/API.md) | Complete endpoint documentation |
| [Development Guide](docs/development/DEVELOPMENT.md) | Development and contribution guide |

## 🚀 Quick Start

```bash
# 1. Clone repository
git clone https://github.com/SshgurkiratSingh/CU-Hackathon.git
cd CU-Hackathon

# 2. Install dependencies
cd backend
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 4. Start backend
npm start
```

Backend will be available at `http://localhost:3000`

## ✅ Phase 1 Deliverables

- **5 Core Services** (750+ lines of code)
- **11 API Route Modules** (47+ endpoints)
- **8 MongoDB Data Models** with full schemas
- **JWT Authentication** with role-based access control
- **MQTT Integration** for real-time messaging
- **Gemini AI** integration for intelligent decisions
- **Comprehensive Logging** and error handling
- **Production-Ready** backend infrastructure

## 🏗️ Project Structure

```
CU-Hackathon/
├── docs/                    # Professional documentation
│   ├── project/            # Project overview
│   ├── setup/              # Installation guide
│   ├── api/                # API reference
│   └── development/        # Development guide
│
├── backend/                # Node.js backend
│   ├── src/
│   │   ├── services/       # Business logic (5 services)
│   │   ├── routes/         # API endpoints (11 modules)
│   │   ├── schemas/        # MongoDB models (8 schemas)
│   │   ├── middleware/     # Authentication
│   │   └── index.js        # Main application
│   ├── package.json
│   ├── .env
│   └── README.md
│
└── README.md               # This file
```

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 22 LTS |
| Framework | Express 4.18 |
| Database | MongoDB 7.5 Atlas |
| Message Queue | MQTT 5.0 |
| AI/LLM | Google Gemini 3 Flash |
| Authentication | JWT + bcryptjs |
| Logging | Pino |

## 📊 API Endpoints

**Total:** 47+ endpoints across 11 route modules

### Core Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/telemetry` - Submit sensor data
- `GET /api/telemetry` - Retrieve telemetry
- `POST /api/rules` - Create automation rules
- `POST /api/actions` - Trigger actions
- `POST /api/ai/analyze` - AI condition analysis
- `POST /api/ai/decide` - AI decision making
- `GET /api/health` - System health check

See [API Reference](docs/api/API.md) for complete documentation.

## 🔐 Security Features

✅ JWT token-based authentication
✅ Role-based access control (RBAC)
✅ Bcryptjs password hashing (10 rounds)
✅ Input validation on all endpoints
✅ Secure session management
✅ MQTT message verification

## 🧪 Testing

### Health Check
```bash
curl http://localhost:3000/health
```

### Authentication Test
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "name": "Test User"
  }'
```

## 📝 Development

### For Developers
- See [Development Guide](docs/development/DEVELOPMENT.md)
- Add new endpoints following established patterns
- Use provided services for business logic
- Follow error handling conventions
- Add comprehensive logging

### For DevOps
- See [Setup Guide](docs/setup/SETUP.md)
- Production deployment steps
- Environment configuration
- Database setup
- MQTT broker configuration

## 🤝 Contributing

1. Clone the repository
2. Create a feature branch
3. Make changes following the development guide
4. Test thoroughly
5. Submit pull request

## 📞 Support

For issues or questions:
1. Check the [Setup Guide](docs/setup/SETUP.md)
2. Review [API Reference](docs/api/API.md)
3. Consult [Development Guide](docs/development/DEVELOPMENT.md)
4. Check backend logs: `tail -f /tmp/backend.log`

## 📄 License

[Add your license here]

---

**Last Updated:** February 16, 2026  
**Maintained By:** Development Team
