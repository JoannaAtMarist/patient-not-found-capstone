/* ─────────────────────────────────────────────────────────────────────────────────────
 * File: env.js
 * Path: /server/config/env.js
 * Description: Centralized environment configuration for the backend.
 *
 * App Modes:
 *   standard  – real site, login required, Mongo ON, sessions ON
 *   dev       – developer mode, index.html root, login local-only, Mongo ON, sessions ON
 *   prototype – Render demo, Mongo OFF, NO sessions, NO login, direct access to summary
 * ───────────────────────────────────────────────────────────────────────────────────── */

//~ Imports
//. Loads environment variables from .env (API keys, DB URLs, etc.)
import dotenv from "dotenv";
dotenv.config();

let app_mode = null;
let summary_mode = null;

console.log("[env] module loaded");

// Exports 
export const AI_MODE = process.env.AI_MODE || "openai";

// One unified mode controller:
//   standard  -> real site, login required, Mongo ON
//   dev       -> developer mode, index.html, Mongo ON
//   prototype -> Render demo, Mongo OFF, no sessions, skip login
export const APP_MODE = process.env.APP_MODE || "standard";

// Advanced summarizer
export const SUMMARY_MODE = process.env.SUMMARY_MODE || "normal";

export const PORT = process.env.PORT || 3000;

export const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/capstone";

//. AI MODE log
console.log(`❔ AI mode:${AI_MODE}`);
if (AI_MODE === "local") {
  console.log("[env] 🦙 Running in local LLM mode (ollama expected on localhost:3000)");
  console.log("[env] using summerizeWithPhi4:14b() as default summarizer");
} else {
  console.log("[env]💭 Running in OPENAI mode (cloud API)");
  console.log("[env] using summarizeWithOpenAiCloud() as default summarizer")
}

//. SUMMARY MODE log
console.log(`❔ SUMMARY mode:${SUMMARY_MODE}`);
if (SUMMARY_MODE === "advanced") {
  console.log("[env] 🍨 Advanced Summary Mode");
} else {
  console.log("[env]🍦 Vanilla Summary Mode");
}
// Summary mode getter
export function getSummaryMode() {
  if (SUMMARY_MODE === "advanced") {
    summary_mode = "advanced";
  }
  else {
    summary_mode = "normal";
  }
  return summary_mode;
}

//. APP_MODE log
console.log(`❔ APP mode:${APP_MODE}`);
if (APP_MODE === "standard") {
  console.log("[env] 📡 STANDARD MODE: login required, Mongo ON, sessions ON");
}
else if (APP_MODE === "dev") {
  console.log("[env] 📵 DEV MODE: index.html root, login local-only, Mongo ON, sessions ON");
}
else if (APP_MODE === "prototype") {
  console.log("[env] 🎸 PROTOTYPE MODE: Mongo OFF, Sessions OFF, Login DISABLED");
}
else {
  console.log("[env] I don't know what APP MODE I'm in?!");
}
// App mode getter
export function getAppMode() {
  if (APP_MODE === "standard") {
    app_mode = "standard";
  }
  else if (APP_MODE === "dev") {
    app_mode = "dev";
  }
  else if (APP_MODE === "prototype") {
    app_mode = "prototype";
  }
  return app_mode;
}

//This is for philter
export const PHILTER_ENABLED = process.env.PHILTER_ENABLED === "true";
export const PHILTER_URL = process.env.PHILTER_URL || "http://localhost:8080"; 
