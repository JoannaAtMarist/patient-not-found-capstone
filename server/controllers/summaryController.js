/* ─────────────────────────────────────────────────────────────────────────────────────
 * File: summaryController.js
 * Path: /server/controllers/summaryController.js
 * Description: Controller for AI APIs.
 * ───────────────────────────────────────────────────────────────────────────────────── */

//~ Imports
// Centralized AI config helper
import { getAIClient } from "../config/aiBootstrap.js";
import { getSummaryMode } from "../config/env.js";
// Prompt templates
import { summarizePrompt } from "../prompts/summarizePrompt.js";
import { summarizePromptEnhanced } from "../prompts/summarizePromptEnhanced.js";
import { phi4SummarizePrompt } from "../prompts/phi4SummarizePrompt.js";
// (will be) Used for Centralized error handling
import { errorHandler } from "../middleware/errorHandler.js";
// Shared OpenAI instance if in cloud mode
const client = getAIClient();
const summary_mode = getSummaryMode();

//~ Helpers
//. Normalize note
function normalizeNote(input) {
  if (!input) return "";
  // JSON case: { note: "..." }
  if (typeof input === "object" && "note" in input) return input.note;
  // text/plain case: raw string
  if (typeof input === "string") return input;
  return "";
}

//. safeJSON
function safeJSON(raw) {
  if (!raw) {
    return {
      summary: "",
      allergies: "",
      highlights: [],
      confidence_flags: []
    };
  }

  if (process.env.DEBUG_AI === "true") {
    console.log("Raw model output before parsing:");
    console.log(raw);
  }

  const match = raw.trim().match(/\{[\s\S]*\}/);
  if (!match) {
    console.warn("⚠️ No JSON object found in model output");
    return { summary: raw, allergies: "", removed_items: [] };
  }
  try {
    const parsed = JSON.parse(match[0]);
    return {
      summary: parsed.summary || "",
      allergies: parsed.allergies || "",
      highlights: parsed.highlights || [],
      confidence_flags: parsed.confidence_flags || []
    };
  } catch (err) {
    console.error("JSON.parse failed:", err.message);
    console.log("Match found was:\n", match[0]);
    return { summary: raw, allergies: "", removed_items: [] };
  }
}

//. safeJSONadvanced
function safeJSONadvanced(raw) {
  if (!raw) {
    return {
      summary: "",
      allergies: "",
      highlights: [],
      confidence_flags: []
    };
  }

  console.log("Raw model output before parsing:");
  console.log(raw);

  // Find JSON object in model output
  const match = raw.trim().match(/\{[\s\S]*\}/);
  if (!match) {
    console.warn("⚠️ No JSON object found in model output");
    return {
      summary: raw,
      allergies: "",
      highlights: [],
      confidence_flags: []
    };
  }

  try {
    const parsed = JSON.parse(match[0]);

    // Defensive defaults
    return {
      summary: parsed.summary || "",
      allergies: parsed.allergies || "",
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
      confidence_flags: Array.isArray(parsed.confidence_flags) ? parsed.confidence_flags : []
    };

  } catch (err) {
    console.error("JSON.parse failed:", err.message);
    console.log("Match found was:\n", match[0]);

    return {
      summary: raw,
      allergies: "",
      highlights: [],
      confidence_flags: []
    };
  }
}


//. SUMMARIZE helper
async function summarize(text, provider, prompt) {
  if (!text || text.trim() === "") {
    throw new Error("Missing note in request");
  }

  let res;

  if (provider === "openai") {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: text },
      ],
      temperature: 0.2,
    });
    if (summary_mode === "advanced") {
      res = safeJSONadvanced(completion.choices[0].message.content);
    } else {
      res = safeJSON(completion.choices[0].message.content);
    }
  } else if (provider === "phi4") {
    res = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "phi4-mini",
        prompt: `${prompt}${text}`,
        stream: false,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Ollama error ${res.status}: ${errText}`);
    }

    const data = await res.json();
    let output = (data.response || "").trim();
    output = output
      .replace(/\*\*+/g, "")
      .replace(/^-+\s*/gm, "")
      .replace(/\n{2,}/g, "\n")
      .replace(/\bSummary:\s*Summary:/i, "Summary:")
      .replace(/\bAllergies:\s*Allergies:/i, "Allergies:")
      .trim();

    const summaryMatch = output.match(/Summary:\s*([\s\S]*?)(?:\nAllergies:|$)/i);
    const allergyMatch = output.match(/Allergies:\s*([\s\S]*)/i);

    const summaryText = summaryMatch ? summaryMatch[1].trim() : output;
    const allergies = allergyMatch ? allergyMatch[1].trim() : "";

    res = { summary: summaryText, allergies: allergies === "None" ? "" : allergies };
  } else {
    throw new Error("Unsupported provider");
  }

  return res;
}


// Exports 

//~ OpenAI Summarization
export async function summarizeWithOpenAiCloud(body) {
  const noteText = normalizeNote(body);
  const prompt = body.promptOverride ||
    (summary_mode === "advanced"
      ? summarizePromptEnhanced
      : summarizePrompt);

  return await summarize(noteText, "openai", prompt);
}


//~ Ollama (local LLM) Phi-4 — Summarize Only
export async function summarizeWithPhi4(body) {
  const noteText = normalizeNote(body);
  return await summarize(noteText, "phi4", phi4SummarizePrompt);
}
