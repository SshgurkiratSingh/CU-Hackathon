const express = require("express");
const router = express.Router();
const logger = require("pino")();
const {
  Device,
  Telemetry,
  Rule,
  Alert,
  ImportantAction,
  AssistantPlan,
} = require("../schemas");

// Response helpers
const successResponse = (message, data) => ({
  success: true,
  message,
  data,
  timestamp: new Date().toISOString(),
});
const errorResponse = (error, status = 400) => ({
  success: false,
  error,
  timestamp: new Date().toISOString(),
});

// Initialize services - will be injected as middleware
let geminiService = null;

const setGeminiService = (service) => {
  geminiService = service;
};

const buildAssistantContext = async (siteId) => {
  const siteFilter = siteId ? { siteId } : {};
  const [devices, telemetry, rules, alerts, importantActions] =
    await Promise.all([
      Device.find(siteFilter).lean(),
      Telemetry.find(siteFilter).sort({ timestamp: -1 }).limit(80).lean(),
      Rule.find(siteFilter).sort({ createdAt: -1 }).limit(40).lean(),
      Alert.find({ ...siteFilter, resolved: false })
        .sort({ createdAt: -1 })
        .limit(25)
        .lean(),
      ImportantAction.find({ ...siteFilter, status: { $ne: "done" } })
        .sort({ createdAt: -1 })
        .limit(25)
        .lean(),
    ]);

  const topics = devices.flatMap((device) =>
    (device.sensors || []).map((sensor) => sensor.mqttTopic).filter(Boolean),
  );

  return {
    siteId: siteId || "all",
    devices,
    topics: [...new Set(topics)],
    telemetry,
    rules,
    alerts,
    importantActions,
  };
};

/**
 * POST /api/ai/analyze
 * Analyzes farming conditions using Gemini AI
 */
router.post("/analyze", async (req, res) => {
  try {
    if (!geminiService) {
      return res
        .status(503)
        .json(errorResponse("AI service not available", 503));
    }

    const { condition, context } = req.body;

    if (!condition) {
      return res.status(400).json(errorResponse("Condition is required", 400));
    }

    logger.info({ condition, context }, "Analyzing condition with Gemini");

    const analysis = await geminiService.analyzeCondition(condition, context);

    return res.status(200).json(
      successResponse("Condition analysis complete", {
        condition,
        analysis,
      }),
    );
  } catch (error) {
    logger.error(
      { error: error.message, stack: error.stack },
      "Gemini analyze failed",
    );
    return res
      .status(500)
      .json(errorResponse(error.message || "Analysis failed", 500));
  }
});

/**
 * POST /api/ai/decide
 * Makes decisions based on conditions using Gemini AI
 */
router.post("/decide", async (req, res) => {
  try {
    if (!geminiService) {
      return res
        .status(503)
        .json(errorResponse("AI service not available", 503));
    }

    const { condition, options, farm_id } = req.body;

    if (!condition || !options || !Array.isArray(options)) {
      return res
        .status(400)
        .json(errorResponse("Condition and options array are required", 400));
    }

    logger.info({ condition, options, farm_id }, "Making decision with Gemini");

    const decision = await geminiService.generateDecision(
      condition,
      options,
      farm_id,
    );

    return res.status(200).json(
      successResponse("Decision generated", {
        condition,
        options,
        decision,
      }),
    );
  } catch (error) {
    logger.error(
      { error: error.message, stack: error.stack },
      "Gemini decide failed",
    );
    return res
      .status(500)
      .json(errorResponse(error.message || "Decision failed", 500));
  }
});

/**
 * POST /api/ai/summarize
 * Summarizes telemetry data using Gemini AI
 */
router.post("/summarize", async (req, res) => {
  try {
    if (!geminiService) {
      return res
        .status(503)
        .json(errorResponse("AI service not available", 503));
    }

    const { telemetry } = req.body;

    if (!telemetry) {
      return res
        .status(400)
        .json(errorResponse("Telemetry data is required", 400));
    }

    logger.info({ telemetry }, "Summarizing telemetry with Gemini");

    const summary = await geminiService.summarizeTelemetry(telemetry);

    return res.status(200).json(
      successResponse("Telemetry summary complete", {
        telemetry,
        summary,
      }),
    );
  } catch (error) {
    logger.error(
      { error: error.message, stack: error.stack },
      "Gemini summarize failed",
    );
    return res
      .status(500)
      .json(errorResponse(error.message || "Summarization failed", 500));
  }
});

router.get("/assistant/plans", async (req, res) => {
  try {
    const { siteId, limit = 25 } = req.query;
    const filter = siteId ? { siteId } : {};
    const plans = await AssistantPlan.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10))
      .lean();

    return res
      .status(200)
      .json(successResponse("Assistant plans fetched", plans));
  } catch (error) {
    logger.error(
      { error: error.message, stack: error.stack },
      "Assistant plans fetch failed",
    );
    return res
      .status(500)
      .json(errorResponse(error.message || "Failed to fetch plans", 500));
  }
});

