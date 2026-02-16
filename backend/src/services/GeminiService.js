const { GoogleGenerativeAI } = require("@google/generative-ai");
const pino = require("pino");

const logger = pino();

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    // Default to latest Gemini 3 Flash (most balanced model)
    // Can override with GEMINI_MODEL env var
    // Available models: gemini-3-pro, gemini-3-flash, gemini-2.5-flash, gemini-2.5-flash-lite, gemini-2.5-pro
    this.modelName = process.env.GEMINI_MODEL || "gemini-3-flash";

    if (!this.apiKey) {
      logger.warn("GEMINI_API_KEY not set - AI features will be limited");
    }

    this.client = new GoogleGenerativeAI(this.apiKey);
    this.model = this.client.getGenerativeModel({ model: this.modelName });

    logger.info(
      { model: this.modelName },
      "GeminiService initialized with model",
    );
  }

  async analyzeCondition(description, context = {}) {
    try {
      const prompt = `You are an agricultural AI assistant. Analyze this farming condition and provide actionable recommendations.

Condition: ${description}
Context: ${JSON.stringify(context, null, 2)}

Provide:
1. Risk assessment (low/medium/high)
2. Immediate actions needed
3. Long-term recommendations
4. Estimated outcome

Be concise and specific.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      logger.info({ description }, "Gemini analysis completed");
      return { analysis: text, timestamp: new Date().toISOString() };
    } catch (error) {
      logger.error({ error }, "Gemini analysis failed");
      throw error;
    }
  }

  async generateDecision(rule, telemetry = {}) {
    try {
      const prompt = `As an agricultural automation AI, make a decision based on this rule and telemetry.

Rule: ${JSON.stringify(rule, null, 2)}
Telemetry: ${JSON.stringify(telemetry, null, 2)}

Provide JSON response with:
- decision: boolean (should action be triggered?)
- confidence: 0-1
- reasoning: string
- parameters: object

Respond only with valid JSON.`;

      const result = await this.model.generateContent(prompt);
      const output = await result.response;
      const responseText = output.text();
      const decision = JSON.parse(responseText);

      logger.info(
        { ruleId: rule.id, decision: decision.decision },
        "Gemini decision made",
      );
      return decision;
    } catch (error) {
      logger.error({ error }, "Gemini decision generation failed");
      throw error;
    }
  }

  async summarizeTelemetry(telemetryData, period = "24h") {
    try {
      const prompt = `Summarize this agricultural telemetry data for the past ${period}.

Data: ${JSON.stringify(telemetryData, null, 2)}

Provide:
- Key metrics summary
- Anomalies detected
- Recommendations
- Trend analysis`;

      const result = await this.model.generateContent(prompt);
      return {
        summary: result.response.text(),
        period,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error({ error }, "Telemetry summarization failed");
      throw error;
    }
  }
}

module.exports = GeminiService;
