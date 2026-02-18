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
  intervalStart: { type: Date, index: true },
  timestamp: { type: Date, default: Date.now },
  receivedAt: { type: Date, default: Date.now },
  userId: String,
});

telemetrySchema.index({
  siteId: 1,
  deviceId: 1,
  sensorKey: 1,
  sensorType: 1,
  topic: 1,
  intervalStart: 1,
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
    commandTopic: { type: String, default: "" },
    actuatorType: {
      type: String,
      enum: ["fan", "led_pwm", "fan_pwm", "relay", "custom"],
      default: "custom",
    },
    actuatorConfig: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 100 },
      step: { type: Number, default: 1 },
      defaultValue: { type: Number, default: 0 },
    },
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
  actuatorOutputs: {
    type: [
      {
        key: { type: String, required: true },
        label: { type: String, required: true },
        outputType: {
          type: String,
          enum: ["fan", "led_pwm", "fan_pwm", "relay", "pump", "custom"],
          default: "custom",
        },
        commandTopic: { type: String, required: true },
        unit: { type: String, default: "" },
        min: { type: Number, default: 0 },
        max: { type: Number, default: 100 },
        step: { type: Number, default: 1 },
        defaultValue: { type: Number, default: 0 },
        linkedSensorKey: { type: String, default: "" },
        enabled: { type: Boolean, default: true },
      },
    ],
    default: [],
  },
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const ruleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  siteId: { type: String, required: true },
  condition: {
    type: {
      type: String,
      enum: ["threshold", "llm", "time", "event", "logic", "timer"],
    },
    value: String,
    description: String,
  },
  action: String,
  elseAction: String,
  eventType: String,
  trigger: {
    type: {
      type: String,
      enum: ["telemetry", "alert", "issue", "timer", "manual"],
      default: "telemetry",
    },
    match: mongoose.Schema.Types.Mixed,
    cron: String,
    customPrompt: String,
  },
  variables: {
    type: [
      {
        name: { type: String, required: true },
        source: {
          type: String,
          enum: ["telemetry", "device", "context", "constant"],
          default: "telemetry",
        },
        key: String,
        value: mongoose.Schema.Types.Mixed,
      },
    ],
    default: [],
  },
  logic: {
    operator: {
      type: String,
      enum: ["and", "or", "not", "gt", "gte", "lt", "lte", "eq", "neq"],
    },
    left: mongoose.Schema.Types.Mixed,
    right: mongoose.Schema.Types.Mixed,
    children: [mongoose.Schema.Types.Mixed],
  },
  timer: {
    intervalMinutes: Number,
    activeWindow: String,
    timezone: { type: String, default: "UTC" },
  },
  notifications: {
    enabled: { type: Boolean, default: false },
    mobileTopic: String,
    issueTopic: String,
  },
  active: { type: Boolean, default: true },
  createdBy: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date,
});

const importantActionSchema = new mongoose.Schema({
  siteId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  severity: {
    type: String,
    enum: ["low", "medium", "high", "critical"],
    default: "medium",
  },
  status: {
    type: String,
    enum: ["open", "in_progress", "done"],
    default: "open",
  },
  source: { type: String, default: "engine" },
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const assistantPlanSchema = new mongoose.Schema({
  siteId: { type: String, required: true, index: true },
  prompt: { type: String, required: true },
  plan: [String],
  actions: [mongoose.Schema.Types.Mixed],
  createdBy: String,
  createdAt: { type: Date, default: Date.now },
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
const ImportantAction = mongoose.model(
  "ImportantAction",
  importantActionSchema,
);
const AssistantPlan = mongoose.model("AssistantPlan", assistantPlanSchema);

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
  ImportantAction,
  AssistantPlan,
};
