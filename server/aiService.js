// aiService.js
// Calls the OpenRouter chat-completions endpoint (OpenAI-compatible) and
// parses the model's JSON response into a risk-assessment object.

import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts.js";
import { heuristicScan } from "./heuristics.js";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function extractJson(raw) {
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```(json)?/i, "").trim();
  cleaned = cleaned.replace(/```$/, "").trim();
  if (!cleaned.startsWith("{")) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) cleaned = match[0];
  }
  return JSON.parse(cleaned);
}

async function callOnce(messageText, url, contextLabel, apiKey, model) {
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 2000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(messageText, url, contextLabel) },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter API error ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content || "";
  return extractJson(raw);
}

export async function analyzeWithAI(messageText, { url = "", contextLabel = "message" } = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "openrouter/free";

  if (!apiKey) {
    const fallback = heuristicScan(messageText, url);
    fallback._source = "heuristic_fallback";
    fallback._error = "OPENROUTER_API_KEY is not set on the server.";
    return fallback;
  }

  let lastError;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const result = await callOnce(messageText, url, contextLabel, apiKey, model);
      result._source = "ai";
      return result;
    } catch (err) {
      lastError = err;
    }
  }

  const fallback = heuristicScan(messageText, url);
  fallback._source = "heuristic_fallback";
  fallback._error = lastError.message;
  return fallback;
}