const express = require("express");
const pino = require("pino");
const { authMiddleware } = require("../middleware");

const logger = pino();
const router = express.Router();

const deviceRegistry = new Map();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const devices = Array.from(deviceRegistry.values());
    res.json({ success: true, data: devices, count: devices.length });
  } catch (error) {
    logger.error({ error }, "Failed to fetch devices");
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { deviceId, name, type, siteId } = req.body;
    if (!deviceId || !name)
      return res.status(400).json({ success: false, error: "Missing fields" });
    const device = {
      deviceId,
      name,
      type: type || "sensor",
      siteId: siteId || "default",
      status: "active",
      createdAt: new Date(),
    };
    deviceRegistry.set(deviceId, device);
    res.status(201).json({ success: true, data: device });
  } catch (error) {
    logger.error({ error }, "Failed to create device");
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const device = deviceRegistry.get(req.params.id);
    if (!device)
      return res
        .status(404)
        .json({ success: false, error: "Device not found" });
    res.json({ success: true, data: device });
  } catch (error) {
    logger.error({ error }, "Failed to fetch device");
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
