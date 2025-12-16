/* ─────────────────────────────────────────────────────────────────────────────────────
 * File: redactionFallback.js
 * Path: /server/utilities/redactionFallback.js
 * Description: The eventual last resort for redaction.
 * ───────────────────────────────────────────────────────────────────────────────────── */

// Exports 
export function localRedact(note) {
    if (!note) return "";

    let red = note;

    // 1) Two-word "Firstname Lastname"
    red = red.replace(/\b([A-Z][a-z]+)\s+([A-Z][a-z]+)\b/g, "[REDACTED FULL NAME]");

    // 2) Honorific + Lastname (Dr. Smith)
    red = red.replace(/\b(Dr|Mr|Ms|Mrs)\.\s+[A-Z][a-z]+\b/g, "[REDACTED NAME]");

    // 3) Single capitalized words likely to be names when surrounded by name cues
    // (e.g., "Patient John presented ..." or "with John today")
    red = red.replace(/\b(?:Patient|with|by|saw|consulted|eval(?:uated)?)\s+([A-Z][a-z]+)\b/g, (m, g1) =>
        m.replace(g1, "[REDACTED NAME]")
    );

    // 4) Dates  (MM/DD/YYYY, MM/DD/YY, YYYY-MM-DD)
    red = red.replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, "[REDACTED DATE]");
    red = red.replace(/\b\d{4}-\d{2}-\d{2}\b/g, "[REDACTED DATE]");

    // 5) Phone numbers
    red = red.replace(/\b(?:\+?1[-.\s])?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/g, "[REDACTED PHONE]");

    // 6) SSN / simple IDs
    red = red.replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[REDACTED SSN]");
    red = red.replace(/\b[A-Z0-9]{2,3}\/[A-Z0-9]{2,3}\b/g, "[REDACTED ID]");

    // 7) Emails
    red = red.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[REDACTED EMAIL]");

    // 8) Addresses (very rough demo heuristic)
    red = red.replace(/\b\d{1,5}\s+[A-Za-z0-9.\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln)\b/gi, "[REDACTED ADDRESS]");

    return red;
}
