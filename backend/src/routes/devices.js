const express = require("express");
const pino = require("pino");
const mongoose = require("mongoose");
const { Device } = require("../schemas");
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
        widget: normalizedWidget,
        widgetKind,
        isPrimary: Boolean(sensor.isPrimary),
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

    const normalizedSensors = normalizeSensors(sensors, requestedDeviceId);
    if (normalizedSensors.length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one sensor with mqttTopic is required",
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
        type: normalizeDeviceType(type),
        siteId,
        status: "active",
        sensors: normalizedSensors.map((sensor) => ({
          ...sensor,
          isPrimary: sensor.key === resolvedPrimarySensorKey,
        })),
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
    const { name, type, siteId, status, sensors, primarySensorKey, metadata } =
      req.body;
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
      if (normalizedSensors.length === 0) {
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
    const {
      topic,
      rotationSec,
      brightness,
      pages,
    } = req.body || {};

    const device = await findDeviceByIdentifier(id);
    if (!device) {
      return res.status(404).json({ success: false, error: "Device not found" });
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
