import { ERROR_CODES } from "../errors/errorCodes.js";

/**
 * Simplifies throwing custom backend errors.
 * Example:
 *   throwError(ERROR_CODES.ERR_NOT_DOCTOR_NOTE, "Input not a doctor note");
 */
export function throwError(code, message, status = null) {
    const err = new Error(message);
    err.code = code;
    if (status) err.status = status;
    throw err;
}
