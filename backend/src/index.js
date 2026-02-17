require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const pino = require("pino");
const mqtt = require("mqtt");
const { Device, Telemetry } = require("./schemas");

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
const zonesRoutes = require("./routes/zones");

// Middleware
const {
  authMiddleware,
  kioskMiddleware,
  authorize,
  requestLogger,
} = require("./middleware");

const logger = pino();
const app = express();
const PORT = 2500;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";
const isProduction = process.env.NODE_ENV === "production";

const allowedOrigins = CORS_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const localNetworkOriginPattern =
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/;

const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser clients like curl/postman with no origin header
    if (!origin) return callback(null, true);
    if (localNetworkOriginPattern.test(origin)) return callback(null, true);
    // In development, allow any frontend origin (localhost/LAN/IP)
    if (!isProduction) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

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

    try {
      const deviceCollection = mongoose.connection.collection("devices");
      const indexes = await deviceCollection.indexes();
      const legacyNodeIdIndex = indexes.find(
        (index) => index.name === "nodeId_1" && index.unique,
      );

      if (legacyNodeIdIndex) {
        await deviceCollection.dropIndex("nodeId_1");
        logger.warn(
          "Dropped legacy unique index devices.nodeId_1 to allow new device creation",
        );
      }
    } catch (indexError) {
      logger.warn(
        { error: indexError.message },
        "Device index reconciliation skipped",
      );
    }
  } catch (error) {
    logger.warn({ error: error.message }, "MongoDB connection failed");
  }
};

// MQTT connection
let mqttClient;

const parseMqttMessage = (messageBuffer) => {
  const raw = messageBuffer.toString();
  try {
    return JSON.parse(raw);
  } catch {
    const numeric = Number(raw);
    if (!Number.isNaN(numeric)) return { value: numeric };
    return { value: raw };
  }
};

const storeTelemetryFromMqtt = async (topic, payload) => {
  try {
    const device = await Device.findOne({ "sensors.mqttTopic": topic }).lean();
    if (!device) return;

    const sensor = (device.sensors || []).find(
      (entry) => entry.mqttTopic === topic,
    );
    if (!sensor) return;

    const value = Number(payload.value);
    if (Number.isNaN(value)) return;

    await Telemetry.create({
      siteId: String(payload.siteId || device.siteId || "default"),
      deviceId: String(device.deviceId),
      sensorKey: sensor.key,
      sensorType: String(payload.sensorType || sensor.sensorType || "custom"),
      value,
      unit: String(payload.unit || sensor.unit || ""),
      topic,
      timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
    });
  } catch (error) {
    logger.warn(
      { error: error.message, topic },
      "Failed to persist MQTT telemetry",
    );
  }
};

const subscribeConfiguredMqttTopics = async () => {
  if (!mqttClient || !mqttClient.subscribe) return;
  try {
    const devices = await Device.find({}).lean();
    const topics = new Set();
    devices.forEach((device) => {
      (device.sensors || []).forEach((sensor) => {
        if (sensor.mqttTopic) topics.add(sensor.mqttTopic);
      });
    });

    topics.forEach((topic) => mqttClient.subscribe(topic));
    // Fallback wildcard for greenhouse telemetry style topics
    mqttClient.subscribe("greenhouse/+/telemetry/#");
    logger.info({ topics: topics.size }, "MQTT topic subscriptions ready");
  } catch (error) {
    logger.warn({ error: error.message }, "Failed to subscribe MQTT topics");
  }
};

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
      subscribeConfiguredMqttTopics();
    });

    mqttClient.on("message", async (topic, message) => {
      const payload = parseMqttMessage(message);
      await storeTelemetryFromMqtt(topic, payload);
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
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
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

    const optionalAuthMiddleware = (req, res, next) => {
      const authHeader = req.headers.authorization;
      if (!authHeader) return next();
      return authMiddleware(sessionManager)(req, res, next);
    };

    // Register routes AFTER services are initialized
    app.use("/api/auth", authRoutes);
    app.use("/api/telemetry", optionalAuthMiddleware, telemetryRoutes);
    app.use(
      "/api/rules",
      authMiddleware(sessionManager),
      authorize(["farmer", "admin"]),
      rulesRoutes,
    );
    app.use("/api/actions", authMiddleware(sessionManager), actionsRoutes);
    app.use("/api/shadow", authMiddleware(sessionManager), shadowRoutes);
    app.use("/api/alerts", optionalAuthMiddleware, alertsRoutes);
    app.use(
      "/api/settings",
      authMiddleware(sessionManager),
      authorize(["admin"]),
      settingsRoutes,
    );
    app.use(
      "/api/marketplace",
      authMiddleware(sessionManager),
      marketplaceRoutes,
    );
    app.use("/api/memory", authMiddleware(sessionManager), memoryRoutes);
    app.use("/api/devices", optionalAuthMiddleware, devicesRoutes);
    app.use("/api/zones", optionalAuthMiddleware, zonesRoutes);

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
