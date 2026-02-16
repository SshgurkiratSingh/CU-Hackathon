# Development Guide

## Project Architecture

### Backend Structure

```
backend/
├── src/
│   ├── services/           # Business logic & integrations
│   │   ├── SessionManager.js     # Session handling
│   │   ├── LogicEngine.js        # Automation rules
│   │   ├── GeminiService.js      # AI/LLM integration
│   │   ├── ActionDispatcher.js   # IoT action execution
│   │   ├── MarketplaceService.js # Solution marketplace
│   │   ├── KioskService.js       # Kiosk dashboard
│   │   └── MemoryService.js      # Historical data
│   │
│   ├── routes/            # API endpoints (47+ endpoints)
│   │   ├── auth.js              # Authentication
│   │   ├── telemetry.js         # Sensor data
│   │   ├── rules.js             # Automation rules
│   │   ├── actions.js           # Trigger actions
│   │   ├── devices.js           # Device management
│   │   ├── alerts.js            # Alert system
│   │   ├── shadow.js            # Device shadows
│   │   ├── memory.js            # Historical data
│   │   ├── marketplace.js       # Solutions store
│   │   ├── settings.js          # System settings
│   │   ├── kiosk.js             # Kiosk interface
│   │   └── ai.js                # AI endpoints
│   │
│   ├── schemas/           # MongoDB models (8 schemas)
│   │   ├── User.js
│   │   ├── Site.js
│   │   ├── Device.js
│   │   ├── Telemetry.js
│   │   ├── Rule.js
│   │   ├── Action.js
│   │   ├── Alert.js
│   │   └── Memory.js
│   │
│   ├── middleware/        # Express middleware
│   │   └── index.js       # Auth & authorization
│   │
│   └── index.js           # Application entry point
│
├── package.json           # Dependencies
├── .env                   # Configuration
└── README.md             # Backend documentation
```

## Adding New Endpoints

### 1. Create Service (if needed)

```javascript
// src/services/MyService.js
const logger = require("pino")();

class MyService {
  async doSomething(data) {
    try {
      // Business logic
      logger.info({ data }, "Operation completed");
      return result;
    } catch (error) {
      logger.error({ error }, "Operation failed");
      throw error;
    }
  }
}

module.exports = new MyService();
```

### 2. Create Route Module

```javascript
// src/routes/myroute.js
const express = require("express");
const logger = require("pino")();
const router = express.Router();

router.post("/action", async (req, res) => {
  try {
    const { field } = req.body;

    // Validation
    if (!field) {
      return res.status(400).json({
        success: false,
        error: "Field is required",
      });
    }

    // Call service
    const result = await myService.doSomething(field);

    return res.status(200).json({
      success: true,
      message: "Action completed",
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error: error.message }, "Endpoint failed");
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

module.exports = router;
```

### 3. Register Route in index.js

```javascript
const myRoutes = require("./routes/myroute");

// Inside startServer()
app.use("/api/myroute", authMiddleware(sessionManager), myRoutes);
```

## Database Schema

### Adding New Schema

```javascript
// src/schemas/index.js
const mySchema = new mongoose.Schema({
  fieldName: { type: String, required: true },
  fieldValue: Number,
  createdAt: { type: Date, default: Date.now },
});

module.exports = { MyModel: mongoose.model("MyModel", mySchema) };
```

## Authentication & Authorization

### Protected Routes

All routes automatically get user info via middleware:

```javascript
router.get("/data", authMiddleware(sessionManager), async (req, res) => {
  const userId = req.user.userId; // Current user ID
  const sessionId = req.user.sessionId; // Session ID
  const userRole = req.user.role; // User role
});
```

### Role-Based Access

```javascript
app.use(
  "/api/admin",
  authMiddleware(sessionManager),
  authorize(["admin"]), // Only admin access
  adminRoutes,
);
```

## Logging

Use Pino for structured logging:

```javascript
const logger = require("pino")();

logger.info({ userId, action }, "User action");
logger.warn({ warning: "something" }, "Warning occurred");
logger.error({ error: err }, "Error occurred");
```

## Error Handling

Follow standard response format:

```javascript
// Success
res.json({
  success: true,
  message: "Description",
  data: {
    /* result */
  },
  timestamp: new Date().toISOString(),
});

// Error
res.status(status).json({
  success: false,
  error: "Error description",
  timestamp: new Date().toISOString(),
});
```

## MQTT Integration

### Publishing Messages

```javascript
const mqtt = require("mqtt");
const client = mqtt.connect(process.env.MQTT_BROKER_URL);

// Publish action
client.publish(
  "greenhouse/actions/farm1/trigger",
  JSON.stringify({
    action: "irrigation",
    duration: 300,
  }),
);
```

### Subscribing to Messages

```javascript
client.on("message", (topic, message) => {
  const data = JSON.parse(message);
  // Handle message
});
```

## Testing Endpoints

### Using curl

```bash
# GET with token
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/endpoint

# POST with JSON
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}' \
  http://localhost:3000/api/endpoint
```

### Using test scripts

See `/backend/test_all_endpoints.sh` for comprehensive E2E testing.

## Debugging

### Enable debug logging

```bash
LOG_LEVEL=debug npm start
```

### Check backend logs

```bash
tail -f /tmp/backend.log
```

### MongoDB queries

```javascript
const db = require("mongoose");
const result = await db.models.User.findById(userId);
```

## Performance Tips

1. **Index frequently queried fields**: Add MongoDB indexes for `siteId`, `userId`
2. **Pagination**: Use `limit` and `offset` for large datasets
3. **Caching**: Cache marketplace solutions and static settings
4. **Async operations**: Use async/await for I/O operations
5. **Connection pooling**: MongoDB connection pooling is handled by Mongoose

## Security Considerations

- ✅ All endpoints protected by JWT token verification
- ✅ Password hashing with bcryptjs (10 rounds)
- ✅ Role-based access control (RBAC)
- ✅ Input validation on all endpoints
- ⚠️ Use HTTPS in production
- ⚠️ Rotate API keys regularly
- ⚠️ Keep dependencies updated

## Deployment

See [Setup Guide](../setup/SETUP.md) for production deployment steps.

## Resources

- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [Pino Logger](https://getpino.io/)
- [JWT.io](https://jwt.io/)
- [MQTT Documentation](https://mqtt.org/)
