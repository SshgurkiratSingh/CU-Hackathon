const express = require("express");
const pino = require("pino");
const { kioskMiddleware } = require("../middleware");

const logger = pino();
const router = express.Router();

router.get("/status", kioskMiddleware, async (req, res) => {
  try {
    const status = req.kioskService
      ? await req.kioskService.getStatus(req.query.siteId)
      : { status: "operational" };
    res.json({ success: true, data: status });
  } catch (error) {
    logger.error({ error }, "Failed to get status");
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/display", kioskMiddleware, async (req, res) => {
  try {
    const dashboard = req.kioskService
      ? await req.kioskService.getDashboardData(req.query.siteId || "default")
      : { siteId: "default", telemetry: [] };
    res.json({ success: true, data: dashboard });
  } catch (error) {
    logger.error({ error }, "Failed to get display data");
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/input", kioskMiddleware, async (req, res) => {
  try {
    const result = req.kioskService
      ? await req.kioskService.acceptInput(req.body)
      : { received: true };
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error({ error }, "Failed to process input");
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/actions", kioskMiddleware, async (req, res) => {
  try {
    const actions = req.kioskService
      ? await req.kioskService.getQuickActions(req.query.siteId || "default")
      : [];
    res.json({ success: true, data: actions });
  } catch (error) {
    logger.error({ error }, "Failed to get actions");
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
