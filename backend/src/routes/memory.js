const express = require("express");
const pino = require("pino");
const { LLMThinkingLog } = require("../schemas");
const { authMiddleware } = require("../middleware");

const logger = pino();
const router = express.Router();

router.get("/thinking", authMiddleware, async (req, res, next) => {
  try {
    const { limit = 50 } = req.query;
    const logs = await LLMThinkingLog.find()
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    res.json({ success: true, data: logs, count: logs.length });
  } catch (error) {
    logger.error({ error }, "Failed to fetch thinking logs");
    next(error);
  }
});

router.post("/thinking", authMiddleware, async (req, res, next) => {
  try {
    const log = new LLMThinkingLog(req.body);
    await log.save();
    res.status(201).json({ success: true, data: log });
  } catch (error) {
    logger.error({ error }, "Failed to create thinking log");
    next(error);
  }
});

router.get("/decisions", authMiddleware, async (req, res, next) => {
  try {
    const { limit = 50 } = req.query;
    const logs = await LLMThinkingLog.find()
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    res.json({ success: true, decisions: logs, count: logs.length });
  } catch (error) {
    logger.error({ error }, "Failed to fetch decisions");
    next(error);
  }
});

router.get("/analytics", authMiddleware, async (req, res, next) => {
  try {
    const logs = await LLMThinkingLog.find();
    const trueCount = logs.filter((l) => l.decision === true).length;
    const avgConfidence =
      logs.length > 0
        ? logs.reduce((s, l) => s + (l.confidence || 0), 0) / logs.length
        : 0;
    res.json({
      success: true,
      data: {
        total: logs.length,
        trueCount,
        truePercentage: ((trueCount / logs.length) * 100).toFixed(1),
        avgConfidence: avgConfidence.toFixed(3),
      },
    });
  } catch (error) {
    logger.error({ error }, "Failed to get analytics");
    next(error);
  }
});

module.exports = router;
