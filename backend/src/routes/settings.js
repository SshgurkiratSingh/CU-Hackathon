const express = require("express");
const pino = require("pino");
const { Settings } = require("../schemas");
const { authMiddleware, authorize } = require("../middleware");

const logger = pino();
const router = express.Router();

const DEFAULTS = {
  "system.name": "Greenhouse OS",
  "irrigation.minTemp": 18,
  "ventilation.maxTemp": 28,
  "heating.minTemp": 15,
  "alerts.enabled": true,
  "rules.autoExecute": true,
};

router.get("/", authMiddleware, async (req, res, next) => {
  try {
    let settings = await Settings.find();
    if (settings.length === 0) {
      for (const [key, value] of Object.entries(DEFAULTS)) {
        const s = new Settings({ key, value });
        await s.save();
        settings.push(s);
      }
    }
    const map = {};
    settings.forEach((s) => {
      map[s.key] = s.value;
    });
    res.json({ success: true, data: map });
  } catch (error) {
    logger.error({ error }, "Failed to fetch settings");
    next(error);
  }
});

router.get("/:key", authMiddleware, async (req, res, next) => {
  try {
    let s = await Settings.findOne({ key: req.params.key });
    if (!s) {
      const val = DEFAULTS[req.params.key];
      if (val !== undefined) {
        s = new Settings({ key: req.params.key, value: val });
        await s.save();
      } else
        return res.status(404).json({ success: false, error: "Not found" });
    }
    res.json({ success: true, key: s.key, value: s.value });
  } catch (error) {
    logger.error({ error }, "Failed to fetch setting");
    next(error);
  }
});

router.put(
  "/:key",
  authMiddleware,
  authorize(["admin"]),
  async (req, res, next) => {
    try {
      const { value } = req.body;
      if (value === undefined)
        return res
          .status(400)
          .json({ success: false, error: "Value required" });
      let s = await Settings.findOne({ key: req.params.key });
      if (s) {
        s.value = value;
        s.updatedAt = new Date();
      } else {
        s = new Settings({ key: req.params.key, value });
      }
      await s.save();
      res.json({ success: true, key: s.key, value: s.value });
    } catch (error) {
      logger.error({ error }, "Failed to update setting");
      next(error);
    }
  },
);

module.exports = router;
