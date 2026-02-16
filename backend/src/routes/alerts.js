const express = require("express");
const pino = require("pino");
const { Alert } = require("../schemas");
const { authMiddleware } = require("../middleware");

const logger = pino();
const router = express.Router();

router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const { siteId, severity, resolved, limit = 50 } = req.query;
    const filter = {};
    if (siteId) filter.siteId = siteId;
    if (severity) filter.severity = severity;
    if (resolved !== undefined) filter.resolved = resolved === "true";
    const alerts = await Alert.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    res.json({ success: true, data: alerts, count: alerts.length });
  } catch (error) {
    logger.error({ error }, "Failed to fetch alerts");
    next(error);
  }
});

router.get("/:id", authMiddleware, async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert)
      return res.status(404).json({ success: false, error: "Alert not found" });
    res.json({ success: true, data: alert });
  } catch (error) {
    logger.error({ error }, "Failed to fetch alert");
    next(error);
  }
});

router.post("/", authMiddleware, async (req, res, next) => {
  try {
    const { siteId, severity, message } = req.body;
    if (!siteId || !severity || !message)
      return res.status(400).json({ success: false, error: "Missing fields" });
    if (!["low", "medium", "high", "critical"].includes(severity))
      return res
        .status(400)
        .json({ success: false, error: "Invalid severity" });
    const alert = new Alert({ siteId, severity, message });
    await alert.save();
    res.status(201).json({ success: true, data: alert });
  } catch (error) {
    logger.error({ error }, "Failed to create alert");
    next(error);
  }
});

router.post("/:id/acknowledge", authMiddleware, async (req, res, next) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { resolved: true, resolvedAt: new Date() },
      { new: true },
    );
    if (!alert)
      return res.status(404).json({ success: false, error: "Alert not found" });
    res.json({ success: true, data: alert });
  } catch (error) {
    logger.error({ error }, "Failed to acknowledge alert");
    next(error);
  }
});

module.exports = router;
