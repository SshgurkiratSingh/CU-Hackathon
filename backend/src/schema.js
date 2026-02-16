import Joi from "joi";

/**
 * Schema for incoming sensor telemetry payload validation
 * Ensures all incoming messages contain required fields
 */
export const sensorTelemetrySchema = Joi.object({
  value: Joi.number().required().messages({
    "number.base": "Sensor value must be a number",
    "any.required": "Sensor value is required",
  }),
  unit: Joi.string().required().messages({
    "string.base": "Unit must be a string",
    "any.required": "Unit is required",
  }),
  seq: Joi.number().integer().min(0).required().messages({
    "number.base": "Sequence number must be an integer",
    "number.min": "Sequence number cannot be negative",
    "any.required": "Sequence number is required",
  }),
  // Optional fields that may be present in advanced payloads
  metadata: Joi.object().optional(),
  timestamp: Joi.date().optional(),
}).unknown(true); // Allow extra fields for forward compatibility

/**
 * Schema for ESP-NOW binary payload structure
 * Defines expected fields after decoding from binary format
 */
export const espNowDecodedSchema = Joi.object({
  node_id: Joi.string().required(),
  sensor_type: Joi.string().required(),
  value: Joi.number().required(),
  unit: Joi.string().required(),
  seq: Joi.number().integer().required(),
  rssi: Joi.number().optional(), // Signal strength
  battery_level: Joi.number().min(0).max(100).optional(),
}).unknown(false);

/**
 * Schema for MQTT topic path validation
 * Pattern: greenhouse/{site}/{zone}/{sensor_type}/{node_id}
 */
export const topicPathSchema = Joi.object({
  site: Joi.string()
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .required(),
  zone: Joi.string()
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .required(),
  sensor_type: Joi.string()
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .required(),
  node_id: Joi.string()
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .required(),
});

/**
 * Schema for enriched gateway message
 * Final format after all processing
 */
export const enrichedMessageSchema = Joi.object({
  value: Joi.number().required(),
  unit: Joi.string().required(),
  seq: Joi.number().integer().required(),
  gateway_ts: Joi.date().iso().required(), // ISO 8601 timestamp
  message_uuid: Joi.string().uuid({ version: "uuidv4" }).required(),
  confidence: Joi.number().min(0).max(1).required(),
  site: Joi.string()
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .required(),
  zone: Joi.string()
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .required(),
  sensor_type: Joi.string()
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .required(),
  node_id: Joi.string()
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .required(),
  topic_path: Joi.string().required(),
}).unknown(false);

/**
 * Validation utility function with comprehensive error logging
 * @param {any} data - Data to validate
 * @param {Joi.Schema} schema - Joi schema to validate against
 * @param {object} logger - Pino logger instance
 * @returns {Promise<{valid: boolean, value?: any, error?: Error}>}
 */
export async function validatePayload(data, schema, logger) {
  try {
    const { value, error } = schema.validate(data, {
      abortEarly: false, // Collect all errors
      stripUnknown: false, // Keep unknown fields for logging
    });

    if (error) {
      logger.warn(
        {
          validation_errors: error.details.map((d) => ({
            key: d.context.key,
            message: d.message,
            type: d.type,
          })),
          input_data: data,
        },
        "Validation failed for incoming payload",
      );
      return {
        valid: false,
        error: new Error(`Validation failed: ${error.message}`),
      };
    }

    return { valid: true, value };
  } catch (err) {
    logger.error({ error: err }, "Unexpected error during validation");
    return {
      valid: false,
      error: new Error("Internal validation error"),
    };
  }
}
