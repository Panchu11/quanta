import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";
import OpenAI from "openai";

let _model: GenerativeModel | null = null;
let _fallback: OpenAI | null = null;

function getModel(): GenerativeModel {
  if (!_model) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY not set");
    const genAI = new GoogleGenerativeAI(key);
    _model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
  }
  return _model;
}

function getFallback(): OpenAI {
  if (!_fallback) {
    _fallback = new OpenAI({
      baseURL: "https://api.aimlapi.com/v1",
      apiKey: process.env.AIML_API_KEY || "missing",
    });
  }
  return _fallback;
}

export interface QueryAnalysis {
  complexity: number;
  requiredSources: string[];
  subTasks: string[];
  tokenEstimate: number;
  category: string;
}

export interface ResearchResult {
  task: string;
  findings: string;
  sourcesUsed: string[];
  confidence: number;
}

export interface SynthesisResult {
  summary: string;
  keyPoints: string[];
  conflicts: string[];
  confidence: number;
}

function cleanJson(text: string): string {
  return text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
}

async function callGemini(prompt: string): Promise<string> {
  try {
    const result = await getModel().generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("429") || msg.includes("quota")) {
      console.warn("[Gemini] Rate limited, falling back to AIML API");
      return callFallback(prompt);
    }
    throw error;
  }
}

async function callFallback(prompt: string): Promise<string> {
  const response = await getFallback().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Return ONLY valid JSON. No markdown, no explanation." },
      { role: "user", content: prompt },
    ],
    max_tokens: 2000,
    temperature: 0.4,
  });
  return response.choices[0]?.message?.content?.trim() || "{}";
}

export async function analyzeQuery(query: string): Promise<QueryAnalysis> {
  const prompt = `You are a query complexity analyzer for a data intelligence platform. Analyze the following user query and return a JSON object with these fields:

- complexity: integer 1-5 (1=simple factual lookup, 2=basic analysis, 3=multi-source analysis, 4=deep synthesis, 5=comprehensive research)
- requiredSources: array of strings describing data sources needed (e.g. "financial data", "news articles", "social media", "patent databases", "academic papers", "market data")
- subTasks: array of strings, each a discrete research task to answer this query
- tokenEstimate: estimated number of tokens for a complete response (100-2000)
- category: one of "finance", "technology", "science", "general", "market", "legal", "health"

Query: "${query}"

Return ONLY valid JSON, no markdown, no explanation.`;

  try {
    const text = await callGemini(prompt);
    return JSON.parse(cleanJson(text));
  } catch (error) {
    console.error("[Analyzer] Failed:", error instanceof Error ? error.message : error);
    return {
      complexity: 2,
      requiredSources: ["general knowledge"],
      subTasks: [query],
      tokenEstimate: 500,
      category: "general",
    };
  }
}

export async function researchAgent(
  task: string,
  sources: string[]
): Promise<ResearchResult> {
  const prompt = `You are a research agent for a data intelligence platform. Research the following task thoroughly.

Task: ${task}
Data sources to consult: ${sources.join(", ")}

Provide thorough, factual findings. Include specific data points, numbers, dates, and references where possible.

Return ONLY valid JSON with these fields:
- findings: string (detailed research findings, 2-4 paragraphs)
- sourcesUsed: array of strings (which sources you consulted)
- confidence: number 0-1 (how confident you are in the findings)`;

  try {
    const text = await callGemini(prompt);
    return JSON.parse(cleanJson(text));
  } catch (error) {
    console.error("[Research] Failed:", error instanceof Error ? error.message : error);
    return {
      task,
      findings: "Research could not be completed at this time.",
      sourcesUsed: sources,
      confidence: 0.3,
    };
  }
}

export async function synthesisAgent(
  originalQuery: string,
  findings: ResearchResult[]
): Promise<SynthesisResult> {
  const prompt = `You are a synthesis agent for a data intelligence platform. Merge multiple research findings into a coherent, actionable insight.

Original query: ${originalQuery}

Research findings:
${findings.map((f, i) => `[Finding ${i + 1}] ${f.findings}`).join("\n\n")}

Create a comprehensive synthesis that:
1. Merges all findings into a coherent narrative
2. Highlights key insights and data points
3. Identifies any conflicts between sources
4. Provides actionable conclusions

Return ONLY valid JSON with these fields:
- summary: string (comprehensive synthesized insight, 3-5 paragraphs)
- keyPoints: array of strings (5-8 key takeaways, each 1-2 sentences)
- conflicts: array of strings (any conflicting information found, empty if none)
- confidence: number 0-1 (overall confidence in the synthesis)`;

  try {
    const text = await callGemini(prompt);
    return JSON.parse(cleanJson(text));
  } catch (error) {
    console.error("[Synthesis] Failed:", error instanceof Error ? error.message : error);
    return {
      summary: findings.map((f) => f.findings).join("\n\n"),
      keyPoints: ["Synthesis could not be completed."],
      conflicts: [],
      confidence: 0.3,
    };
  }
}
