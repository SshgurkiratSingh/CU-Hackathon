const pino = require("pino");
const { Telemetry } = require("../schemas");

class TelemetryIngestionService {
  constructor(options = {}) {
    this.logger = options.logger || pino();
    this.intervalMinutes = Math.max(1, Number(options.intervalMinutes || 10));
    this.retentionHours = Math.max(1, Number(options.retentionHours || 48));
    this.cleanupTimer = null;
  }

  getIntervalStart(date = new Date()) {
    const ts = new Date(date);
    const minutes = ts.getMinutes();
    const flooredMinutes =
      Math.floor(minutes / this.intervalMinutes) * this.intervalMinutes;
    ts.setSeconds(0, 0);
    ts.setMinutes(flooredMinutes);
    return ts;
  }

  buildIdentity(data, intervalStart) {
    return {
      siteId: String(data.siteId || "default"),
      deviceId: data.deviceId ? String(data.deviceId) : null,
      sensorKey: data.sensorKey ? String(data.sensorKey) : null,
      sensorType: String(data.sensorType || "custom"),
      topic: data.topic ? String(data.topic) : null,
      intervalStart,
    };
  }

  async record(data, receivedAt = new Date()) {
    const serverReceivedAt =
      receivedAt instanceof Date ? receivedAt : new Date();
    const intervalStart = this.getIntervalStart(serverReceivedAt);
    const identity = this.buildIdentity(data, intervalStart);

    const value = Number(data.value);
    if (Number.isNaN(value)) {
      throw new Error("Telemetry value must be numeric");
    }

    const update = {
      $set: {
        ...identity,
        value,
        unit: String(data.unit || ""),
        timestamp: serverReceivedAt,
        receivedAt: serverReceivedAt,
        userId: data.userId ? String(data.userId) : undefined,
      },
    };

    // Avoid writing undefined values into MongoDB documents
    if (!data.userId) delete update.$set.userId;

    const doc = await Telemetry.findOneAndUpdate(identity, update, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    });

    return {
      telemetry: doc,
      receivedAt: serverReceivedAt,
      intervalStart,
    };
  }

  async cleanupOldData() {
    const cutoff = new Date(Date.now() - this.retentionHours * 60 * 60 * 1000);
    const result = await Telemetry.deleteMany({ timestamp: { $lt: cutoff } });
    const deletedCount = Number(result?.deletedCount || 0);

    if (deletedCount > 0) {
      this.logger.info(
        { deletedCount, cutoff: cutoff.toISOString() },
        "Telemetry retention cleanup completed",
      );
    }

    return deletedCount;
  }

  startCleanupTask() {
    if (this.cleanupTimer) return;

    const everyMs = this.intervalMinutes * 60 * 1000;
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldData().catch((error) => {
        this.logger.warn(
          { error: error.message },
          "Telemetry cleanup task failed",
        );
      });
    }, everyMs);

    this.logger.info(
      {
        intervalMinutes: this.intervalMinutes,
        retentionHours: this.retentionHours,
      },
      "Telemetry interval service started",
    );
  }

  stopCleanupTask() {
    if (!this.cleanupTimer) return;
    clearInterval(this.cleanupTimer);
    this.cleanupTimer = null;
  }
}

module.exports = TelemetryIngestionService;
