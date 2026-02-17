const express = require("express");
const pino = require("pino");
const mongoose = require("mongoose");
const { Zone } = require("../schemas");

const logger = pino();
const router = express.Router();

function toOptionalNumber(value) {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

async function findZoneByIdentifier(id) {
  const bySiteId = await Zone.findOne({ siteId: String(id).trim() });
  if (bySiteId) return bySiteId;
  if (mongoose.Types.ObjectId.isValid(id)) {
    return Zone.findById(id);
  }
  return null;
}

router.get("/", async (req, res, next) => {
  try {
    const zones = await Zone.find({}).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: zones, count: zones.length });
  } catch (error) {
    logger.error({ error }, "Failed to fetch zones");
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const {
      siteId,
      name,
      type,
      description,
      crop,
      targetTemp,
      targetHumidity,
      targetCo2,
      targets,
    } = req.body;

    if (!siteId || !name) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: siteId, name",
      });
    }

    const existing = await Zone.findOne({
      siteId: String(siteId).trim(),
    }).lean();
    if (existing) {
      return res.status(409).json({
        success: false,
        error: "A zone with this siteId already exists",
      });
    }

    const resolvedTargets = {
      temp: toOptionalNumber(targetTemp ?? targets?.temp),
      humidity: toOptionalNumber(targetHumidity ?? targets?.humidity),
      co2: toOptionalNumber(targetCo2 ?? targets?.co2),
    };

    const zone = new Zone({
      siteId: String(siteId).trim(),
      name: String(name).trim(),
      type: type || "vegetative",
      description: description ? String(description).trim() : "",
      crop: crop ? String(crop).trim() : "",
      targets: {
        ...(resolvedTargets.temp !== undefined
          ? { temp: resolvedTargets.temp }
          : {}),
        ...(resolvedTargets.humidity !== undefined
          ? { humidity: resolvedTargets.humidity }
          : {}),
        ...(resolvedTargets.co2 !== undefined
          ? { co2: resolvedTargets.co2 }
          : {}),
      },
      createdBy: req.user?.id || "no-auth-user",
      updatedAt: new Date(),
    });

    await zone.save();

    res.status(201).json({
      success: true,
      message: "Zone created",
      data: zone,
    });
  } catch (error) {
    logger.error({ error }, "Failed to create zone");
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const zone = await findZoneByIdentifier(req.params.id);
    if (!zone) {
      return res.status(404).json({ success: false, error: "Zone not found" });
    }

    const {
      name,
      type,
      description,
      crop,
      targetTemp,
      targetHumidity,
      targetCo2,
      targets,
    } = req.body;

    if (name !== undefined) zone.name = String(name).trim();
    if (type !== undefined) zone.type = String(type).trim();
    if (description !== undefined)
      zone.description = String(description).trim();
    if (crop !== undefined) zone.crop = String(crop).trim();

    const resolvedTargets = {
      temp: toOptionalNumber(targetTemp ?? targets?.temp),
      humidity: toOptionalNumber(targetHumidity ?? targets?.humidity),
      co2: toOptionalNumber(targetCo2 ?? targets?.co2),
    };

    zone.targets = {
      ...(resolvedTargets.temp !== undefined
        ? { temp: resolvedTargets.temp }
        : {}),
      ...(resolvedTargets.humidity !== undefined
        ? { humidity: resolvedTargets.humidity }
        : {}),
      ...(resolvedTargets.co2 !== undefined
        ? { co2: resolvedTargets.co2 }
        : {}),
    };
    zone.updatedAt = new Date();

    await zone.save();
    res.json({ success: true, message: "Zone updated", data: zone });
  } catch (error) {
    logger.error({ error }, "Failed to update zone");
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const zone = await findZoneByIdentifier(req.params.id);
    if (!zone) {
      return res.status(404).json({ success: false, error: "Zone not found" });
    }

    await Zone.deleteOne({ _id: zone._id });
    res.json({ success: true, message: "Zone deleted" });
  } catch (error) {
    logger.error({ error }, "Failed to delete zone");
    next(error);
  }
});

module.exports = router;