router.post("/assistant/trigger", async (req, res) => {
  try {
    const {
      siteId,
      name,
      eventType,
      customPrompt,
      condition,
      action,
      elseAction,
    } = req.body || {};

    if (!siteId || !name || !eventType || !customPrompt || !action) {
      return res
        .status(400)
        .json(
          errorResponse(
            "siteId, name, eventType, customPrompt and action are required",
            400,
          ),
        );
    }

    const rule = await Rule.create({
      name,
      siteId,
      condition: condition || {
        type: "event",
        value: eventType,
        description: "AI trigger rule",
      },
      action,
      elseAction,
      eventType,
      trigger: {
        type: "event",
        match: { eventType },
        customPrompt,
      },
      notifications: {
        enabled: true,
      },
      createdBy: req.user?.id,
      active: true,
    });

    return res
      .status(201)
      .json(successResponse("Assistant event trigger created", rule));
  } catch (error) {
    logger.error(
      { error: error.message, stack: error.stack },
      "Assistant trigger creation failed",
    );
    return res
      .status(500)
      .json(errorResponse(error.message || "Failed to create trigger", 500));
  }
});

router.post("/assistant/query", async (req, res) => {
  try {
    const {
      prompt,
      siteId,
      capabilities = {},
      createRule,
      createAlert,
      createPlan,
    } = req.body || {};

    if (!prompt) {
      return res.status(400).json(errorResponse("Prompt is required", 400));
    }

    const context = await buildAssistantContext(siteId);
    const summary = {
      siteId: context.siteId,
      devicesCount: context.devices.length,
      topicsCount: context.topics.length,
      telemetryRows: context.telemetry.length,
      openAlerts: context.alerts.length,
      openImportantActions: context.importantActions.length,
      activeRules: context.rules.filter((r) => r.active).length,
    };

    let assistantText = `Assistant context loaded for site ${summary.siteId}. Devices: ${summary.devicesCount}, Topics: ${summary.topicsCount}, Telemetry rows: ${summary.telemetryRows}, Open alerts: ${summary.openAlerts}.`;

    if (geminiService && capabilities.useAI !== false) {
      const analysis = await geminiService.analyzeCondition(prompt, {
        capabilities,
        summary,
        sampleTelemetry: context.telemetry.slice(0, 20),
      });
      assistantText = analysis.analysis || assistantText;
    }

    const created = {};

    if (createRule?.enabled) {
      const rule = await Rule.create({
        name: createRule.name || `AI Rule ${new Date().toLocaleTimeString()}`,
        siteId: siteId || createRule.siteId || "default",
        condition: createRule.condition || {
          type: "logic",
          value: "ai_generated",
          description: prompt,
        },
        action: createRule.action || "Review and execute AI recommendation",
        elseAction: createRule.elseAction,
        trigger: createRule.trigger || { type: "telemetry" },
        variables: Array.isArray(createRule.variables)
          ? createRule.variables
          : [],
        logic: createRule.logic,
        timer: createRule.timer,
        notifications: {
          enabled: Boolean(createRule.notify),
          mobileTopic:
            createRule.mobileTopic ||
            process.env.MQTT_MOBILE_NOTIFICATION_TOPIC,
          issueTopic:
            createRule.issueTopic || process.env.MQTT_ISSUE_ALERT_TOPIC,
        },
        createdBy: req.user?.id,
      });
      created.rule = rule;
    }

    if (createAlert?.enabled) {
      const alert = await Alert.create({
        siteId: siteId || createAlert.siteId || "default",
        severity: createAlert.severity || "medium",
        message: createAlert.message || assistantText.slice(0, 280),
      });
      created.alert = alert;
    }

    if (createPlan?.enabled) {
      const plan = await AssistantPlan.create({
        siteId: siteId || "default",
        prompt,
        plan: Array.isArray(createPlan.steps)
          ? createPlan.steps
          : [assistantText],
        actions: Array.isArray(createPlan.actions) ? createPlan.actions : [],
        createdBy: req.user?.id,
      });
      created.plan = plan;
    }

    return res.status(200).json(
      successResponse("Assistant response generated", {
        prompt,
        assistantText,
        summary,
        capabilities,
        context: {
          devices: context.devices,
          topics: context.topics,
          telemetry: context.telemetry,
          rules: context.rules,
          alerts: context.alerts,
          importantActions: context.importantActions,
        },
        created,
      }),
    );
  } catch (error) {
    logger.error(
      { error: error.message, stack: error.stack },
      "Assistant query failed",
    );
    return res
      .status(500)
      .json(errorResponse(error.message || "Assistant query failed", 500));
  }
});

module.exports = router;
module.exports.setGeminiService = setGeminiService;
