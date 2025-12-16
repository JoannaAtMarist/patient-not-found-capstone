/* ─────────────────────────────────────────────────────────────────────────────────────
 * File: redactRoutes.js
 * Path: /server/routes/redactRoutes.js
 * Description: Modularized redaction routes.
 * 
 * TODO: Expand with additional redaction endpoints as new features are added.
 * ───────────────────────────────────────────────────────────────────────────────────── */

//~ Imports
import express from "express";
import { redactNote } from "../controllers/redactController.js";

const router = express.Router();

//. Redaction Endpoint (runs before summarization)
router.post("/", redactNote);

// Exports 
export default router;
