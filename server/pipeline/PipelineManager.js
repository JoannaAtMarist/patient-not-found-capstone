/* ─────────────────────────────────────────────────────────────────────────────────────
 * File: PipelineManager.js
 * Path: /server/pipeline/PipelineManager.js
 * Description:
 * Coordinates the multi-stage AI processing pipeline for redaction and summarization.
 * Currently routes to redaction and summarization controllers for the selected provider,
 * capturing timing and per-stage results for downstream use.
 * 
 * TODO: Turn "Gold" points into optional tags.
 * ───────────────────────────────────────────────────────────────────────────────────── */

//~ Imports
// Centralized AI config helper
import { getAIClient, runNoteTypeCheck, runLocalSummary } from "../config/aiBootstrap.js";
// Shared OpenAI instance if in cloud mode
const client = getAIClient();
// Error Handling
import { ERROR_CODES } from "../errors/errorCodes.js";
import { throwError } from "../utilities/throwError.js";
// Prompt-building & Controllers
import { buildPrompt } from "./PromptBuilder.js";
import { summarizeWithOpenAiCloud } from "../controllers/summaryController.js";
import { redactPipeline } from "../controllers/redactController.js";

// Exports 
export class PipelineManager {
    constructor({ provider = "openai" } = {}) {
        this.provider = provider;
        this.results = {};
        this.stageLog = [];
    }

    /**
     * Generic stage executor that records timing and captures stage success or failure.
     * @param {string} name - Identifier for the stage being executed.
     * @param {Function} handler - Async function that performs the stage work.
     * @param {*} input - Input forwarded to the stage handler.
     * @returns {Promise<*>} Result from the stage handler.
     * @throws Propagates errors from the handler after logging.
     */
    async runStage(name, handler, input) {
        console.log("──────────────────────────────────────────────");
        console.log(`[PNF] Running pipeline stage: ${name}`);
        const start = performance.now();
        try {
            const result = await handler(input);
            const elapsed = (performance.now() - start).toFixed(2);
            console.log(`[PNF] ✅ Stage '${name}' completed in ${elapsed} ms`);
            this.stageLog.push({ stage: name, elapsed, success: true });
            return result;
        } catch (err) {
            console.error(`[PNF] ❌ Stage '${name}' failed:`, err.message);
            this.stageLog.push({ stage: name, success: false, error: err.message });
            throw err; // Will be caught by global errorHandler middleware
        }
    }

    /**
     * Stage 0.5: Validate that the note is not a known spam/rickroll payload.
     * @param {string} noteText - Raw note content to classify.
     * @returns {Promise<boolean>} True when validation passes.
     * @throws Throws ERR_RICKROLL_DETECTED or validation failure errors.
     */
    async validateNotRickroll(noteText) {
        console.log("[PNF] Stage 0.5: validateNotRickroll() starting");

        if (!noteText || noteText.trim() === "") {
            return true; // nothing to classify
        }

        const prompt = buildPrompt({
            mode: "check-rickroll",
            provider: this.provider,
            noteText,
        });

        try {
            const reply = await runNoteTypeCheck({
                provider: this.provider,
                prompt
            });

            console.log("[PNF] Rickroll classifier reply:", reply);

            if (String(reply).trim().toUpperCase().startsWith("YES")) {
                throwError(ERROR_CODES.ERR_RICKROLL_DETECTED, "Are you trying to rickroll me...?");
            }

            return true;

        } catch (err) {
            console.error("[PNF] ❌ Rickroll validation failed:", err.message);

            // Pass through expected custom errors unchanged
            if (err.code === ERROR_CODES.ERR_RICKROLL_DETECTED) throw err;

            // If the classifier itself failed, treat as validation failure (or choose fail-open)
            throwError(ERROR_CODES.ERR_NOTE_VALIDATION_FAILED, "Rickroll validation step failed");
        }
    }

