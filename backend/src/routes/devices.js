const express = require("express");
const pino = require("pino");
const mongoose = require("mongoose");
const { Device, Action } = require("../schemas");
const { authMiddleware } = require("../middleware");

const logger = pino();
const router = express.Router();

const SUPPORTED_SENSOR_TYPES = new Set([
  "temperature",
  "humidity",
  "co2",
  "light",
  "soil_moisture",
  "barometer",
  "mmwave_presence",
  "vpd",
  "custom",
]);

const SUPPORTED_DEVICE_TYPES = new Set([
  "sensor",
  "actuator",
  "hybrid",
  "combined",
  "camera",
  "controller",
]);

const SUPPORTED_WIDGET_TYPES = new Set([
  "gauge",
  "line",
  "graph",
  "status",
  "sparkline",
  "number",
  "button",
  "led",
]);

const ACTION_WIDGET_TYPES = new Set(["button", "led"]);
const SUPPORTED_WIDGET_KINDS = new Set(["data", "action"]);
const SUPPORTED_ACTUATOR_TYPES = new Set([
  "fan",
  "led_pwm",
  "fan_pwm",
  "relay",
  "custom",
]);

const SUPPORTED_OUTPUT_TYPES = new Set([
  "fan",
  "led_pwm",
  "fan_pwm",
  "relay",
  "pump",
  "custom",
]);

function normalizeDeviceType(rawType) {
  const normalized = String(rawType || "sensor")
    .trim()
    .toLowerCase();
  return SUPPORTED_DEVICE_TYPES.has(normalized) ? normalized : "sensor";
}

function normalizeSensors(rawSensors = [], deviceId = "device") {
  return rawSensors
    .filter((sensor) => sensor && sensor.mqttTopic)
    .map((sensor, index) => {
      const key = String(sensor.key || `sensor_${index + 1}`).trim();
      const sensorType = String(sensor.sensorType || "custom")
        .trim()
        .toLowerCase();
      const widget = String(sensor.widget || "gauge")
        .trim()
        .toLowerCase();
      const widgetKindRaw = String(sensor.widgetKind || "")
        .trim()
        .toLowerCase();
      const actuatorType = String(sensor.actuatorType || "custom")
        .trim()
        .toLowerCase();
      const min = Number(sensor?.actuatorConfig?.min ?? 0);
      const max = Number(sensor?.actuatorConfig?.max ?? 100);
      const step = Number(sensor?.actuatorConfig?.step ?? 1);
      const defaultValue = Number(sensor?.actuatorConfig?.defaultValue ?? 0);
      const normalizedWidget = SUPPORTED_WIDGET_TYPES.has(widget)
        ? widget
        : "gauge";
      const widgetKind = SUPPORTED_WIDGET_KINDS.has(widgetKindRaw)
        ? widgetKindRaw
        : ACTION_WIDGET_TYPES.has(normalizedWidget)
          ? "action"
          : "data";
      return {
        key,
        label: String(sensor.label || key).trim(),
        sensorType: SUPPORTED_SENSOR_TYPES.has(sensorType)
          ? sensorType
          : "custom",
        unit: String(sensor.unit || "").trim(),
        mqttTopic: String(sensor.mqttTopic).trim(),
        commandTopic: String(
          sensor.commandTopic || sensor.mqttTopic || "",
        ).trim(),
        actuatorType: SUPPORTED_ACTUATOR_TYPES.has(actuatorType)
          ? actuatorType
          : "custom",
        actuatorConfig: {
          min: Number.isFinite(min) ? min : 0,
          max: Number.isFinite(max) ? max : 100,
          step: Number.isFinite(step) && step > 0 ? step : 1,
          defaultValue: Number.isFinite(defaultValue) ? defaultValue : 0,
        },
        widget: normalizedWidget,
        widgetKind,
        isPrimary: Boolean(sensor.isPrimary),
      };
    });
}

function normalizeActuatorOutputs(rawOutputs = []) {
  return rawOutputs
    .filter((output) => output && output.commandTopic)
    .map((output, index) => {
      const outputType = String(output.outputType || "custom")
        .trim()
        .toLowerCase();

      const min = Number(output.min ?? 0);
      const max = Number(output.max ?? 100);
      const step = Number(output.step ?? 1);
      const defaultValue = Number(output.defaultValue ?? 0);

      return {
        key: String(output.key || `output_${index + 1}`).trim(),
        label: String(
          output.label || output.key || `Output ${index + 1}`,
        ).trim(),
        outputType: SUPPORTED_OUTPUT_TYPES.has(outputType)
          ? outputType
          : "custom",
        commandTopic: String(output.commandTopic || "").trim(),
        unit: String(output.unit || "").trim(),
        min: Number.isFinite(min) ? min : 0,
        max: Number.isFinite(max) ? max : 100,
        step: Number.isFinite(step) && step > 0 ? step : 1,
        defaultValue: Number.isFinite(defaultValue) ? defaultValue : 0,
        linkedSensorKey: String(output.linkedSensorKey || "").trim(),
        enabled: output.enabled !== false,
      };
    });
}

