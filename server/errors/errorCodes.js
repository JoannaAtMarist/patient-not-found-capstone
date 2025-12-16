/* ─────────────────────────────────────────────────────────────────────────────────────
 * File: errorCodes.js
 * Path: /server/errors/errorCodes.js
 * Description: Centralized enumeration of backend error codes used across controllers.
 * ───────────────────────────────────────────────────────────────────────────────────── */

export const ERROR_CODES = {
    //~ Account & Auth
    ERR_INVALID_CREDENTIALS: "ERR_INVALID_CREDENTIALS",
    ERR_ACCOUNT_LOCKED: "ERR_ACCOUNT_LOCKED",
    ERR_UNAUTHORIZED: "ERR_UNAUTHORIZED",
    ERR_NO_SESSION: "ERR_NO_SESSION",

    //~ AI & Pipeline
    ERR_NOT_DOCTOR_NOTE: "ERR_NOT_DOCTOR_NOTE",
    ERR_NO_NOTE_TEXT: "ERR_NO_NOTE_TEXT",
    ERR_NOTE_VALIDATION_FAILED: "ERR_NOTE_VALIDATION_FAILED",
    ERR_REDACT_FAILED: "ERR_REDACT_FAILED",
    ERR_SUMMARY_FAILED: "ERR_SUMMARY_FAILED",
    ERR_REINTEGRATE_FAILED: "ERR_REINTEGRATE_FAILED",
    ERR_RICKROLL_DETECTED: "ERR_RICKROLL_DETECTED",

    //~ General
    ERR_INTERNAL_SERVER: "ERR_INTERNAL_SERVER",
};