    /**
     * Stage 0: Validate that the text looks like a doctor note.
     * @param {string} noteText - Raw note content to validate.
     * @returns {Promise<boolean>} True when validation passes.
     * @throws Throws ERR_NOT_DOCTOR_NOTE, ERR_NO_NOTE_TEXT, or validation errors.
     */
    async validateNoteType(noteText) {
        console.log("[PNF] Stage 0: validateNoteType() starting");

        if (!noteText || noteText.trim() === "") {
            throwError(ERROR_CODES.ERR_NO_NOTE_TEXT, "No note text provided");
        }

        // Build prompt
        const prompt = buildPrompt({
            mode: "check-note-type",
            provider: this.provider,
            noteText,
        });

        try {
            const reply = await runNoteTypeCheck({
                provider: this.provider,
                prompt
            });

            console.log("[PNF] Note type classifier reply:", reply);

            if (reply.startsWith("NO")) {
                throwError(ERROR_CODES.ERR_NOT_DOCTOR_NOTE, "Input does not appear to be a doctor note");
            }

            return true;
        } catch (err) {
            console.error("[PNF] ❌ Note type validation failed:", err.message);

            // Pass through expected custom errors unchanged
            if (err.code === ERROR_CODES.ERR_NOT_DOCTOR_NOTE || err.code === ERROR_CODES.ERR_NO_NOTE_TEXT) throw err;

            // Wrap unexpected failures in a known AI validation code
            throwError(ERROR_CODES.ERR_NOTE_VALIDATION_FAILED, "Note validation step failed");
        }
    }

    /**
     * Stage 1: Redact protected information using the configured provider.
     * @param {string} noteText - Raw note content to redact.
     * @returns {Promise<string>} Redacted text.
     * @throws Throws redaction failures for unsupported providers or missing output.
     */
    async redact(noteText) {
        console.log("[PNF] Stage 1: redact() starting");
        console.log("[PNF] Provider:", this.provider);

        if (!noteText || noteText.trim() === "") {
            console.warn("[PNF] ⚠️ No note text received in redact()");
            this.results.redacted = "";
            return "";
        }

        try {
            // TODO: allow local redactors (e.g. Phi-4) via provider check
            if (this.provider === "openai" || this.provider === "phi4" || this.provider === "phi4-mini") {
                console.log("[PNF] Calling redactPipeline() controller...");
                const result = await redactPipeline({ note: noteText });

                if (!result || !result.redacted_text) {
                    throwError(ERROR_CODES.ERR_REDACT_FAILED, "Redaction result missing expected field");
                }
                if (process.env.DEBUG_NOTES === "true") {
                    const redactedLen =
                        typeof result.redacted_text === "string"
                            ? result.redacted_text.length
                            : 0;
                    console.log("[PNF] ✅ Redaction complete (length:", redactedLen, "chars)");
                }

                this.results.redacted = result.redacted_text;
                return result.redacted_text;
            }

            throwError(ERROR_CODES.ERR_REDACT_FAILED, `Unsupported provider '${this.provider}'`);

        } catch (err) {
            console.error("[PNF] ❌ Redaction failed:", err.message);
            this.results.redacted = "[ERROR] redaction failed";
            throw err;
        }
    }

