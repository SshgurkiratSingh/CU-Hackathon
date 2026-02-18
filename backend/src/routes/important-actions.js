const express = require("express");
const pino = require("pino");
const { ImportantAction } = require("../schemas");

const logger = pino();
const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const { siteId, status, severity, limit = 50 } = req.query;
    const filter = {};
    if (siteId) filter.siteId = siteId;
    if (status) filter.status = status;
    if (severity) filter.severity = severity;

    const rows = await ImportantAction.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10))
      .lean();

    res.json({ success: true, data: rows, count: rows.length });
  } catch (error) {
    logger.error({ error }, "Failed to fetch important actions");
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const {
      siteId,
      title,
      message,
      severity = "medium",
      source,
      metadata,
    } = req.body || {};

    if (!siteId || !title || !message) {
      return res.status(400).json({
        success: false,
        error: "Missing fields: siteId, title, message",
      });
    }

    const item = await ImportantAction.create({
      siteId,
      title,
      message,
      severity,
      source: source || "manual",
      metadata: metadata || {},
      updatedAt: new Date(),
    });

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    logger.error({ error }, "Failed to create important action");
    next(error);
  }
});

router.patch("/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body || {};
    if (!["open", "in_progress", "done"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status",
      });
    }

    const row = await ImportantAction.findByIdAndUpdate(
      req.params.id,
      {
        status,
        updatedAt: new Date(),
      },
      { new: true },
    );

    if (!row) {
      return res
        .status(404)
        .json({ success: false, error: "Important action not found" });
    }

    res.json({ success: true, data: row });
  } catch (error) {
    logger.error({ error }, "Failed to update important action status");
    next(error);
  }
});

module.exports = router;
