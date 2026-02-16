const express = require("express");
const router = express.Router();
const logger = require("pino")();

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

module.exports = router;
module.exports.setGeminiService = setGeminiService;
