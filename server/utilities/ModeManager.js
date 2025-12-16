/* ─────────────────────────────────────────────────────────────────────────────────────
 * File: ModeManager.js
 * Path: /server/utilities/ModeManager.js
 * Description: centralized Mode Manager
 * Three explicit modes:
 *   standard  – real site, login required, mongo ON
 *   dev       – developer mode, no login required, index.html root
 *   prototype – Render demo, same behavior as standard (for now)
 * Render is detected but does NOT override APP_MODE.
 * ───────────────────────────────────────────────────────────────────────────────────── */

//~ Imports
import { APP_MODE } from "../config/env.js";

// Exports 
export const isStandard = APP_MODE === "standard";
export const isDev = APP_MODE === "dev";
export const isPrototype = APP_MODE === "prototype";

// Detect Render automatically (Render sets environment variables)
export const isRender = !!process.env.RENDER;

// Optional protection: warn (but don’t override)
if (isRender && isDev) {
    console.warn("[PNF] ⚠ Warning: APP_MODE=dev detected on Render.");
}
