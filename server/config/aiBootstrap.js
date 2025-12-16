/* ─────────────────────────────────────────────────────────────────────────────────────
 * File: aiBootstrap.js
 * Path: /server/config/aiBootstrap.js
 * Description: Handles setup and optional warm-up of AI models (OpenAI or local Ollama).
 *      Used at server startup to prepare summarization mode and ensure fast first request.
 * TODO: Add Mistral & others
 * ───────────────────────────────────────────────────────────────────────────────────── */

//~ Imports
import OpenAI from "openai";
import { performance } from "perf_hooks";
import { AI_MODE } from "./env.js";

let client = null; // will hold OpenAI client if needed

//. Log to catch an issue
console.log("[aiBootstrap] module loaded");

try {
    console.log("🔑 [aiBootstrap] OPENAI_API_KEY exists?", Boolean(process.env.OPENAI_API_KEY));
    console.log("🤖 [aiBootstrap] AI_MODE:", process.env.AI_MODE);
} catch (err) {
    console.error("❌ [aiBootstrap] crashed during import:", err);
}


// Exports 
export function initializeAI() {
    if (AI_MODE === "local") {
        console.log("Running in local LLM mode (Ollama expected on localhost:11434)");
        console.log("--> Using summarizeWithPhi4:14b() as default summarizer");
        warmUpLocalModel();
    } else {
        console.log("Running in OpenAI mode (cloud API)");
        console.log("--> Using summarizeWithOpenAiCloud() as default summarizer");
        client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        console.log("🔑 OpenAI key loaded?", !!process.env.OPENAI_API_KEY);
    }
    return client;
}

// OpenAI client mode getter
export function getAIClient() {
    if (!client && AI_MODE !== "local") {
        client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return client;
}

///. Helper: run note-type validation for any provider (cloud or local)
export async function runNoteTypeCheck({ provider = "openai", prompt }) {
    if (!prompt || !prompt.trim()) {
        throw new Error("[aiBootstrap] Empty prompt passed to runNoteTypeCheck");
    }

    const mode = AI_MODE || process.env.AI_MODE || "cloud";
    const p = (provider || "openai").toLowerCase();

    // ─────────────────────────────────────
    // LOCAL MODE / OLLAMA PATH (phi4 etc.)
    // ─────────────────────────────────────
    if (mode === "local" || p === "phi4" || p === "phi4-mini") {
        const PHI_NOTE_MODEL =
            process.env.PHI_NOTE_MODEL || process.env.PHI_MODEL || "phi4:14b";

        console.log(
            "[aiBootstrap] runNoteTypeCheck -> local Ollama model:",
            PHI_NOTE_MODEL
        );

        const res = await fetch("http://localhost:11434/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: PHI_NOTE_MODEL,
                prompt,
                stream: false,
            }),
        });

        if (!res.ok) {
            const text = await res.text();
            console.warn(
                `[aiBootstrap] Ollama note-type call failed (HTTP ${res.status}):`,
                text
            );
            throw new Error(
                `Local note-type validation failed (status ${res.status})`
            );
        }

        const data = await res.json();
        const reply = (data.response || "").trim();
        console.log(
            "[aiBootstrap] Ollama note-type reply (truncated):",
            reply.slice(0, 80)
        );
        return reply;
    }

    // ─────────────────────────────────────
    // CLOUD OPENAI PATH
    // ─────────────────────────────────────
    if (!client) {
        // lazily init in case initializeAI wasn't called yet
        client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }

    const model = process.env.NOTE_TYPE_MODEL || "gpt-4o-mini";

    console.log(
        "[aiBootstrap] runNoteTypeCheck -> OpenAI model:",
        model,
        "provider:",
        provider
    );

    const completion = await client.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
    });

    const reply =
        completion.choices?.[0]?.message?.content?.trim() || "";
    return reply;
}

//. Helper: run summarization on local LLM (Ollama)
//   Used when provider is phi4 / phi4-mini etc.
export async function runLocalSummary({ prompt }) {
    if (!prompt || !prompt.trim()) {
        throw new Error("[aiBootstrap] Empty prompt passed to runLocalSummary");
    }

    const PHI_SUMMARY_MODEL =
        process.env.PHI_SUMMARY_MODEL || process.env.PHI_MODEL || "phi4:14b";

    console.log(
        "[aiBootstrap] runLocalSummary -> local Ollama model:",
        PHI_SUMMARY_MODEL
    );

    const res = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: PHI_SUMMARY_MODEL,
            prompt,
            stream: false,
        }),
    });

    if (!res.ok) {
        const text = await res.text();
        console.warn(
            `[aiBootstrap] Ollama summary call failed (HTTP ${res.status}):`,
            text
        );
        throw new Error(`Local summarization failed (status ${res.status})`);
    }

    const data = await res.json();
    const summary = (data.response || "").trim();

    console.log(
        "[aiBootstrap] Local summary reply (truncated):",
        summary.slice(0, 120)
    );

    return summary;
}

//. Warm up local Ollama model so first request is fast
async function warmUpLocalModel() {
    const PHI_MODEL = process.env.PHI_MODEL || "phi4:14b";
    console.log(`Local mode detected — preparing Ollama model: ${PHI_MODEL}`);

    try {
        const warmupStart = performance.now();
        const res = await fetch("http://localhost:11434/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: PHI_MODEL,
                prompt: "Warm-up check — say 'ready'.",
                stream: false,
            }),
        });

        const warmupEnd = performance.now();
        const duration = (warmupEnd - warmupStart).toFixed(1);

        if (!res.ok) {
            const text = await res.text();
            console.warn(`⚠️ Ollama warm-up failed (HTTP ${res.status}):`, text);
        } else {
            const data = await res.json();
            console.log(
                `🦙 Ollama '${PHI_MODEL}' warmed and ready in ${duration} ms ->`,
                data.response?.slice(0, 60) || "ok"
            );
        }
    } catch (err) {
        console.warn("⚠️ Ollama warm-up request failed:", err.message);
    }
}
