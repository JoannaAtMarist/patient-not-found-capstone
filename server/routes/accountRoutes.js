/* ─────────────────────────────────────────────────────────────────────────────────────
 * File: accountRoutes.js
 * Path: /server/routes/accountRoutes.js
 * Description: Modularized account routes for Auth0-backed PNF.
 * ───────────────────────────────────────────────────────────────────────────────────── */

//~ Imports
import express from "express";
import * as accountController from "../controllers/accountController.js";
import { requireLogin } from "../middleware/authGuard.js";

const router = express.Router();

/* ──────────────────────────────────────────────────────────────
 * ACCOUNT ROUTES (Auth0 Edition)
 * Note:
 *   • Auth0 logout handled by /logout in server.js
 *   • This module now strictly manages MongoDB user records
 * ────────────────────────────────────────────────────────────── */

// Create account (backend triggered — used by create-account page)
router.post("/", accountController.createAccount);

// Get all users (Admin-only)
router.get("/", requireLogin, accountController.getAllAccounts);

// Get info about one user
router.get("/:id", requireLogin, accountController.getAccountInfo);

// Update user account (e.g., role, names, etc.)
router.patch("/:id", requireLogin, accountController.updateAccount);

// Delete user (Admin-only)
router.delete("/:id", requireLogin, accountController.deleteAccount);

// Exports 
export default router;