    /**
     * Stage 2: Summarize the note text using the configured provider.
     * @param {string} noteText - Text to summarize (usually redacted output).
     * @returns {Promise<string>} Summary content.
     * @throws Throws ERR_SUMMARY_FAILED on provider or parsing issues.
     */
    async summarize(noteText) {
        console.log("[PNF] Stage 2: summarize() starting");
        console.log("[PNF] Provider:", this.provider);

        if (!noteText || noteText.trim() === "") {
            console.warn("[PNF] ⚠️ No note text received in summarize()");
            this.results.summary = "";
            return "";
        }

        try {
            if (this.provider === "openai") {
                console.log("[PNF] Using OpenAI summarizer (gpt-4o-mini)");
                //const result = await summarizeWithOpenAiCloud({ note: noteText });

                // Use Prompt Builder
                const prompt = buildPrompt({
                    mode: "summarize",
                    provider: this.provider,
                    noteText
                });

                const result = await summarizeWithOpenAiCloud({
                    note: noteText,
                    promptOverride: prompt
                });

                if (!result || !result.summary) {
                    throwError(ERROR_CODES.ERR_SUMMARY_FAILED, "No summary returned from summarizer");
                }
                if (process.env.DEBUG_NOTES === "true") {
                    const summaryLen =
                        typeof result.summary === "string"
                            ? result.summary.length
                            : 0;
                    console.log(
                        "[PNF] ✅ Received AI summary from OpenAI (length:",
                        summaryLen,
                        "chars)"
                    );
                }

                this.results.summary = result.summary;
                this.results.allergies = result.allergies;
                this.results.highlights = result.highlights || [];
                this.results.confidence_flags = result.confidence_flags || [];

                return result.summary;
            }

            // Local provider: phi4 / phi4-mini
            else if (this.provider === "phi4" || this.provider === "phi4-mini") {
                console.log("[PNF] Using local LLM summarizer (phi4)");

                // Reuse same PromptBuilder, but provider will be phi4
                const prompt = buildPrompt({
                    mode: "summarize",
                    provider: this.provider,
                    noteText
                });

                const raw = await runLocalSummary({ prompt });

                if (!raw || !raw.trim()) {
                    throwError(
                        ERROR_CODES.ERR_SUMMARY_FAILED,
                        "Local summarizer returned empty summary"
                    );
                }

                // Try to parse sections like:
                // Summary: ...
                // Allergies: ...
                // Doctor Note: ...
                const summaryMatch = raw.match(
                    /Summary:\s*([\s\S]*?)(?:\n{2,}Allergies:|\nAllergies:|$)/i
                );
                const allergiesMatch = raw.match(/Allergies:\s*([^\n]*)/i);

                const cleanSummary = summaryMatch
                    ? summaryMatch[1].trim()
                    : raw.trim(); // fallback: whole text
                const allergies = allergiesMatch
                    ? allergiesMatch[1].trim()
                    : "";

                this.results.summary = cleanSummary;
                this.results.allergies = allergies || "";
                this.results.highlights = [];
                this.results.confidence_flags = [];

                if (process.env.DEBUG_NOTES === "true") {
                    console.log(
                        "[PNF] ✅ Parsed local summary (length:",
                        cleanSummary.length,
                        "chars) | Allergies:",
                        this.results.allergies || "(none)"
                    );
                }

                return cleanSummary;
            }

            throwError(
                ERROR_CODES.ERR_SUMMARY_FAILED,
                `Unsupported provider '${this.provider}'`
            );

        } catch (err) {
            console.error("[PNF] ❌ Summarization failed:", err.message);
            this.results.summary = "[ERROR] summarization failed";
            throw err;
        }
    }

    /**
     * Stage 3: Reintegration of summary with any previously redacted context.
     * @param {string} summary - Summary to merge back with redacted text.
     * @returns {Promise<string>} Final merged output.
     * @throws Throws ERR_REINTEGRATE_FAILED when merge processing fails.
     */
    async reintegrate(summary) {
        console.log("[PNF] Stage 3: reintegrate() starting");

        try {
            const redactedText = this.results.redacted || "";
            const summaryText = summary || "";

            if (!summaryText.trim()) {
                console.warn("[PNF] ⚠️ No summary text received in reintegrate()");
                this.results.final = redactedText;
                return redactedText;
            }

            // Clean up possible redundant placeholder artifacts
            const cleanedSummary = summaryText.replace(/\[REDACTED SAMPLE\]/g, "[REDACTED]");

            // Compose final merged output
            /*
            const mergedOutput = [
                "=== REDACTED TEXT ===",
                redactedText.trim(),
                "",
                "=== SUMMARY ===",
                cleanedSummary.trim(),
                "",
                "=== END OF REPORT ===",
            ].join("\n");
            */

            // JUST SUMMARY
            const mergedOutput = [
                cleanedSummary.trim()
            ].join("\n");

            this.results.final = mergedOutput;
            console.log("[PNF] ✅ Reintegration complete — merged output length:", mergedOutput.length);
            return mergedOutput;
        } catch (err) {
            console.error("[PNF] ❌ Reintegration failed:", err.message);
            this.results.final = "[ERROR] reintegration failed";
            throwError(ERROR_CODES.ERR_REINTEGRATE_FAILED, err.message);
        }
    }

