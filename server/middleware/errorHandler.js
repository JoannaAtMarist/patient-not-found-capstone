/* ─────────────────────────────────────────────────────────────────────────────────────
 * File: errorHandler.js
 * Path: /server/middleware/errorHandler.js
 * Description: Global Express error handler — catches all thrown/rejected errors.
 *              Logs details to console and audit log.
 * ───────────────────────────────────────────────────────────────────────────────────── */

//~ Imports
import { ERROR_CODES } from "../errors/errorCodes.js";
import { AuditLogService } from "../utilities/AuditLogService.js";

// Exports 
export function errorHandler(err, req, res, next) {
    console.error(`❌ [${req.method}] ${req.originalUrl}`, err);

    //. Handle specific Mongoose errors
    if (err.name === "CastError" && err.kind === "ObjectId") {
        return res.status(400).json({
            success: false,
            error: "Invalid ID format",
            code: "ERR_INVALID_ID",
            path: req.originalUrl,
            timestamp: new Date().toISOString(),
        });
    }

    //. Map known AI or account codes to specific statuses
    const code = err.code || ERROR_CODES.ERR_INTERNAL_SERVER;
    let status = err.status || 500;

    if (code === ERROR_CODES.ERR_NOT_DOCTOR_NOTE) status = 422;
    if (code === ERROR_CODES.ERR_NO_NOTE_TEXT) status = 400;
    if (code === ERROR_CODES.ERR_UNAUTHORIZED) status = 401;

    const message = err.message || "Internal server error";

    //. Tie into the audit log system
    try {
        AuditLogService.record({
            type: "error",
            code,
            message,
            path: req.originalUrl,
            user: req.session?.user?.username || "system",
            method: req.method,
            timestamp: new Date().toISOString(),
            ip: req.ip,
        });
    } catch (auditErr) {
        console.warn("[PNF] ⚠️ Audit logging failed:", auditErr.message);
    }

    //. Return structured error response
    res.status(status).json({
        success: false,
        error: message,
        code,
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
    });
}