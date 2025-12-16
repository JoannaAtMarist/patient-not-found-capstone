/* ─────────────────────────────────────────────────────────────────────────────────────
 * File: auditLogger.js
 * Path: /server/middleware/auditLogger.js
 * Description: Express middleware that records high-level API access info.
 *              Delegates all writing to AuditLogService.
 * 
 * 
 * How auditLogger & AuditLogService work together: 
 * 1. auditLogger middleware 
 *    -> runs first when an API request comes in, logs the request details (user, route, method). 
 * 2. Controllers or pipeline do their work. 
 * 3. errorHandler catches any thrown errors and uses 
 *    -> AuditLogService.record() to log an error event. 
 * 
 * Both end up writing to audit.log, but at different phases: 
 * - middleware = “request started” 
 * - service = “error or success outcome”
 * ───────────────────────────────────────────────────────────────────────────────────── */

//~ Imports
import { AuditLogService } from "../utilities/AuditLogService.js";

// Exports 
export function auditLogger(req, res, next) {
    res.on("finish", () => {
        // Only log API calls (skip static assets, etc.)
        if (!req.originalUrl.startsWith("/api")) return;
        if (req.originalUrl.startsWith("/api-docs")) return;
        
        const entry = {
            type: res.statusCode >= 400 ? "error" : "request",
            userId: req.session?.user?._id || null,
            username: req.session?.user?.username || "guest",
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            ip: req.ip,
            userAgent: req.get("User-Agent"),
            message: res.statusCode >= 400 ? "Error or failed request" : "OK",
        };

        AuditLogService.record(entry);
    });

    next();
}