    /**
     * Execute the full pipeline (validation -> redaction -> summarization -> reintegration).
     * @param {string} noteText - Raw note text to process end-to-end.
     * @returns {Promise<object>} Aggregated results including redacted, summary, and final text.
     */
    async execute(noteText) {
        console.log("──────────────────────────────────────────────");
        console.log(`[PNF] Pipeline starting with provider: ${this.provider}`);
        await this.runStage("validateNotRickroll", this.validateNotRickroll.bind(this), noteText);
        await this.runStage("validateNoteType", this.validateNoteType.bind(this), noteText);
        const redacted = await this.runStage("redact", this.redact.bind(this), noteText);
        const summary = await this.runStage("summarize", this.summarize.bind(this), redacted);
        const final = await this.runStage(
            "reintegrate",
            this.reintegrate.bind(this),
            summary
        );

        const redactedLen = (this.results.redacted || "").length;
        const summaryLen = (this.results.summary || "").length;

        console.log("[PNF] ✅ Pipeline complete.", {
            stages: this.stageLog,
            redactedLength: redactedLen,
            summaryLength: summaryLen,
        });

        return this.results;
    }

    /**
     * Execute the full pipeline for multiple notes in parallel.
     * @param {Array<object|string>} noteList - Array of notes or note descriptors.
     * @returns {Promise<Array<object>>} Array of per-note pipeline results.
     */
    async executeMany(noteList = []) {
        console.log("──────────────────────────────────────────────");
        console.log(`[PNF] Multi-file pipeline starting with ${noteList.length} notes`);

        if (!Array.isArray(noteList) || noteList.length === 0) {
            throw new Error("No notes provided for multi-file pipeline");
        }

        const provider = this.provider;

        // Process sequentially to avoid race-condition order confusion
        /*
        for (let i = 0; i < noteList.length; i++) {
            const noteText = noteList[i];
            console.log(`\n[PNF] ▶ Processing file ${i + 1}/${noteList.length} …`);

            try {
                const singlePipeline = new PipelineManager({ provider: this.provider });
                const result = await singlePipeline.execute(noteText);

                allResults.push({
                    index: i,
                    redacted: result.redacted || "",
                    summary: result.summary || "",
                    allergies: result.allergies || "",
                    final: result.final || "",
                });

            } catch (err) {
                console.error(`[PNF] ❌ Error processing file ${i + 1}:`, err.message);

                allResults.push({
                    index: i,
                    error: err.message,
                    redacted: "",
                    summary: "",
                    final: "[ERROR] Pipeline failed for this note."
                });
            }
        }
        */
        // Each item in noteList should be: { id, name, text }
        const jobs = noteList.map((item, index) => {
            const noteText = item.text || item; // fallback if old format
            const id = item.id ?? index;
            const name = item.name ?? `Note ${index + 1}`;

            const pm = new PipelineManager({ provider });

            return pm.execute(noteText)
                .then(result => ({
                    ok: true,
                    id,
                    name,
                    index,
                    redacted: result.redacted,
                    summary: result.summary,
                    allergies: result.allergies,
                    final: result.final
                }))
                .catch(err => ({
                    ok: false,
                    id,
                    name,
                    index,
                    error: err.message,
                    redacted: "",
                    summary: "",
                    final: "[ERROR] Pipeline failed for this note."
                }));
        });

        // Run all pipelines in parallel
        const results = await Promise.all(jobs);

        console.log("──────────────────────────────────────────────");
        console.log("[PNF] Multi-file pipeline complete");

        // return {
        //     summary: parsed.summary || "",
        //     allergies: parsed.allergies || "",
        //     highlights: parsed.highlights || [],
        //     confidence_flags: parsed.confidence_flags || []
        // };

        return results;
    }
}
