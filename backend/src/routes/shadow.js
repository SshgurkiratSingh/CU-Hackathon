const express = require("express");
const pino = require("pino");
const { Shadow } = require("../schemas");
const { authMiddleware } = require("../middleware");

const logger = pino();
const router = express.Router();

router.get("/:deviceId", authMiddleware, async (req, res, next) => {
  try {
    let shadow = await Shadow.findOne({ deviceId: req.params.deviceId });
    if (!shadow) {
      shadow = new Shadow({
        deviceId: req.params.deviceId,
        desired: {},
        reported: {},
      });
      await shadow.save();
    }
    const delta = {};
    for (const key in shadow.desired) {
      if (shadow.desired[key] !== shadow.reported[key])
        delta[key] = {
          desired: shadow.desired[key],
          reported: shadow.reported[key],
        };
    }
    res.json({
      success: true,
      deviceId: req.params.deviceId,
      shadow: { desired: shadow.desired, reported: shadow.reported, delta },
      updatedAt: shadow.updatedAt,
    });
  } catch (error) {
    logger.error({ error }, "Failed to fetch shadow");
    next(error);
  }
});

router.patch("/:deviceId", authMiddleware, async (req, res, next) => {
  try {
    const { desired } = req.body;
    if (!desired)
      return res
        .status(400)
        .json({ success: false, error: "desired required" });
    let shadow = await Shadow.findOne({ deviceId: req.params.deviceId });
    if (!shadow)
      shadow = new Shadow({
        deviceId: req.params.deviceId,
        desired,
        reported: {},
      });
    else {
      shadow.desired = desired;
      shadow.updatedAt = new Date();
    }
    await shadow.save();
    res.json({ success: true, data: shadow });
  } catch (error) {
    logger.error({ error }, "Failed to update shadow");
    next(error);
  }
});

router.patch("/:deviceId/reported", authMiddleware, async (req, res, next) => {
  try {
    const { reported } = req.body;
    if (!reported)
      return res
        .status(400)
        .json({ success: false, error: "reported required" });
    let shadow = await Shadow.findOne({ deviceId: req.params.deviceId });
    if (!shadow)
      shadow = new Shadow({
        deviceId: req.params.deviceId,
        desired: {},
        reported,
      });
    else {
      shadow.reported = reported;
      shadow.updatedAt = new Date();
    }
    await shadow.save();
    res.json({ success: true, data: shadow });
  } catch (error) {
    logger.error({ error }, "Failed to update reported");
    next(error);
  }
});

module.exports = router;
