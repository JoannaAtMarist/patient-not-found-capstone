/* ─────────────────────────────────────────────────────────────────────────────────────
 * File: AuditLog.js
 * Path: /server/models/AuditLog.js
 * Description: Stores audit trail events for API access, errors, and user activity.
 * ───────────────────────────────────────────────────────────────────────────────────── */

//~ Imports
import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
    type: { type: String, default: "info" },
    code: { type: String },
    context: { type: String },
    message: { type: String, required: true },
    username: { type: String, default: "system" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", default: null },
    method: { type: String },
    path: { type: String },
    ip: { type: String },
    userAgent: { type: String },
    statusCode: { type: Number },
    timestamp: { type: Date, default: Date.now },
}, { collection: "AuditLog" });

export default mongoose.model("AuditLog", auditLogSchema);