function resolvePrimarySensorKey(sensors, requestedPrimaryKey) {
  if (!Array.isArray(sensors) || sensors.length === 0) return undefined;
  const requested = requestedPrimaryKey
    ? sensors.find((s) => s.key === requestedPrimaryKey)
    : undefined;
  const marked = sensors.find((s) => s.isPrimary);
  const primary = requested || marked || sensors[0];
  return primary?.key;
}

async function findDeviceByIdentifier(identifier) {
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    const byId = await Device.findById(identifier);
    if (byId) return byId;
  }
  return Device.findOne({ deviceId: identifier });
}

router.get("/", authMiddleware, async (req, res) => {
  try {
    const { siteId } = req.query;
    const filter = siteId ? { siteId } : {};
    const devices = await Device.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: devices, count: devices.length });
  } catch (error) {
    logger.error({ error }, "Failed to fetch devices");
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/topics", authMiddleware, async (req, res) => {
  try {
    const devices = await Device.find({}).lean();
    const topics = devices.flatMap((device) =>
      (device.sensors || []).map((sensor) => ({
        siteId: device.siteId,
        deviceId: device.deviceId,
        deviceName: device.name,
        sensorKey: sensor.key,
        sensorType: sensor.sensorType,
        topic: sensor.mqttTopic,
        unit: sensor.unit,
        widget: sensor.widget,
        widgetKind: sensor.widgetKind,
        isPrimary: device.primarySensorKey === sensor.key,
      })),
    );
    res.json({ success: true, data: topics, count: topics.length });
  } catch (error) {
    logger.error({ error }, "Failed to fetch device topics");
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      deviceId,
      name,
      type,
      siteId,
      sensors = [],
      actuatorOutputs = [],
      primarySensorKey,
      metadata,
    } = req.body;
    if (!deviceId || !name || !siteId)
      return res.status(400).json({ success: false, error: "Missing fields" });

    const requestedDeviceId = String(deviceId).trim();
    if (!requestedDeviceId) {
      return res
        .status(400)
        .json({ success: false, error: "deviceId is required" });
    }

    const normalizedType = normalizeDeviceType(type);
    const normalizedSensors = normalizeSensors(sensors, requestedDeviceId);
    const normalizedOutputs = normalizeActuatorOutputs(actuatorOutputs);

    const sensorsRequired =
      normalizedType !== "actuator" && normalizedType !== "controller";

    if (sensorsRequired && normalizedSensors.length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one sensor with mqttTopic is required",
      });
    }

    if (
      (normalizedType === "actuator" ||
        normalizedType === "hybrid" ||
        normalizedType === "combined") &&
      normalizedOutputs.length === 0
    ) {
      return res.status(400).json({
        success: false,
        error: "At least one actuator output with commandTopic is required",
      });
    }

    const resolvedPrimarySensorKey = resolvePrimarySensorKey(
      normalizedSensors,
      primarySensorKey,
    );

    let created = null;
    let finalDeviceId = requestedDeviceId;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      finalDeviceId =
        attempt === 0
          ? requestedDeviceId
          : `${requestedDeviceId}-${Math.random().toString(36).slice(2, 7)}`;

      const device = {
        deviceId: finalDeviceId,
        name,
        type: normalizedType,
        siteId,
        status: "active",
        sensors: normalizedSensors.map((sensor) => ({
          ...sensor,
          isPrimary: sensor.key === resolvedPrimarySensorKey,
        })),
        actuatorOutputs: normalizedOutputs,
        primarySensorKey: resolvedPrimarySensorKey,
        metadata: metadata || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      try {
        created = await Device.create(device);
        break;
      } catch (error) {
        if (error?.code === 11000) {
          continue;
        }
        throw error;
      }
    }

    if (!created) {
      return res.status(409).json({
        success: false,
        error: "Unable to allocate a unique deviceId. Please retry.",
      });
    }

    res.status(201).json({ success: true, data: created });
  } catch (error) {
    if (error?.name === "ValidationError") {
      return res.status(400).json({ success: false, error: error.message });
    }
    logger.error({ error }, "Failed to create device");
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const device = await findDeviceByIdentifier(req.params.id);
    if (!device) {
      return res
        .status(404)
        .json({ success: false, error: "Device not found" });
    }
    await device.deleteOne();
    res.json({ success: true, message: "Device deleted successfully" });
  } catch (error) {
    logger.error({ error }, "Failed to delete device");
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const device = await findDeviceByIdentifier(req.params.id);
    if (!device)
      return res
        .status(404)
        .json({ success: false, error: "Device not found" });
    res.json({
      success: true,
      data: device.toObject ? device.toObject() : device,
    });
  } catch (error) {
    logger.error({ error }, "Failed to fetch device");
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const {
      name,
      type,
      siteId,
      status,
      sensors,
      actuatorOutputs,
      primarySensorKey,
      metadata,
    } = req.body;
    const existing = await findDeviceByIdentifier(req.params.id);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, error: "Device not found" });
    }

    if (name !== undefined) existing.name = name;
    if (type !== undefined) existing.type = normalizeDeviceType(type);
    if (siteId !== undefined) existing.siteId = siteId;
    if (status !== undefined) existing.status = status;
    if (metadata !== undefined) existing.metadata = metadata;

    if (Array.isArray(sensors)) {
      const normalizedSensors = normalizeSensors(sensors, existing.deviceId);
      const sensorsRequired =
        existing.type !== "actuator" && existing.type !== "controller";

      if (sensorsRequired && normalizedSensors.length === 0) {
        return res.status(400).json({
          success: false,
          error: "At least one sensor with mqttTopic is required",
        });
      }
      const resolvedPrimary = resolvePrimarySensorKey(
        normalizedSensors,
        primarySensorKey,
      );
      existing.sensors = normalizedSensors.map((sensor) => ({
        ...sensor,
        isPrimary: sensor.key === resolvedPrimary,
      }));
      existing.primarySensorKey = resolvedPrimary;
    } else if (primarySensorKey !== undefined) {
      const resolvedPrimary = resolvePrimarySensorKey(
        existing.sensors,
        primarySensorKey,
      );
      existing.primarySensorKey = resolvedPrimary;
      existing.sensors = (existing.sensors || []).map((sensor) => ({
        ...sensor,
        isPrimary: sensor.key === resolvedPrimary,
      }));
    }

    if (Array.isArray(actuatorOutputs)) {
      const normalizedOutputs = normalizeActuatorOutputs(actuatorOutputs);
      if (
        (existing.type === "actuator" ||
          existing.type === "hybrid" ||
          existing.type === "combined") &&
        normalizedOutputs.length === 0
      ) {
        return res.status(400).json({
          success: false,
          error: "At least one actuator output with commandTopic is required",
        });
      }
      existing.actuatorOutputs = normalizedOutputs;
    }

    existing.updatedAt = new Date();
    await existing.save();
    res.json({ success: true, data: existing });
  } catch (error) {
    if (error?.name === "ValidationError") {
      return res.status(400).json({ success: false, error: error.message });
    }
    logger.error({ error }, "Failed to update device");
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch("/:id/main-sensor", authMiddleware, async (req, res) => {
  try {
    const { sensorKey } = req.body;
    if (!sensorKey) {
      return res
        .status(400)
        .json({ success: false, error: "sensorKey is required" });
    }

    const device = await findDeviceByIdentifier(req.params.id);
    if (!device) {
      return res
        .status(404)
        .json({ success: false, error: "Device not found" });
    }

    const hasKey = (device.sensors || []).some(
      (sensor) => sensor.key === sensorKey,
    );
    if (!hasKey) {
      return res.status(400).json({
        success: false,
        error: "sensorKey does not belong to this device",
      });
    }

    device.primarySensorKey = sensorKey;
    device.sensors = (device.sensors || []).map((sensor) => ({
      ...sensor,
      isPrimary: sensor.key === sensorKey,
    }));
    device.updatedAt = new Date();
    await device.save();

    res.json({ success: true, data: device });
  } catch (error) {
    logger.error({ error }, "Failed to update primary sensor");
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post(
  "/:id/outputs/:outputKey/trigger",
  authMiddleware,
  async (req, res) => {
    try {
      const { id, outputKey } = req.params;
      const {
        command = "toggle",
        value,
        topic,
        notifyPhone = false,
      } = req.body || {};

      const device = await findDeviceByIdentifier(id);
      if (!device) {
        return res
          .status(404)
          .json({ success: false, error: "Device not found" });
      }

      const output = (device.actuatorOutputs || []).find(
        (entry) => entry.key === outputKey,
      );
      if (!output) {
        return res
          .status(404)
          .json({ success: false, error: "Actuator output not found" });
      }

      const targetTopic = String(topic || output.commandTopic || "").trim();
      if (!targetTopic) {
        return res.status(400).json({
          success: false,
          error: "No command topic configured for this actuator output",
        });
      }

      const payload = {
        type: "actuator_output_command",
        command,
        value: value ?? output.defaultValue ?? 0,
        siteId: String(device.siteId || "default"),
        deviceId: String(device.deviceId),
        outputKey,
        outputType: output.outputType || "custom",
        timestamp: new Date().toISOString(),
      };

      if (req.actionDispatcher?.broadcastUpdate) {
        await req.actionDispatcher.broadcastUpdate(targetTopic, payload);
      } else if (req.actionDispatcher?.mqtt?.publish) {
        req.actionDispatcher.mqtt.publish(targetTopic, JSON.stringify(payload));
      }

      await Action.create({
        name: `Manual actuator output ${command}`,
        type: "actuator_command",
        siteId: String(device.siteId || "default"),
        parameters: {
          topic: targetTopic,
          command,
          value: payload.value,
          outputKey,
          outputType: output.outputType,
          targetDeviceId: String(device.deviceId),
        },
        status: "completed",
        executedAt: new Date(),
        result: { published: true },
      });

      if (notifyPhone) {
        const mobileTopic =
          process.env.MQTT_MOBILE_NOTIFICATION_TOPIC ||
          "greenhouse/notifications/mobile";
        const phonePayload = {
          type: "actuator_output_notification",
          title: `Actuator output command: ${output.label || outputKey}`,
          message: `${command}${value !== undefined ? ` (${value})` : ""} sent to ${device.name}`,
          siteId: device.siteId,
          deviceId: device.deviceId,
          outputKey,
          topic: targetTopic,
          timestamp: new Date().toISOString(),
        };
        if (req.actionDispatcher?.broadcastUpdate) {
          await req.actionDispatcher.broadcastUpdate(mobileTopic, phonePayload);
        }
      }

      return res.json({
        success: true,
        message: "Actuator output command published",
        data: {
          deviceId: device.deviceId,
          outputKey,
          topic: targetTopic,
          payload,
        },
      });
    } catch (error) {
      logger.error({ error }, "Failed to trigger actuator output");
      return res.status(500).json({ success: false, error: error.message });
    }
  },
);

router.post(
  "/:id/actuators/:sensorKey/trigger",
  authMiddleware,
  async (req, res) => {
    try {
      const { id, sensorKey } = req.params;
      const {
        command = "toggle",
        value,
        topic,
        notifyPhone = false,
      } = req.body || {};

      const device = await findDeviceByIdentifier(id);
      if (!device) {
        return res
          .status(404)
          .json({ success: false, error: "Device not found" });
      }

      const sensor = (device.sensors || []).find(
        (entry) => entry.key === sensorKey,
      );
      if (!sensor) {
        return res
          .status(404)
          .json({ success: false, error: "Actuator sensor not found" });
      }

      const targetTopic = String(
        topic || sensor.commandTopic || sensor.mqttTopic || "",
      ).trim();
      if (!targetTopic) {
        return res.status(400).json({
          success: false,
          error: "No command topic configured for this actuator",
        });
      }

      const payload = {
        type: "actuator_command",
        command,
        value: value ?? sensor?.actuatorConfig?.defaultValue ?? 0,
        siteId: String(device.siteId || "default"),
        deviceId: String(device.deviceId),
        sensorKey,
        actuatorType: sensor.actuatorType || "custom",
        timestamp: new Date().toISOString(),
      };

      if (req.actionDispatcher?.broadcastUpdate) {
        await req.actionDispatcher.broadcastUpdate(targetTopic, payload);
      } else if (req.actionDispatcher?.mqtt?.publish) {
        req.actionDispatcher.mqtt.publish(targetTopic, JSON.stringify(payload));
      }

      await Action.create({
        name: `Manual actuator ${command}`,
        type: "actuator_command",
        siteId: String(device.siteId || "default"),
        parameters: {
          topic: targetTopic,
          command,
          value: payload.value,
          sensorKey,
          targetDeviceId: String(device.deviceId),
        },
        status: "completed",
        executedAt: new Date(),
        result: { published: true },
      });

      if (notifyPhone) {
        const mobileTopic =
          process.env.MQTT_MOBILE_NOTIFICATION_TOPIC ||
          "greenhouse/notifications/mobile";
        const phonePayload = {
          type: "actuator_notification",
          title: `Actuator command: ${sensor.label || sensorKey}`,
          message: `${command}${value !== undefined ? ` (${value})` : ""} sent to ${device.name}`,
          siteId: device.siteId,
          deviceId: device.deviceId,
          sensorKey,
          topic: targetTopic,
          timestamp: new Date().toISOString(),
        };

        if (req.actionDispatcher?.broadcastUpdate) {
          await req.actionDispatcher.broadcastUpdate(mobileTopic, phonePayload);
        }
      }

      return res.json({
        success: true,
        message: "Actuator command published",
        data: {
          deviceId: device.deviceId,
          sensorKey,
          topic: targetTopic,
          payload,
        },
      });
    } catch (error) {
      logger.error({ error }, "Failed to trigger actuator");
      return res.status(500).json({ success: false, error: error.message });
    }
  },
);

router.post(
  "/:id/sensors/:sensorKey/ping",
  authMiddleware,
  async (req, res) => {
    try {
      const { sensorKey, id } = req.params;
      const topicOverride = String(req.body?.mqttTopic || "").trim();
      const siteIdOverride = String(req.body?.siteId || "").trim();
      const device = await findDeviceByIdentifier(id);
      if (!device && !topicOverride) {
        return res
          .status(404)
          .json({ success: false, error: "Device not found" });
      }

      if (!device && topicOverride) {
        const payload = {
          type: "topic_ping",
          message: `Ping from dashboard for ${sensorKey}`,
          siteId: siteIdOverride || "unknown",
          deviceId: id,
          sensorKey,
          sensorType: String(req.body?.sensorType || "custom"),
          ts: new Date().toISOString(),
        };

        if (req.actionDispatcher?.broadcastUpdate) {
          await req.actionDispatcher.broadcastUpdate(topicOverride, payload);
        }

        return res.json({
          success: true,
          message: "Ping published",
          data: {
            deviceId: id,
            sensorKey,
            topic: topicOverride,
            payload,
            fallback: "device-not-found",
          },
        });
      }

      const sensor = (device.sensors || []).find(
        (entry) => entry.key === sensorKey,
      );
      if (!sensor && !topicOverride) {
        return res
          .status(404)
          .json({ success: false, error: "Sensor not found on device" });
      }

      const targetTopic = topicOverride || sensor?.mqttTopic;
      if (!targetTopic) {
        return res.status(400).json({
          success: false,
          error: "No MQTT topic configured for this sensor",
        });
      }

      const payload = {
        type: "topic_ping",
        message: `Ping from dashboard for ${sensorKey}`,
        siteId: device.siteId,
        deviceId: device.deviceId,
        sensorKey,
        sensorType:
          sensor?.sensorType || String(req.body?.sensorType || "custom"),
        ts: new Date().toISOString(),
      };

      if (req.actionDispatcher?.broadcastUpdate) {
        await req.actionDispatcher.broadcastUpdate(targetTopic, payload);
      }

      res.json({
        success: true,
        message: "Ping published",
        data: {
          deviceId: device.deviceId,
          sensorKey,
          topic: targetTopic,
          payload,
          fallback: sensor ? undefined : "sensor-topic-override",
        },
      });
    } catch (error) {
      logger.error({ error }, "Failed to ping sensor topic");
      res.status(500).json({ success: false, error: error.message });
    }
  },
);

router.post("/:id/oled/command", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { topic, rotationSec, brightness, pages } = req.body || {};

    const device = await findDeviceByIdentifier(id);
    if (!device) {
      return res
        .status(404)
        .json({ success: false, error: "Device not found" });
    }

    const siteId = String(device.siteId || "default");
    const defaultTopic = `greenhouse/${siteId}/command/oled/${device.deviceId}`;
    const targetTopic = String(topic || defaultTopic).trim();

    const payload = {
      rotationSec: Math.min(60, Math.max(1, Number(rotationSec || 3))),
      brightness: Math.min(255, Math.max(0, Number(brightness ?? 255))),
      pages: Array.isArray(pages)
        ? pages
            .slice(0, 6)
            .map((page) =>
              Array.isArray(page)
                ? page
                    .map((field) => String(field || "").trim())
                    .filter(Boolean)
                    .slice(0, 6)
                : [],
            )
            .filter((page) => page.length > 0)
        : [],
    };

    if (!req.actionDispatcher?.mqtt?.publish) {
      return res.status(503).json({
        success: false,
        error: "MQTT dispatcher unavailable",
      });
    }

    req.actionDispatcher.mqtt.publish(targetTopic, JSON.stringify(payload));

    res.json({
      success: true,
      message: "OLED command published",
      data: {
        deviceId: device.deviceId,
        topic: targetTopic,
        payload,
      },
    });
  } catch (error) {
    logger.error({ error }, "Failed to publish OLED command");
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
