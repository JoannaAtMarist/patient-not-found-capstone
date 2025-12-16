/* ─────────────────────────────────────────────────────────────────────────────────────
 * File: PromptBuilder.js
 * Path: /server/prompts/PromptBuilder.js
 * Description:
 * Centralized factory to build prompts dynamically for different AI providers and tasks.
 * Supports: OpenAI, Phi-4, Phi-4-mini, Redact, Redact+Summarize.
 * 
 * Phase 1 Goal:
 *   - Return the correct base prompt string based on provider & mode
 *   - Append note text safely
 *   - Keep verbose console logs for audit/debugging
 * 
 * Future Phases:
 *   - Add pipeline stages (redact -> summarize -> reintegrate PHI)
 *   - Add context-aware prompt adjustments (e.g., JSON vs plaintext)
 *   - Include audit trail metadata for logging
 * ───────────────────────────────────────────────────────────────────────────────────── */

import { getSummaryMode } from "../config/env.js";
import { summarizePrompt } from "../prompts/summarizePrompt.js";
import { summarizePromptEnhanced } from "../prompts/summarizePromptEnhanced.js";
import { redactPrompt } from "../prompts/redactPrompt.js";
import { phi4SummarizePrompt } from "../prompts/phi4SummarizePrompt.js";
import { phi4RedactSummarizePrompt } from "../prompts/phi4RedactSummarizePrompt.js";
import { noteCheckPrompt } from "../prompts/noteCheckPrompt.js";
import { rickrollCheckPrompt } from "../prompts/rickrollCheckPrompt.js";

const summary_mode = getSummaryMode();

// Exports 

//~ Normal Summary Prompt
export function buildPrompt({ mode = "summarize", provider = "openai", noteText = "" }) {
    console.log(`[PNF] PromptBuilder called`);
    console.log("[PNF] Mode:", mode);
    console.log("[PNF] Provider:", provider);
    console.log("[PNF] Note length:", noteText?.length ?? 0);

    let promptBase = "";

    try {
        // MODE: Summarize only
        if (mode === "summarize") {
            if (provider === "openai") {
                promptBase = summary_mode === "advanced"
                    ? summarizePromptEnhanced
                    : summarizePrompt;
            } else if (provider === "phi4" || provider === "phi4-mini") {
                // Non-advanced
                promptBase = phi4SummarizePrompt;
            } else {
                throw new Error(`Unknown provider '${provider}' for summarize`);
            }
        }

        // ERROR CHECK
        else if (mode === "check-note-type") {
            promptBase = noteCheckPrompt;
        }

        // ERROR CHECK: Rickroll
        else if (mode === "check-rickroll") {
            promptBase = rickrollCheckPrompt;
        }

        // MODE: Redact only
        else if (mode === "redact") {
            promptBase = redactPrompt;
        }

        // MODE: Redact + Summarize combined
        else if (mode === "redact+summarize") {
            if (provider === "phi4" || provider === "phi4-mini") {
                promptBase = phi4RedactSummarizePrompt;
            } else {
                throw new Error(`'${provider}' does not support combined redact+summarize`);
            }
        }

        else {
            throw new Error(`Unsupported mode '${mode}'`);
        }

        const fullPrompt = `${promptBase}${noteText}`;
        if (process.env.DEBUG_NOTES === "true") {
            console.log("[PNF] PromptBuilder preview:", fullPrompt.slice(0, 300));
        }

        return fullPrompt;

    } catch (err) {
        console.error("[PNF] ❌ PromptBuilder failed:", err.message);
        throw err;
    }
}
