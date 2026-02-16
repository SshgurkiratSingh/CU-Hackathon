const pino = require("pino");
const { LLMThinkingLog } = require("../schemas");

const logger = pino();

class MemoryService {
  // Store LLM thinking log for decision retroinspection
  async storeThinkingLog(thinking) {
    try {
      const log = new LLMThinkingLog({
        ruleId: thinking.ruleId,
        thinking: thinking.thinking,
        decision: thinking.decision,
        confidence: thinking.confidence || 0,
      });

      await log.save();
      logger.info({ logId: log._id }, "Thinking log stored");
      return { logged: true, logId: log._id };
    } catch (error) {
      logger.error({ error }, "Failed to store thinking log");
      throw error;
    }
  }

  // Retrieve decision memory with filtering
  async getDecisionMemory(criteria = {}) {
    try {
      const filter = {};

      if (criteria.ruleId) {
        filter.ruleId = criteria.ruleId;
      }

      if (criteria.startDate || criteria.endDate) {
        filter.timestamp = {};
        if (criteria.startDate) {
          filter.timestamp.$gte = new Date(criteria.startDate);
        }
        if (criteria.endDate) {
          filter.timestamp.$lte = new Date(criteria.endDate);
        }
      }

      const decisions = await LLMThinkingLog.find(filter)
        .sort({ timestamp: -1 })
        .limit(criteria.limit || 100);

      logger.info({ count: decisions.length }, "Decision memory retrieved");
      return {
        decisions,
        count: decisions.length,
      };
    } catch (error) {
      logger.error({ error }, "Failed to retrieve decision memory");
      throw error;
    }
  }

  // Store decision feedback for learning
  async storeDecision(decision) {
    try {
      const log = new LLMThinkingLog({
        ruleId: decision.ruleId,
        thinking: JSON.stringify(decision.context || {}),
        decision: decision.action || true,
        confidence: decision.confidence || 0,
      });

      await log.save();
      logger.info({ decisionId: log._id }, "Decision stored");
      return { stored: true, decisionId: log._id };
    } catch (error) {
      logger.error({ error }, "Failed to store decision");
      throw error;
    }
  }

  // Analyze patterns in decisions
  async analyzePatterns(criteria = {}) {
    try {
      const filter = {};

      if (criteria.ruleId) {
        filter.ruleId = criteria.ruleId;
      }

      if (criteria.days) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - criteria.days);
        filter.timestamp = { $gte: startDate };
      }

      const logs = await LLMThinkingLog.find(filter).sort({ timestamp: -1 });

      // Calculate statistics
      const totalDecisions = logs.length;
      const trueDecisions = logs.filter((l) => l.decision === true).length;
      const falseDecisions = logs.filter((l) => l.decision === false).length;
      const avgConfidence =
        logs.length > 0
          ? logs.reduce((sum, l) => sum + (l.confidence || 0), 0) / logs.length
          : 0;

      const patterns = {
        totalDecisions,
        trueCount: trueDecisions,
        falseCount: falseDecisions,
        truePercentage:
          totalDecisions > 0
            ? ((trueDecisions / totalDecisions) * 100).toFixed(2)
            : 0,
        averageConfidence: avgConfidence.toFixed(3),
        timeRange: {
          start: logs[logs.length - 1]?.timestamp,
          end: logs[0]?.timestamp,
        },
      };

      logger.info({ patterns }, "Pattern analysis completed");
      return patterns;
    } catch (error) {
      logger.error({ error }, "Pattern analysis failed");
      throw error;
    }
  }

  // Record user feedback on decision
  async recordFeedback(decisionId, feedback) {
    try {
      // Find and update the decision log with feedback
      const log = await LLMThinkingLog.findByIdAndUpdate(
        decisionId,
        {
          userFeedback: feedback.rating, // good/bad/neutral
          feedbackComment: feedback.comment,
          feedbackRecordedAt: new Date(),
        },
        { new: true },
      );

      logger.info(
        { decisionId, feedback: feedback.rating },
        "Feedback recorded",
      );
      return {
        recorded: true,
        decisionId,
        feedback,
      };
    } catch (error) {
      logger.error({ error }, "Failed to record feedback");
      throw error;
    }
  }

  // Generate learning report
  async generateLearningReport(criteria = {}) {
    try {
      const patterns = await this.analyzePatterns(criteria);

      const report = {
        generatedAt: new Date(),
        period: criteria.days ? `${criteria.days} days` : "all time",
        summary: patterns,
        recommendations: this.generateRecommendations(patterns),
      };

      logger.info({ period: report.period }, "Learning report generated");
      return report;
    } catch (error) {
      logger.error({ error }, "Failed to generate learning report");
      throw error;
    }
  }

  // Generate recommendations based on patterns
  generateRecommendations(patterns) {
    const recommendations = [];

    if (patterns.averageConfidence < 0.7) {
      recommendations.push(
        "Average confidence is low. Consider refining rules or adding more context.",
      );
    }

    if (patterns.truePercentage > 80) {
      recommendations.push(
        "High percentage of true decisions. Monitor for potential over-triggering.",
      );
    }

    if (patterns.truePercentage < 20) {
      recommendations.push(
        "Low percentage of true decisions. Review rule conditions.",
      );
    }

    if (patterns.totalDecisions < 10) {
      recommendations.push(
        "Limited data available. Collect more decisions for better analysis.",
      );
    }

    return recommendations.length > 0
      ? recommendations
      : ["System performing within normal parameters."];
  }
}

module.exports = MemoryService;
