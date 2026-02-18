const pino = require("pino");
const { Rule, Action, Alert, ImportantAction } = require("../schemas");

class EventAutomationService {
  constructor({ logicEngine, actionDispatcher, logger } = {}) {
    this.logicEngine = logicEngine;
    this.actionDispatcher = actionDispatcher;
    this.logger = logger || pino();
    this.mobileNotificationTopic =
      process.env.MQTT_MOBILE_NOTIFICATION_TOPIC ||
      "greenhouse/notifications/mobile";
    this.issueAlertTopic =
      process.env.MQTT_ISSUE_ALERT_TOPIC || "greenhouse/alerts/issues";
  }

  evaluateTriggerMatch(rule, telemetry) {
    const triggerType = rule?.trigger?.type || "telemetry";
    if (triggerType === "manual") return false;
    if (triggerType === "timer") {
      const interval = Number(rule?.timer?.intervalMinutes || 0);
      if (interval <= 0) return false;
      const minute = new Date(telemetry.timestamp || Date.now()).getMinutes();
      return minute % interval === 0;
    }

    const match = rule?.trigger?.match || {};
    if (match.sensorType && match.sensorType !== telemetry.sensorType)
      return false;
    if (match.topic && match.topic !== telemetry.topic) return false;
    if (match.sensorKey && match.sensorKey !== telemetry.sensorKey)
      return false;
    return true;
  }

  async publishReservedTopic(topic, payload) {
    try {
      if (this.actionDispatcher?.broadcastUpdate) {
        await this.actionDispatcher.broadcastUpdate(topic, payload);
      } else if (this.actionDispatcher?.mqtt?.publish) {
        this.actionDispatcher.mqtt.publish(topic, JSON.stringify(payload));
      }
    } catch (error) {
      this.logger.warn(
        { error: error.message, topic },
        "Reserved topic publish failed",
      );
    }
  }

  async createImportantAction({
    siteId,
    severity,
    title,
    message,
    source,
    metadata,
  }) {
    const importantAction = await ImportantAction.create({
      siteId: String(siteId || "default"),
      severity: severity || "medium",
      title,
      message,
      source: source || "engine",
      metadata: metadata || {},
      updatedAt: new Date(),
    });
    return importantAction;
  }

  async checkSuspectedProblems(telemetry) {
    const suspicious = [];
    const sensorType = String(telemetry.sensorType || "").toLowerCase();
    const value = Number(telemetry.value);

    if (sensorType === "temperature" && value > 36) {
      suspicious.push({
        severity: "high",
        title: "Temperature spike detected",
        message: `Temperature reached ${value}${telemetry.unit || ""} at ${telemetry.siteId}`,
      });
    }

    if (sensorType === "humidity" && value < 20) {
      suspicious.push({
        severity: "medium",
        title: "Humidity too low",
        message: `Humidity dropped to ${value}${telemetry.unit || "%"} at ${telemetry.siteId}`,
      });
    }

    if (sensorType === "co2" && value > 2000) {
      suspicious.push({
        severity: "critical",
        title: "CO2 critical",
        message: `CO2 reached ${value}${telemetry.unit || "ppm"} at ${telemetry.siteId}`,
      });
    }

    for (const issue of suspicious) {
      const alert = await Alert.create({
        siteId: telemetry.siteId,
        severity: issue.severity,
        message: issue.message,
      });

      const importantAction = await this.createImportantAction({
        siteId: telemetry.siteId,
        severity: issue.severity,
        title: issue.title,
        message: issue.message,
        source: "suspected_problem_engine",
        metadata: {
          sensorType: telemetry.sensorType,
          sensorKey: telemetry.sensorKey,
          topic: telemetry.topic,
          value: telemetry.value,
          alertId: String(alert._id),
        },
      });

      await this.publishReservedTopic(this.issueAlertTopic, {
        type: "suspected_problem",
        siteId: telemetry.siteId,
        severity: issue.severity,
        title: issue.title,
        message: issue.message,
        alertId: String(alert._id),
        importantActionId: String(importantAction._id),
        timestamp: new Date().toISOString(),
      });
    }

    return suspicious.length;
  }

