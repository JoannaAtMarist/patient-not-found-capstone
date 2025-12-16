/* ─────────────────────────────────────────────────────────────────────────────────────
 * File: auditRoutes.js
 * Path: /server/routes/auditRoutes.js
 * Description: Secure admin routes for viewing or adding audit log entries.
 *              Uses AuditLogService for consistent storage and format.
 * ───────────────────────────────────────────────────────────────────────────────────── */

//~ Imports
import express from "express";
import fs from "fs";
import path from "path";
import { getAuditLogs, logAudit } from "../controllers/auditController.js";
import { AuditLogService } from "../utilities/AuditLogService.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = express.Router();
const LOG_FILE = path.resolve("server/logs/audit.log");

//~ Audit logs (admin only)
//. GET /api/audit/logs  ->  Fetch recent logs (Admin only)
router.get("/logs", requireAdmin, (req, res) => {
    try {
        if (!fs.existsSync(LOG_FILE)) {
            return res.json({ success: true, count: 0, logs: [] });
        }

        const logs = fs
            .readFileSync(LOG_FILE, "utf8")
            .trim()
            .split("\n")
            .reverse()
            .slice(0, 200) // most recent 200 entries
            .map(line => JSON.parse(line));

        res.json({ success: true, count: logs.length, logs });
    } catch (err) {
        console.error("[PNF] ❌ Failed to load audit logs:", err.message);
        res.status(500).json({ success: false, error: "Failed to read audit log file." });
    }
});

//. POST /api/audit/log  ->  Manually add a log entry
// Useful for non-automatic events or testing
router.post("/log", (req, res) => {
    try {
        const entry = {
            type: req.body.type || "manual",
            username: req.session?.user?.username || "system",
            message: req.body.message || "Manual audit entry",
            context: req.body.context || "manual",
            ip: req.ip,
        };

        AuditLogService.record(entry);
        res.json({ success: true, message: "Audit entry recorded." });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Exports 
export default router;
