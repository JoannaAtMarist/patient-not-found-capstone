// server/utilities/philterClient.js
import { PHILTER_URL, PHILTER_ENABLED } from "../config/env.js";

export async function philterRedact(text, options = {}) {
    // Safety: if Philter is not enabled, just return the input.
    if (!PHILTER_ENABLED) {
        return text;
    }

    try {
        const res = await fetch(`${PHILTER_URL}/api/filter`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                document: text,
                filterProfile: options.profile || "default",
            }),
        });

        if (!res.ok) {
            throw new Error(`[Philter] Non-OK response: ${res.status}`);
        }

        const data = await res.json();

        if (!data || typeof data.document !== "string") {
            throw new Error("[Philter] Missing 'document' field in response");
        }

        return data.document;
    } catch (err) {
        console.error("[Philter] Error calling Philter:", err);
        // IMPORTANT: throw, so redactPipeline() can fall back.
        throw err;
    }
}
