/* ─────────────────────────────────────────────────────────────────────────────────────
 * File: sessionRoutes.js
 * Path: /server/routes/sessionRoutes.js
 * Description: Modularized session routes.
 * ───────────────────────────────────────────────────────────────────────────────────── */

//~ Imports
import express from "express";
const router = express.Router();

//. Session status validity checker
router.get("/status", (req, res) => {
    const hasSessionUser = !!req.session?.user;
    const isOidcAuth = !!req.oidc && req.oidc.isAuthenticated();
    const loggedIn = hasSessionUser && isOidcAuth;

    if (loggedIn) {
        return res.status(200).json({
            loggedIn: true,
            user: req.session.user,
        });
    }

    return res.status(200).json({
        loggedIn: false,
        message: "No active session",
    });
});

// Exports 
export default router;
