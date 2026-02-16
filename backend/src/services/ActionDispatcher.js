const pino = require("pino");
const { Action } = require("../schemas");

const logger = pino();

class ActionDispatcher {
  constructor(mqttClient) {
    this.mqtt = mqttClient;
    this.dispatchedActions = new Map(); // Track dispatched actions
  }

  // Dispatch action to device via MQTT
  async dispatch(action) {
    try {
      const topic = `greenhouse/actions/${action.siteId}/${action.type}`;
      const payload = {
        actionId: action._id || action.id,
        type: action.type,
        parameters: action.parameters,
        timestamp: new Date().toISOString(),
      };

      // Publish to MQTT if connected
      if (this.mqtt && this.mqtt.publish) {
        this.mqtt.publish(topic, JSON.stringify(payload));
      }

      // Track dispatch
      this.dispatchedActions.set(action._id || action.id, {
        action,
        dispatchedAt: new Date(),
        topic,
      });

      logger.info({ actionId: action._id, topic }, "Action dispatched");
      return {
        dispatched: true,
        actionId: action._id,
        topic,
      };
    } catch (error) {
      logger.error({ error }, "Action dispatch failed");
      throw error;
    }
  }

  // Broadcast data update to clients
  async broadcastUpdate(topic, data) {
    try {
      const payload = {
        topic,
        data,
        timestamp: new Date().toISOString(),
      };

      // Publish to MQTT if connected
      if (this.mqtt && this.mqtt.publish) {
        this.mqtt.publish(topic, JSON.stringify(payload));
      }

      logger.info({ topic }, "Update broadcasted");
      return { broadcasted: true, topic };
    } catch (error) {
      logger.error({ error }, "Broadcast failed");
      throw error;
    }
  }

  // Publish sensor telemetry
  async publishTelemetry(siteId, sensorData) {
    try {
      const topic = `greenhouse/telemetry/${siteId}`;
      const payload = {
        ...sensorData,
        timestamp: new Date().toISOString(),
      };

      if (this.mqtt && this.mqtt.publish) {
        this.mqtt.publish(topic, JSON.stringify(payload));
      }

      logger.info(
        { topic, sensorType: sensorData.sensorType },
        "Telemetry published",
      );
      return { published: true, topic };
    } catch (error) {
      logger.error({ error }, "Telemetry publish failed");
      throw error;
    }
  }

  // Subscribe to MQTT topics
  async subscribe(topic) {
    try {
      if (this.mqtt && this.mqtt.subscribe) {
        this.mqtt.subscribe(topic);
        logger.info({ topic }, "Subscribed to topic");
        return { subscribed: true, topic };
      }
      return { subscribed: false, message: "MQTT not connected" };
    } catch (error) {
      logger.error({ error }, "Subscribe failed");
      throw error;
    }
  }

  // Handle incoming MQTT message
  async handleMessage(topic, message) {
    try {
      const data = JSON.parse(message.toString());
      logger.info({ topic, messageType: data.type }, "Message received");

      // Process based on topic type
      if (topic.includes("telemetry")) {
        return { type: "telemetry", data };
      } else if (topic.includes("status")) {
        return { type: "status_update", data };
      } else if (topic.includes("alert")) {
        return { type: "alert", data };
      }

      return { type: "unknown", data };
    } catch (error) {
      logger.error({ topic, error }, "Message handling failed");
      throw error;
    }
  }

  // Get dispatch status for action
  async getDispatchStatus(actionId) {
    try {
      const dispatchInfo = this.dispatchedActions.get(actionId);
      const action = await Action.findById(actionId);

      if (!action) {
        throw new Error(`Action '${actionId}' not found`);
      }

      return {
        actionId,
        status: action.status,
        dispatchedAt: dispatchInfo?.dispatchedAt,
        executedAt: action.executedAt,
        result: action.result,
      };
    } catch (error) {
      logger.error({ actionId, error }, "Dispatch status check failed");
      throw error;
    }
  }

  // Clear old dispatched actions (maintenance)
  async cleanup() {
    try {
      const now = new Date();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      for (const [actionId, info] of this.dispatchedActions.entries()) {
        if (now - info.dispatchedAt > maxAge) {
          this.dispatchedActions.delete(actionId);
        }
      }

      logger.info(
        { removedCount: this.dispatchedActions.size },
        "Dispatch cleanup completed",
      );
    } catch (error) {
      logger.error({ error }, "Cleanup failed");
    }
  }
}

module.exports = ActionDispatcher;
