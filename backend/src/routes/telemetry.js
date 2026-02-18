const express = require("express");
const pino = require("pino");
const { Telemetry } = require("../schemas");

const logger = pino();
const router = express.Router();

// Get telemetry data with optional filtering
router.get("/", async (req, res, next) => {
  try {
    const {
      siteId,
      sensorType,
      sensorKey,
      topic,
      startDate,
      endDate,
      limit = 100,
    } = req.query;

    const filter = {};
    if (siteId) filter.siteId = siteId;
    if (sensorType) filter.sensorType = sensorType;
    if (sensorKey) filter.sensorKey = sensorKey;
    if (topic) filter.topic = topic;

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    logger.info({ filter, limit }, "Fetching telemetry data");

    const telemetry = await Telemetry.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .maxTimeMS(3000) // 3 second timeout
      .lean();

    logger.info({ count: telemetry.length }, "Telemetry data fetched");

    res.json({
      success: true,
      data: telemetry,
      count: telemetry.length,
      message: `Retrieved ${telemetry.length} telemetry records`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(
      { error: error.message, stack: error.stack },
      "Failed to fetch telemetry",
    );
    next(error);
  }
});

router.get("/sensors", async (_req, res, next) => {
  try {
    const [sensorTypes, topics, sensorKeys] = await Promise.all([
      Telemetry.distinct("sensorType", {
        sensorType: { $exists: true, $ne: null },
      }),
      Telemetry.distinct("topic", { topic: { $exists: true, $ne: "" } }),
      Telemetry.distinct("sensorKey", {
        sensorKey: { $exists: true, $ne: null },
      }),
    ]);

    res.json({
      success: true,
      data: {
        sensorTypes: sensorTypes.filter(Boolean).sort(),
        topics: topics.filter(Boolean).sort(),
        sensorKeys: sensorKeys.filter(Boolean).sort(),
      },
    });
  } catch (error) {
    logger.error({ error }, "Failed to fetch telemetry sensor discovery data");
    next(error);
  }
});

// Get sensor history
router.get("/history/:sensorType", async (req, res, next) => {
  try {
    const { sensorType } = req.params;
    const { siteId, limit = 100 } = req.query;

    const filter = { sensorType };
    if (siteId) filter.siteId = siteId;

    const history = await Telemetry.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: history,
      count: history.length,
    });
  } catch (error) {
    logger.error({ error }, "Failed to fetch sensor history");
    next(error);
  }
});

// Create new telemetry reading
router.post("/", async (req, res, next) => {
  try {
    const { siteId, deviceId, sensorKey, sensorType, value, unit, topic } =
      req.body;

    if (!siteId || !sensorType || value === undefined) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: siteId, sensorType, value",
      });
    }

    const telemetryPayload = {
      siteId,
      deviceId,
      sensorKey,
      sensorType,
      value: parseFloat(value),
      unit: unit || "N/A",
      topic,
      userId: req.user?.id,
    };

    const telemetry = req.telemetryIngestionService
      ? (
          await req.telemetryIngestionService.record(
            telemetryPayload,
            new Date(),
          )
        ).telemetry
      : await Telemetry.create(telemetryPayload);

    if (req.eventAutomationService) {
      await req.eventAutomationService.handleTelemetryEvent(
        telemetry.toObject ? telemetry.toObject() : telemetry,
      );
    }

    // Optionally broadcast to MQTT
    if (req.actionDispatcher) {
      await req.actionDispatcher.publishTelemetry(siteId, {
        sensorType,
        value,
        unit,
      });
    }

    logger.info({ siteId, sensorType }, "Telemetry saved");
    res.status(201).json({
      success: true,
      message: "Telemetry recorded",
      data: telemetry,
    });
  } catch (error) {
    logger.error({ error }, "Failed to create telemetry");
    next(error);
  }
});

// Get telemetry statistics
router.get("/stats/:siteId", async (req, res, next) => {
  try {
    const { siteId } = req.params;
    const { sensorType, days = 7 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const filter = {
      siteId,
      timestamp: { $gte: startDate },
    };

    if (sensorType) filter.sensorType = sensorType;

    const readings = await Telemetry.find(filter);

    if (readings.length === 0) {
      return res.json({
        success: true,
        stats: { message: "No data available for period" },
      });
    }

    // Calculate statistics by sensor type
    const stats = {};
    readings.forEach((reading) => {
      if (!stats[reading.sensorType]) {
        stats[reading.sensorType] = {
          count: 0,
          sum: 0,
          min: Infinity,
          max: -Infinity,
          values: [],
        };
      }

      const s = stats[reading.sensorType];
      s.count++;
      s.sum += reading.value;
      s.min = Math.min(s.min, reading.value);
      s.max = Math.max(s.max, reading.value);
      s.values.push(reading.value);
    });

    // Calculate averages and std dev
    const summary = {};
    for (const [type, data] of Object.entries(stats)) {
      const avg = data.sum / data.count;
      const variance =
        data.values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) /
        data.count;
      summary[type] = {
        count: data.count,
        average: parseFloat(avg.toFixed(2)),
        min: parseFloat(data.min.toFixed(2)),
        max: parseFloat(data.max.toFixed(2)),
        stdDev: parseFloat(Math.sqrt(variance).toFixed(2)),
      };
    }

    res.json({
      success: true,
      siteId,
      period: `${days} days`,
      stats: summary,
    });
  } catch (error) {
    logger.error({ error }, "Failed to calculate stats");
    next(error);
  }
});

module.exports = router;
