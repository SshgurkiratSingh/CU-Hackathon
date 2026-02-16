const express = require("express");
const pino = require("pino");
const { authMiddleware } = require("../middleware");

const logger = pino();
const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const services = [
      {
        id: "weather-api",
        name: "Weather API",
        type: "external",
        status: "available",
      },
      {
        id: "soil-sensor",
        name: "Soil Sensor",
        type: "sensor",
        status: "available",
      },
    ];
    res.json({ success: true, data: services });
  } catch (error) {
    logger.error({ error }, "Failed to fetch services");
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/services", authMiddleware, async (req, res) => {
  try {
    const services = await req.marketplaceService.discoverServices(req.query);
    res.json({ success: true, data: services });
  } catch (error) {
    logger.error({ error }, "Failed to discover services");
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/services", authMiddleware, async (req, res) => {
  try {
    const result = await req.marketplaceService.registerService(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    logger.error({ error }, "Failed to register service");
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/services/:id/call", authMiddleware, async (req, res) => {
  try {
    const result = await req.marketplaceService.callService(
      req.params.id,
      req.body,
    );
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error({ error }, "Failed to call service");
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
