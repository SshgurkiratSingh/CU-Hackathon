const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  role: {
    type: String,
    enum: ["farmer", "admin", "viewer"],
    default: "farmer",
  },
  siteIds: [String],
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date,
});

const telemetrySchema = new mongoose.Schema({
  siteId: { type: String, required: true },
  deviceId: String,
  sensorKey: String,
  sensorType: String,
  value: Number,
  unit: String,
  topic: String,
  timestamp: { type: Date, default: Date.now },
  userId: String,
});

const deviceSensorSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    sensorType: {
      type: String,
      enum: [
        "temperature",
        "humidity",
        "co2",
        "light",
        "soil_moisture",
        "barometer",
        "mmwave_presence",
        "vpd",
        "custom",
      ],
      default: "custom",
    },
    unit: { type: String, default: "" },
    mqttTopic: { type: String, required: true },
    widget: {
      type: String,
      enum: [
        "gauge",
        "line",
        "graph",
        "status",
        "sparkline",
        "number",
        "button",
        "led",
      ],
      default: "gauge",
    },
    widgetKind: {
      type: String,
      enum: ["data", "action"],
      default: "data",
    },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: false },
);

const deviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ["sensor", "actuator", "hybrid", "combined", "camera", "controller"],
    default: "sensor",
  },
  siteId: { type: String, required: true, index: true },
  status: {
    type: String,
    enum: ["online", "offline", "error", "maintenance", "active"],
    default: "active",
  },
  primarySensorKey: String,
  sensors: { type: [deviceSensorSchema], default: [] },
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const ruleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  siteId: { type: String, required: true },
  condition: {
    type: { type: String, enum: ["threshold", "llm", "time"] },
    value: String,
    description: String,
  },
  action: String,
  active: { type: Boolean, default: true },
  createdBy: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date,
});

const actionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: String,
  siteId: String,
  parameters: mongoose.Schema.Types.Mixed,
  status: {
    type: String,
    enum: ["pending", "executing", "completed", "failed"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
  executedAt: Date,
  result: mongoose.Schema.Types.Mixed,
});

const shadowSchema = new mongoose.Schema({
  deviceId: { type: String, required: true },
  desired: mongoose.Schema.Types.Mixed,
  reported: mongoose.Schema.Types.Mixed,
  updatedAt: { type: Date, default: Date.now },
});

const alertSchema = new mongoose.Schema({
  siteId: { type: String, required: true },
  severity: {
    type: String,
    enum: ["low", "medium", "high", "critical"],
    default: "medium",
  },
  message: String,
  resolved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  resolvedAt: Date,
});

const settingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: mongoose.Schema.Types.Mixed,
  updatedAt: { type: Date, default: Date.now },
});

const zoneSchema = new mongoose.Schema({
  siteId: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  type: { type: String, default: "vegetative" },
  description: { type: String, default: "" },
  crop: { type: String, default: "" },
  targets: {
    temp: Number,
    humidity: Number,
    co2: Number,
  },
  createdBy: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const llmThinkingLogSchema = new mongoose.Schema({
  ruleId: String,
  thinking: String,
  decision: String,
  confidence: Number,
  timestamp: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
const Telemetry = mongoose.model("Telemetry", telemetrySchema);
const Rule = mongoose.model("Rule", ruleSchema);
const Action = mongoose.model("Action", actionSchema);
const Shadow = mongoose.model("Shadow", shadowSchema);
const Alert = mongoose.model("Alert", alertSchema);
const Settings = mongoose.model("Settings", settingsSchema);
const Zone = mongoose.model("Zone", zoneSchema);
const LLMThinkingLog = mongoose.model("LLMThinkingLog", llmThinkingLogSchema);
const Device = mongoose.model("Device", deviceSchema);

module.exports = {
  User,
  Telemetry,
  Rule,
  Action,
  Shadow,
  Alert,
  Settings,
  Zone,
  LLMThinkingLog,
  Device,
};
