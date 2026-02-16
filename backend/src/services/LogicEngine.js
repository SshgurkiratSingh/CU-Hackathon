const pino = require("pino");
const { Rule, Action, LLMThinkingLog } = require("../schemas");

const logger = pino();

class LogicEngine {
  constructor(geminiService, marketplaceService) {
    this.gemini = geminiService;
    this.marketplace = marketplaceService;
  }

  // Evaluate rule based on condition type
  async evaluateRule(rule, telemetry) {
    try {
      let decision = { decision: false, confidence: 0, reasoning: "" };

      if (rule.condition.type === "threshold") {
        // Hard logic: compare telemetry value against threshold
        decision = this.evaluateThresholdCondition(rule, telemetry);
      } else if (rule.condition.type === "llm") {
        // AI decision using Gemini
        decision = await this.gemini.generateDecision(rule, telemetry);
      } else if (rule.condition.type === "time") {
        // Time-based condition
        decision = this.evaluateTimeCondition(rule);
      }

      // Store thinking log
      const thinkingLog = new LLMThinkingLog({
        ruleId: rule._id,
        thinking: rule.description || rule.condition.value,
        decision: decision.decision,
        confidence: decision.confidence || 0,
      });
      await thinkingLog.save();

      return {
        ...decision,
        ruleId: rule._id,
        evaluated_at: new Date(),
      };
    } catch (error) {
      logger.error({ ruleId: rule._id, error }, "Rule evaluation failed");
      throw error;
    }
  }

  // Threshold condition: compare telemetry against numeric threshold
  evaluateThresholdCondition(rule, telemetry) {
    try {
      const threshold = parseFloat(rule.condition.value);
      const value = telemetry.value || 0;
      let decision = false;

      // Parse operator from description (e.g., "> 25", "< 40")
      const operator = rule.condition.description || ">";

      if (operator.includes(">") && !operator.includes("=")) {
        decision = value > threshold;
      } else if (operator.includes("<") && !operator.includes("=")) {
        decision = value < threshold;
      } else if (operator.includes(">=")) {
        decision = value >= threshold;
      } else if (operator.includes("<=")) {
        decision = value <= threshold;
      } else if (operator.includes("==") || operator.includes("=")) {
        decision = Math.abs(value - threshold) < 0.01;
      }

      return {
        decision,
        confidence: 0.95,
        reasoning: `Telemetry value ${value} ${operator} threshold ${threshold}`,
      };
    } catch (error) {
      logger.error({ error }, "Threshold evaluation failed");
      return { decision: false, confidence: 0, reasoning: "Evaluation error" };
    }
  }

  // Time-based condition
  evaluateTimeCondition(rule) {
    try {
      const now = new Date();
      const timeValue = rule.condition.value; // e.g., "06:00-20:00" or "morning"

      let decision = false;
      const hour = now.getHours();

      if (timeValue.includes(":")) {
        const [start, end] = timeValue.split("-");
        const [startHour] = start.split(":").map(Number);
        const [endHour] = end.split(":").map(Number);
        decision = hour >= startHour && hour < endHour;
      } else if (timeValue === "morning") {
        decision = hour >= 6 && hour < 12;
      } else if (timeValue === "afternoon") {
        decision = hour >= 12 && hour < 18;
      } else if (timeValue === "evening") {
        decision = hour >= 18 || hour < 6;
      }

      return {
        decision,
        confidence: 1.0,
        reasoning: `Current time ${hour}:00 matches condition '${timeValue}'`,
      };
    } catch (error) {
      logger.error({ error }, "Time condition evaluation failed");
      return {
        decision: false,
        confidence: 0,
        reasoning: "Time evaluation error",
      };
    }
  }

  // Execute actions if rule conditions met
  async executeActions(actions, context) {
    try {
      const results = [];

      for (const action of actions) {
        try {
          // Update action status to executing
          await Action.updateOne({ _id: action._id }, { status: "executing" });

          // Perform action execution
          const result = await this.executeAction(action, context);

          // Update action status to completed
          await Action.updateOne(
            { _id: action._id },
            {
              status: "completed",
              executedAt: new Date(),
              result,
            },
          );

          results.push({
            actionId: action._id,
            status: "completed",
            result,
          });
        } catch (err) {
          logger.error(
            { actionId: action._id, error: err },
            "Single action execution failed",
          );
          await Action.updateOne(
            { _id: action._id },
            { status: "failed", result: { error: err.message } },
          );
          results.push({
            actionId: action._id,
            status: "failed",
            error: err.message,
          });
        }
      }

      return results;
    } catch (error) {
      logger.error({ error }, "Action execution failed");
      throw error;
    }
  }

  // Execute single action based on type
  async executeAction(action, context) {
    const { type, parameters } = action;

    switch (type) {
      case "mqtt_publish":
        return {
          type: "mqtt_published",
          topic: parameters.topic,
          message: parameters.message,
        };
      case "notification":
        return {
          type: "notification_sent",
          channel: parameters.channel,
          recipient: parameters.recipient,
        };
      case "api_call":
        return {
          type: "api_called",
          endpoint: parameters.endpoint,
        };
      default:
        return { type: "unknown_action", action };
    }
  }
}

module.exports = LogicEngine;
