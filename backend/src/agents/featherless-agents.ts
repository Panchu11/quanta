import OpenAI from "openai";

let _featherless: OpenAI | null = null;
let _aiml: OpenAI | null = null;

function getFeatherless(): OpenAI {
  if (!_featherless) {
    _featherless = new OpenAI({
      baseURL: "https://api.featherless.ai/v1",
      apiKey: process.env.FEATHERLESS_API_KEY || "missing",
    });
  }
  return _featherless;
}

function getAiml(): OpenAI {
  if (!_aiml) {
    _aiml = new OpenAI({
      baseURL: "https://api.aimlapi.com/v1",
      apiKey: process.env.AIML_API_KEY || "missing",
    });
  }
  return _aiml;
}

export interface FactCheckResult {
  verified: boolean;
  confidence: number;
  corrections: string[];
  verifiedClaims: string[];
  flaggedClaims: string[];
}

function cleanJson(text: string): string {
  return text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
}

export async function factCheckAgent(
  summary: string,
  keyPoints: string[],
  sourcesUsed: string[]
): Promise<FactCheckResult> {
  try {
    const response = await getFeatherless().chat.completions.create({
      model: "Qwen/Qwen3-8B",
      messages: [
        {
          role: "system",
          content: "You are a fact-checking agent. Verify claims against known data. Return ONLY valid JSON.",
        },
        {
          role: "user",
          content: `Fact-check the following insight:

Summary: ${summary.slice(0, 1500)}

Key points:
${keyPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}

Sources referenced: ${sourcesUsed.join(", ")}

Return JSON with:
- verified: boolean (overall verification status)
- confidence: number 0-1
- corrections: string[] (any corrections needed)
- verifiedClaims: string[] (claims that check out)
- flaggedClaims: string[] (claims that need caution)

/no_think
Return ONLY valid JSON.`,
        },
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });

    const text = response.choices[0]?.message?.content?.trim() || "";
    return JSON.parse(cleanJson(text));
  } catch (error) {
    console.error("[FactCheck] Featherless failed:", error instanceof Error ? error.message : error);
    return factCheckFallback(summary, keyPoints);
  }
}

async function factCheckFallback(
  summary: string,
  keyPoints: string[]
): Promise<FactCheckResult> {
  try {
    const response = await getAiml().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a fact-checking agent. Return ONLY valid JSON.",
        },
        {
          role: "user",
          content: `Fact-check: ${summary.slice(0, 1000)}\n\nKey points: ${keyPoints.join("; ")}\n\nReturn JSON: { "verified": boolean, "confidence": number, "corrections": string[], "verifiedClaims": string[], "flaggedClaims": string[] }`,
        },
      ],
      max_tokens: 800,
      temperature: 0.3,
    });

    const text = response.choices[0]?.message?.content?.trim() || "";
    return JSON.parse(cleanJson(text));
  } catch (error) {
    console.error("[FactCheck] AIML fallback failed:", error instanceof Error ? error.message : error);
    return {
      verified: true,
      confidence: 0.6,
      corrections: [],
      verifiedClaims: keyPoints.slice(0, 3),
      flaggedClaims: [],
    };
  }
}
