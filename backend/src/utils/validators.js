const pino = require("pino");

const logger = pino();

// Validation helpers
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateSensorType = (type) => {
  const validTypes = [
    "temperature",
    "humidity",
    "soil_moisture",
    "co2",
    "light",
    "ph",
    "ec",
    "custom",
  ];
  return validTypes.includes(type);
};

const validateActionType = (type) => {
  const validTypes = [
    "pump_on",
    "pump_off",
    "valve_open",
    "valve_close",
    "heater_on",
    "heater_off",
    "lights_on",
    "lights_off",
    "fan_on",
    "fan_off",
    "custom",
  ];
  return validTypes.includes(type);
};

const validateTelemetryData = (data) => {
  const required = [
    "siteId",
    "zoneId",
    "nodeId",
    "sensorType",
    "value",
    "unit",
  ];
  const missing = required.filter((field) => !data[field]);

  if (missing.length > 0) {
    return {
      valid: false,
      error: `Missing required fields: ${missing.join(", ")}`,
    };
  }

  if (!validateSensorType(data.sensorType)) {
    return { valid: false, error: `Invalid sensor type: ${data.sensorType}` };
  }

  if (typeof data.value !== "number") {
    return { valid: false, error: "Value must be a number" };
  }

  return { valid: true };
};

const validateRuleData = (data) => {
  const required = [
    "name",
    "triggerZone",
    "conditions",
    "logicType",
    "actions",
  ];
  const missing = required.filter((field) => !data[field]);

  if (missing.length > 0) {
    return {
      valid: false,
      error: `Missing required fields: ${missing.join(", ")}`,
    };
  }

  const validLogicTypes = ["HARD_LOGIC", "LLM_BASED", "MARKETPLACE_MODEL"];
  if (!validLogicTypes.includes(data.logicType)) {
    return { valid: false, error: `Invalid logic type: ${data.logicType}` };
  }

  return { valid: true };
};

// Safe error response
const errorResponse = (error, statusCode = 500) => {
  return {
    success: false,
    error: error.message || error,
    timestamp: new Date().toISOString(),
  };
};

// Success response
const successResponse = (data, message = "Success") => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
};

// Pagination helper
const getPaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

// Date range helper
const getDateRange = (query) => {
  const startDate = query.startDate
    ? new Date(query.startDate)
    : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const endDate = query.endDate ? new Date(query.endDate) : new Date();

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new Error("Invalid date format");
  }

  return { startDate, endDate };
};

module.exports = {
  validateEmail,
  validateSensorType,
  validateActionType,
  validateTelemetryData,
  validateRuleData,
  errorResponse,
  successResponse,
  getPaginationParams,
  getDateRange,
};
