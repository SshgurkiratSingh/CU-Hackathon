require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const pino = require("pino");
const mqtt = require("mqtt");

// Services
const SessionManager = require("./services/SessionManager");
const LogicEngine = require("./services/LogicEngine");
const GeminiService = require("./services/GeminiService");
const MarketplaceService = require("./services/MarketplaceService");
const KioskService = require("./services/KioskService");
const ActionDispatcher = require("./services/ActionDispatcher");
const MemoryService = require("./services/MemoryService");

// Routes
const authRoutes = require("./routes/auth");
const telemetryRoutes = require("./routes/telemetry");
const rulesRoutes = require("./routes/rules");
const actionsRoutes = require("./routes/actions");
const shadowRoutes = require("./routes/shadow");
const alertsRoutes = require("./routes/alerts");
const settingsRoutes = require("./routes/settings");
const marketplaceRoutes = require("./routes/marketplace");
const kioskRoutes = require("./routes/kiosk");
const memoryRoutes = require("./routes/memory");
const devicesRoutes = require("./routes/devices");
const aiRoutes = require("./routes/ai");

// Middleware
const {
  authMiddleware,
  kioskMiddleware,
  authorize,
  requestLogger,
} = require("./middleware");

const logger = pino();
const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const connectDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
    });
    logger.info("MongoDB connected");
  } catch (error) {
    logger.warn({ error: error.message }, "MongoDB connection failed");
  }
};

// MQTT connection
let mqttClient;
const connectMQTT = () => {
  try {
    const mqttUrl = `${process.env.MQTT_PROTOCOL || "mqtt"}://${process.env.MQTT_HOST || "localhost"}:${process.env.MQTT_PORT || 1883}`;
    mqttClient = mqtt.connect(mqttUrl, {
      clientId: `gateway-${Date.now()}`,
      clean: true,
      connectTimeout: 5000,
      reconnectPeriod: 3000,
    });

    mqttClient.on("connect", () => {
      logger.info("MQTT connected");
    });

    mqttClient.on("error", (error) => {
      logger.error({ error }, "MQTT error");
    });
  } catch (error) {
    logger.error({ error }, "Failed to connect to MQTT");
  }
};

// Initialize services
let sessionManager;
let logicEngine;
let geminiService;
let marketplaceService;
let kioskService;
let actionDispatcher;
let memoryService;

const initializeServices = async () => {
  sessionManager = new SessionManager();
  geminiService = new GeminiService();
  marketplaceService = new MarketplaceService();
  kioskService = new KioskService();
  actionDispatcher = new ActionDispatcher(mqttClient || {});
  memoryService = new MemoryService();
  logicEngine = new LogicEngine(geminiService, marketplaceService);
  logger.info("All services initialized");
};

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Attach services to request object
app.use((req, res, next) => {
  req.sessionManager = sessionManager;
  req.logicEngine = logicEngine;
  req.geminiService = geminiService;
  req.marketplaceService = marketplaceService;
  req.kioskService = kioskService;
  req.actionDispatcher = actionDispatcher;
  req.memoryService = memoryService;
  next();
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Error handling (must be registered before routes for catching errors)
app.use((err, req, res, next) => {
  logger.error({ error: err }, "Unhandled error");
  res.status(500).json({ error: err.message || "Internal server error" });
});

const startServer = async () => {
  try {
    await connectDatabase();
    connectMQTT();
    await initializeServices();

    // Register routes AFTER services are initialized
    app.use("/api/auth", authRoutes);
    app.use("/api/telemetry", authMiddleware(sessionManager), telemetryRoutes);
    app.use(
      "/api/rules",
      authMiddleware(sessionManager),
      authorize(["farmer", "admin"]),
      rulesRoutes,
    );
    app.use("/api/actions", authMiddleware(sessionManager), actionsRoutes);
    app.use("/api/shadow", authMiddleware(sessionManager), shadowRoutes);
    app.use("/api/alerts", authMiddleware(sessionManager), alertsRoutes);
    app.use(
      "/api/settings",
      authMiddleware(sessionManager),
      authorize(["admin"]),
      settingsRoutes,
    );
    app.use("/api/marketplace", authMiddleware(sessionManager), marketplaceRoutes);
    app.use("/api/memory", authMiddleware(sessionManager), memoryRoutes);
    app.use("/api/devices", authMiddleware(sessionManager), devicesRoutes);

    // AI routes with Gemini service injection
    aiRoutes.setGeminiService(geminiService);
    app.use("/api/ai", authMiddleware(sessionManager), aiRoutes);

    // Kiosk routes
    app.post("/api/auth/kiosk", kioskMiddleware(sessionManager), authRoutes);
    app.use("/api/kiosk", kioskMiddleware(sessionManager), kioskRoutes);

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error({ error }, "Critical error during startup");
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  logger.info("Shutting down gracefully");
  try {
    await mongoose.disconnect();
    logger.info("MongoDB disconnected");
    if (mqttClient) {
      mqttClient.end();
      logger.info("MQTT disconnected");
    }
    process.exit(0);
  } catch (error) {
    logger.error({ error }, "Error during shutdown");
    process.exit(1);
  }
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

startServer();
