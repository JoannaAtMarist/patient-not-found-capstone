/* ─────────────────────────────────────────────────────────────────────────────────────
 * File: auditController.js
 * Path: /server/controllers/auditController.js
 * Description: Handles retrieval and creation of audit log records for administrators.
 * ───────────────────────────────────────────────────────────────────────────────────── */

//~ Imports
import fs from "fs";
import path from "path";
import { AuditLogService } from "../utilities/AuditLogService.js";

const LOG_FILE = path.resolve("server/logs/audit.log");

// Exports 
//. GET /api/audit/logs  -> Admin view
export async function getAuditLogs(req, res) {
    try {
        if (!fs.existsSync(LOG_FILE)) {
            return res.json({ success: true, count: 0, logs: [] });
        }

        const logs = fs
            .readFileSync(LOG_FILE, "utf8")
            .trim()
            .split("\n")
            .reverse()
            .slice(0, 200)
            .map(line => JSON.parse(line));

        res.json({ success: true, count: logs.length, logs });
    } catch (err) {
        console.error("[PNF] ❌ Failed to read audit logs:", err.message);
        AuditLogService.record({
            type: "error",
            context: "AUDIT_CONTROLLER",
            message: `Failed to read audit log file: ${err.message}`,
            username: req.session?.user?.username || "system",
        });
        res.status(500).json({ success: false, error: "Unable to read audit log file." });
    }
}

//. POST /api/audit/log  -> manual / frontend sender
export async function logAudit(req, res) {
    try {
        const { type, message, context } = req.body;

        const entry = {
            type: type || "manual",
            message: message || "Manual audit entry",
            context: context || "manual",
            username: req.session?.user?.username || "system",
            ip: req.ip,
            userAgent: req.headers["user-agent"],
        };

        AuditLogService.record(entry);
        res.status(200).json({ success: true, message: "Audit entry recorded successfully." });
    } catch (err) {
        console.error("❌ logAudit failed:", err.message);
        AuditLogService.record({
            type: "error",
            context: "AUDIT_CONTROLLER",
            message: `Failed to record audit entry: ${err.message}`,
            username: req.session?.user?.username || "system",
        });
        res.status(500).json({ success: false, error: "Audit log insert failed" });
    }
}