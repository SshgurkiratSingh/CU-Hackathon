// Try to load real Gemini, fallback to mock if not available
let GoogleGenerativeAI;
let isRealGemini = false;

try {
  const { GoogleGenerativeAI: RealGemini } = require("@google/generative-ai");
  GoogleGenerativeAI = RealGemini;
  isRealGemini = true;
} catch (error) {
  // Fallback to mock if package not installed
  GoogleGenerativeAI = class MockGoogleGenerativeAI {
    constructor(apiKey) {
      this.apiKey = apiKey;
    }
  };
}

const pino = require("pino");
const logger = pino();

class GeminiService {
  constructor() {
    this.client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Default to latest Gemini 3 Flash (most balanced model)
    // Available models: gemini-3-pro, gemini-3-flash, gemini-2.5-flash, gemini-2.5-flash-lite, gemini-2.5-pro
    this.model = process.env.GEMINI_MODEL || "gemini-3-flash";
    this.thinkingEnabled = process.env.LLM_THINKING_ENABLED === "true";
  }

  async decideWithThinking(prompt, telemetryContext) {
    try {
      const fullPrompt = `
You are an agricultural decision-making AI for a greenhouse automation system.
Analyze the following telemetry data and provide a clear decision.

Telemetry Context:
${JSON.stringify(telemetryContext, null, 2)}

User Prompt:
${prompt}

Provide your decision in the following JSON format:
{
  "decision": "TRIGGER_ACTION|NO_ACTION|REQUIRE_APPROVAL",
  "reasoning": "brief explanation",
  "confidence": 0.0-1.0
}
      `;

      const model = this.client.getGenerativeModel({
        model: this.model,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
          ...(this.thinkingEnabled && {
            thinking: { type: "ENABLED", budgetTokens: 5000 },
          }),
        },
      });

      const startTime = Date.now();
      const response = await model.generateContent(fullPrompt);
      const latency = Date.now() - startTime;

      const responseText = response.content.parts[0]?.text || "{}";
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const result = JSON.parse(
        jsonMatch?.[0] || '{"decision":"REQUIRE_APPROVAL","confidence":0.5}',
      );

      // Extract thinking if available
      let thinking = "";
      let reasoningChain = [];

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.thinking) {
            thinking = part.thinking;
            reasoningChain = this.extractReasoningSteps(thinking);
          }
        }
      }

      return {
        thinking,
        reasoning: result.reasoning || "No explanation provided",
        conclusion: result.decision || "REQUIRE_APPROVAL",
        confidence: result.confidence || 0.5,
        reasoningChain,
        tokensUsed: {
          input: response.usageMetadata?.promptTokenCount || 0,
          output: response.usageMetadata?.candidatesTokenCount || 0,
        },
        latency,
      };
    } catch (error) {
      logger.error({ error }, "Gemini decision failed");
      return {
        thinking: "Error occurred",
        conclusion: "REQUIRE_APPROVAL",
        confidence: 0,
        reasoningChain: [{ step: 1, description: "Error processing request" }],
      };
    }
  }

  extractReasoningSteps(thinking) {
    const steps = [];
    const sentences = thinking.split(/[.!?]+/);

    sentences.forEach((sentence, index) => {
      const trimmed = sentence.trim();
      if (trimmed.length > 10) {
        steps.push({
          step: index + 1,
          description: trimmed,
          confidence: 0.7,
        });
      }
    });

    return steps;
  }

  async generateSummary(decisions, timeWindow = "24h") {
    try {
      const prompt = `
Summarize the following greenhouse automation decisions made in the last ${timeWindow}:

${JSON.stringify(decisions, null, 2)}

Provide a concise daily summary for the farmer including:
1. Number of actions triggered
2. Key decisions made
3. Any patterns or concerns
4. Recommendations
      `;

      const model = this.client.getGenerativeModel({ model: this.model });
      const response = await model.generateContent(prompt);
      return response.content.parts[0]?.text || "No summary available";
    } catch (error) {
      logger.error({ error }, "Summary generation failed");
      throw error;
    }
  }

  async explainAction(action, decision) {
    try {
      const prompt = `
Explain in simple, farmer-friendly language why this action was taken:

Action: ${action}
Decision Context: ${JSON.stringify(decision)}

Keep explanation brief (1-2 sentences), avoid technical jargon.
      `;

      const model = this.client.getGenerativeModel({ model: this.model });
      const response = await model.generateContent(prompt);
      return (
        response.content.parts[0]?.text ||
        "Action triggered by automation system"
      );
    } catch (error) {
      logger.error({ error }, "Explanation generation failed");
      throw error;
    }
  }

  async query(question, context) {
    try {
      const prompt = `
Context: ${JSON.stringify(context)}

User Question: ${question}

Provide a helpful response based on the greenhouse telemetry data provided.
      `;

      const model = this.client.getGenerativeModel({ model: this.model });
      const response = await model.generateContent(prompt);
      return response.content.parts[0]?.text || "Unable to process query";
    } catch (error) {
      logger.error({ error }, "Query failed");
      throw error;
    }
  }
}

module.exports = GeminiService;
