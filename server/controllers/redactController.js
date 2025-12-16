/* ─────────────────────────────────────────────────────────────────────────────────────
 * File: redactController.js
 * Path: /server/controllers/redactController.js
 * Description: Backend implementation of PHI redaction for Patient Not Found.
 * ───────────────────────────────────────────────────────────────────────────────────── */

import { PHILTER_ENABLED } from "../config/env.js";
import { philterRedact } from "../utilities/philterClient.js";
//~ Shared redaction logic
function performRedaction(note) {
    let red = note;

    // 1) Two-word "Firstname Lastname"
    red = red.replace(/\b([A-Z][a-z]+)\s+([A-Z][a-z]+)\b/g, "[REDACTED FULL NAME]");

    // 2) Honorific + Lastname (Dr. Smith)
    red = red.replace(/\b(Dr|Mr|Ms|Mrs)\.\s+[A-Z][a-z]+\b/g, "[REDACTED NAME]");

    // 3) Single capitalized words likely to be names when preceded by cues
    red = red.replace(/\b(?:Patient|with|by|saw|consulted|eval(?:uated)?)\s+([A-Z][a-z]+)\b/g,
        (m, g1) => m.replace(g1, "[REDACTED NAME]")
    );

    // 4) Dates
    red = red.replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, "[REDACTED DATE]");
    red = red.replace(/\b\d{4}-\d{2}-\d{2}\b/g, "[REDACTED DATE]");

    // 5) Phone numbers
    red = red.replace(/\b(?:\+?1[-.\s])?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/g, "[REDACTED PHONE]");

    // 6) SSN / IDs
    red = red.replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[REDACTED SSN]");
    red = red.replace(/\b[A-Z0-9]{2,3}\/[A-Z0-9]{2,3}\b/g, "[REDACTED ID]");

    // 7) Emails
    red = red.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[REDACTED EMAIL]");

    // 8) Addresses
    red = red.replace(/\b\d{1,5}\s+[A-Za-z0-9.\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln)\b/gi, "[REDACTED ADDRESS]");

    return red;
}

//~ Express route handler (used by /api/redact)
export async function redactNote(req, res) {
    try {
        const { note } = req.body;
        if (!note || typeof note !== "string") {
            return res.status(400).json({ error: "Invalid or missing note text." });
        }

        const red = performRedaction(note);
        return res.json({ redacted: red });
    } catch (error) {
        console.error("Redaction error:", error);
        res.status(500).json({ error: "Internal redaction failure." });
    }
}

//~ Internal helper (used by PipelineManager)
//. Internal helper for pipeline use (no Express req/res)
export async function redactPipeline(body) {
    const note = typeof body === "string" ? body : body?.note;
    if (!note || typeof note !== "string") {
        throw new Error("Invalid or missing note text.");
    }

    let red;
    //this should make philter be the preffered stuff
    if (PHILTER_ENABLED) {
        console.log("[PNF] redactPipeline -> using Philter");
        try {
            red = await philterRedact(note);
        } catch (err) {
            console.warn("[PNF] Philter failed, falling back to local regex:", err.message);
            red = performRedaction(note);
        }
    } else {
        console.log("[PNF] redactPipeline -> Philter disabled, using local regex");
        red = performRedaction(note);
    }

    return { redacted_text: red };
}