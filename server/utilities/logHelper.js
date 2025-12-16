/* ────────────────────────────────────────────────────────────────────────────────
 * File: logHelper.js
 * Path: /server/utilities/logHelper.js
 * Purpose: Shared console logging utilities for timing and AI-mode diagnostics.
 * ──────────────────────────────────────────────────────────────────────────────── */

// TODO: Ensure safeAudit records usernames when available
//~ Imports
import { AuditLogService } from "./AuditLogService.js";


/**
 * Helper to safely write to the audit log without breaking the route if it fails.
 */
async function safeAudit(entry) {
    try {
        await AuditLogService.record(entry);
    } catch (err) {
        console.warn("[logHelper] ⚠️ Failed to write to audit log:", err.message);
    }
}

function enrich(entry, req) {
    const u = req?.user || req?.session?.user || null;
    return {
        ...entry,
        userId: u?._id || null,
        username: u?.username || (u?.name ?? "guest"),
        method: req?.method,
        path: req?.originalUrl,
        ip: req?.ip,
        userAgent: req?.get?.("User-Agent"),
    };
}

// Exports 
// AI Logging Helpers

export function logAIStart(req, route, noteLen = 0, aiMode = "openai") {
    console.log(`[${route}] AI_MODE=${aiMode} | Input length=${noteLen} chars`);
    safeAudit(enrich({
        type: "ai_start",
        context: route,
        message: `AI request started (${aiMode}) | len=${noteLen}`,
    }, req));
}

export function logAITiming(req, label, start, end) {
    const seconds = ((end - start) / 1000).toFixed(2);
    console.log(`⏱ [${label}] completed in ${seconds}s`);
    safeAudit(enrich({
        type: "ai_timing",
        context: label,
        message: `Completed in ${seconds}s`,
    }, req));
}

export function logAISuccess(req, label, result) {
    const summaryLen = (result && typeof result.summary === "string") ? result.summary.length : 0;
    console.log(`[${label}] ✅ summary generated (length: ${summaryLen} chars)`);
    safeAudit(enrich({
        type: "ai_success",
        context: label,
        message: `Summary generated (length=${summaryLen})`,
    }, req));
}

export function logAIFailure(req, label, err) {
    const msg = `❌ [${label}] failed: ${err.message || err}`;
    console.error(msg);
    safeAudit(enrich({
        type: "ai_failure",
        context: label,
        message: `Error: ${err.message || err}`,
    }, req));
}