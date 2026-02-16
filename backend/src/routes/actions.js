const express = require("express");
const pino = require("pino");
const { Action } = require("../schemas");
const { authMiddleware } = require("../middleware");

const logger = pino();
const router = express.Router();

router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const { siteId, status, limit = 50 } = req.query;
    const filter = {};
    if (siteId) filter.siteId = siteId;
    if (status) filter.status = status;
    const actions = await Action.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    res.json({ success: true, data: actions, count: actions.length });
  } catch (error) {
    logger.error({ error }, "Failed to fetch actions");
    next(error);
  }
});

router.get("/:id", authMiddleware, async (req, res, next) => {
  try {
    const action = await Action.findById(req.params.id);
    if (!action)
      return res
        .status(404)
        .json({ success: false, error: "Action not found" });
    res.json({ success: true, data: action });
  } catch (error) {
    logger.error({ error }, "Failed to fetch action");
    next(error);
  }
});

router.post("/", authMiddleware, async (req, res, next) => {
  try {
    const { name, type, siteId, parameters } = req.body;
    if (!name || !type || !siteId)
      return res.status(400).json({ success: false, error: "Missing fields" });
    const action = new Action({
      name,
      type,
      siteId,
      parameters: parameters || {},
      status: "pending",
    });
    await action.save();
    if (req.actionDispatcher) {
      try {
        await req.actionDispatcher.dispatch(action);
      } catch (e) {
        logger.warn({ e }, "Dispatch failed");
      }
    }
    res.status(201).json({ success: true, data: action });
  } catch (error) {
    logger.error({ error }, "Failed to create action");
    next(error);
  }
});

router.post("/:id/execute", authMiddleware, async (req, res, next) => {
  try {
    const action = await Action.findById(req.params.id);
    if (!action)
      return res
        .status(404)
        .json({ success: false, error: "Action not found" });
    if (req.actionDispatcher) {
      await req.actionDispatcher.dispatch(action);
      action.status = "executing";
      action.executedAt = new Date();
      await action.save();
    }
    res.json({ success: true, data: action });
  } catch (error) {
    logger.error({ error }, "Failed to execute action");
    next(error);
  }
});

module.exports = router;
