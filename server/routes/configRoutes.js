/* ─────────────────────────────────────────────────────────────────────────────────────
 * File: configRoutes.js
 * Path: /server/routes/configRoutes.js
 * Description: Modularized config routes.
 * ───────────────────────────────────────────────────────────────────────────────────── */

//~ Imports
import express from "express";
const router = express.Router();

//. Returns current AI_MODE
router.get("/", (req, res) => {
    res.json({ AI_MODE: process.env.AI_MODE || "openai" });
});

// Exports 
export default router;