  async executeRuleAction(rule, telemetry, actionText, branch = "then") {
    if (!actionText) return null;

    const parseActionDefinition = (rawAction) => {
      if (typeof rawAction !== "string")
        return { commandText: String(rawAction || "") };
      const trimmed = rawAction.trim();
      if (!trimmed) return { commandText: "" };

      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === "object") {
          return {
            commandText: trimmed,
            actionType:
              parsed.type === "actuator_command" ||
              parsed.type === "notification"
                ? parsed.type
                : "rule",
            parameters: parsed,
          };
        }
      } catch {
        // Keep plain string action
      }

      return { commandText: trimmed };
    };

    const actionDefinition = parseActionDefinition(actionText);
    const actionType = actionDefinition.actionType || "rule";
    const actionParameters = {
      ...(actionDefinition.parameters || {}),
      action: actionDefinition.commandText,
      ruleId: String(rule._id),
      branch,
      sensorType: telemetry.sensorType,
      value: telemetry.value,
      topic: telemetry.topic,
      siteId: telemetry.siteId,
      timestamp: new Date().toISOString(),
    };

    const action = await Action.create({
      name: `${rule.name} (${branch})`,
      type: actionType,
      siteId: rule.siteId,
      parameters: actionParameters,
      status: "pending",
    });

    if (this.actionDispatcher?.dispatch) {
      await this.actionDispatcher.dispatch(action);
    }

    if (rule.notifications?.enabled) {
      await this.publishReservedTopic(
        rule.notifications.mobileTopic || this.mobileNotificationTopic,
        {
          type: "rule_notification",
          siteId: rule.siteId,
          ruleId: String(rule._id),
          action: actionDefinition.commandText,
          branch,
          telemetry: {
            sensorType: telemetry.sensorType,
            value: telemetry.value,
            unit: telemetry.unit,
            topic: telemetry.topic,
          },
          timestamp: new Date().toISOString(),
        },
      );
    }

    return action;
  }

  async handleTelemetryEvent(telemetry) {
    if (!telemetry?.siteId) return { executedRules: 0, suspectedProblems: 0 };

    const [rules, suspectedProblems] = await Promise.all([
      Rule.find({ siteId: telemetry.siteId, active: true }).lean(),
      this.checkSuspectedProblems(telemetry),
    ]);

    let executedRules = 0;

    for (const rule of rules) {
      if (!this.evaluateTriggerMatch(rule, telemetry)) continue;

      const decision = this.logicEngine
        ? await this.logicEngine.evaluateRule(rule, telemetry)
        : { decision: false };

      if (decision?.decision) {
        await this.executeRuleAction(rule, telemetry, rule.action, "then");
        executedRules += 1;
      } else if (rule.elseAction) {
        await this.executeRuleAction(rule, telemetry, rule.elseAction, "else");
      }

      if (rule.trigger?.customPrompt && this.logicEngine?.gemini) {
        try {
          const aiOutcome = await this.logicEngine.gemini.analyzeCondition(
            rule.trigger.customPrompt,
            {
              telemetry,
              rule,
              decision,
            },
          );

          await this.publishReservedTopic(
            rule.notifications?.issueTopic || this.issueAlertTopic,
            {
              type: "custom_ai_trigger",
              siteId: telemetry.siteId,
              ruleId: String(rule._id),
              prompt: rule.trigger.customPrompt,
              decision,
              aiOutcome,
              timestamp: new Date().toISOString(),
            },
          );
        } catch (error) {
          this.logger.warn(
            { error: error.message, ruleId: String(rule._id) },
            "Custom prompt trigger failed",
          );
        }
      }
    }

    return { executedRules, suspectedProblems };
  }
}

module.exports = EventAutomationService;
