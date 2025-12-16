/* ─────────────────────────────────────────────────────────────────────────────────────
 * File: AuditLogService.js
 * Path: /server/utilities/AuditLogService.js
 * Description: Unified audit logging service that writes to both file and MongoDB (optional).
 *              File logging is always enabled; DB logging toggled via AUDIT_DB_MODE=true in .env.
 * ───────────────────────────────────────────────────────────────────────────────────── */

//~ Imports
import fs from "fs";
import path from "path";
import AuditLog from "../models/AuditLog.js";

const LOG_FILE = path.resolve("server/logs/audit.log");
// Ensure logs directory exists for all environments
fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });

const DB_MODE = process.env.AUDIT_DB_MODE === "true"; // toggle in .env

const IS_RENDER = process.env.RENDER === "true";

// Define what types or paths should go to Atlas
const DB_WHITELIST = [
    "login",
    "logout",
    "admin",
    "ai",            // for summarize/redact
    "security",
    "password-reset"
];

// Exports 
export const AuditLogService = {
    async record(entry) {
        if (entry.type == "ai_success")
        {
            entry.message = "[CENSORED OUTPUT]";
        }
        const logData = {
            ...entry,
            timestamp: entry.timestamp || new Date().toISOString(),
        };

        //. Write to file (always)
        try {
            const line = JSON.stringify(logData);
            console.log("[AUDIT]", line);
            fs.appendFileSync(LOG_FILE, line + "\n", "utf8");
            //AI PATCH
            /*
            if (!IS_RENDER) {
                fs.appendFileSync(LOG_FILE, line + "\n", "utf8");
            } else {
                console.log("[AUDIT][Render] (file logging disabled)");
            }
            */
        } catch (err) {
            console.warn("[AuditLogService] ⚠️ File write failed:", err.message);
        }

        //. Only write to MongoDB if it matches whitelist
        if (DB_MODE && shouldSaveToAtlas(logData)) {
            try {
                await AuditLog.create({
                    type: logData.type,
                    code: logData.code,
                    context: logData.context,
                    message: logData.message,
                    username: logData.username,
                    userId: logData.userId,
                    method: logData.method,
                    path: logData.path,
                    ip: logData.ip,
                    userAgent: logData.userAgent,
                    statusCode: logData.statusCode,
                    timestamp: logData.timestamp,
                });
            } catch (dbErr) {
                console.warn("[AuditLogService] ⚠️ DB write failed:", dbErr.message);
            }
        }
    },
};

//. Helper function: defines Atlas filter logic
function shouldSaveToAtlas(log) {
    if (!log) return false;

    // If explicitly marked as important
    if (log.important === true) return true;

    // Match context, type, or path keywords
    const text = `${log.type || ""} ${log.context || ""} ${log.path || ""}`.toLowerCase();
    return DB_WHITELIST.some(keyword => text.includes(keyword));
}