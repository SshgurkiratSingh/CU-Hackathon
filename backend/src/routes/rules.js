const express = require("express");
const pino = require("pino");
const { Rule, LLMThinkingLog } = require("../schemas");
const { authMiddleware, authorize } = require("../middleware");

const logger = pino();
const router = express.Router();

router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const { siteId, active } = req.query;
    const filter = {};
    if (siteId) filter.siteId = siteId;
    if (active !== undefined) filter.active = active === "true";
    const rules = await Rule.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: rules, count: rules.length });
  } catch (error) {
    logger.error({ error }, "Failed to fetch rules");
    next(error);
  }
});

router.get("/:id", authMiddleware, async (req, res, next) => {
  try {
    const rule = await Rule.findById(req.params.id);
    if (!rule)
      return res.status(404).json({ success: false, error: "Rule not found" });
    res.json({ success: true, data: rule });
  } catch (error) {
    logger.error({ error }, "Failed to fetch rule");
    next(error);
  }
});

router.post(
  "/",
  authMiddleware,
  authorize(["admin"]),
  async (req, res, next) => {
    try {
      const { name, siteId, condition, action, description } = req.body;
      if (!name || !siteId || !condition || !action)
        return res
          .status(400)
          .json({ success: false, error: "Missing fields" });
      const rule = new Rule({
        name,
        siteId,
        condition,
        action,
        createdBy: req.user?.id,
        description,
      });
      await rule.save();
      logger.info({ ruleId: rule._id }, "Rule created");
      res.status(201).json({ success: true, data: rule });
    } catch (error) {
      logger.error({ error }, "Failed to create rule");
      next(error);
    }
  },
);

router.put(
  "/:id",
  authMiddleware,
  authorize(["admin"]),
  async (req, res, next) => {
    try {
      const rule = await Rule.findByIdAndUpdate(
        req.params.id,
        { ...req.body, updatedAt: new Date() },
        { new: true },
      );
      if (!rule)
        return res
          .status(404)
          .json({ success: false, error: "Rule not found" });
      res.json({ success: true, data: rule });
    } catch (error) {
      logger.error({ error }, "Failed to update rule");
      next(error);
    }
  },
);

router.delete(
  "/:id",
  authMiddleware,
  authorize(["admin"]),
  async (req, res, next) => {
    try {
      const rule = await Rule.findByIdAndDelete(req.params.id);
      if (!rule)
        return res
          .status(404)
          .json({ success: false, error: "Rule not found" });
      res.json({ success: true, message: "Rule deleted" });
    } catch (error) {
      logger.error({ error }, "Failed to delete rule");
      next(error);
    }
  },
);

router.patch(
  "/:id/toggle",
  authMiddleware,
  authorize(["admin"]),
  async (req, res, next) => {
    try {
      const rule = await Rule.findById(req.params.id);
      if (!rule)
        return res
          .status(404)
          .json({ success: false, error: "Rule not found" });
      rule.active = !rule.active;
      await rule.save();
      res.json({ success: true, data: rule });
    } catch (error) {
      logger.error({ error }, "Failed to toggle rule");
      next(error);
    }
  },
);

router.get("/:id/history", authMiddleware, async (req, res, next) => {
  try {
    const history = await LLMThinkingLog.find({ ruleId: req.params.id })
      .sort({ timestamp: -1 })
      .limit(50);
    res.json({ success: true, executions: history, count: history.length });
  } catch (error) {
    logger.error({ error }, "Failed to fetch history");
    next(error);
  }
});

module.exports = router;
