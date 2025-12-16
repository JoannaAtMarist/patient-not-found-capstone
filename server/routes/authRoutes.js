/* ─────────────────────────────────────────────────────────────────────────────────────
 * File: authRoutes.js
 * Path: /server/routes/authRoutes.js
 * Description:
 * ───────────────────────────────────────────────────────────────────────────────────── */

//~ Imports
import express from "express";
import { handleAuthCallback, handleLogout } from "../controllers/authController.js";

const router = express.Router();

//. AUTH0 callback
router.get("/callback", handleAuthCallback);

//. Classic login page (only for dev mode)
router.get("/login", (req, res) => {
    const viewsPath = req.app.get("viewsPath");

    if (process.env.APP_MODE === "dev") {
        return res.sendFile("login.html", { root: viewsPath });
    }

    // Standard mode -> redirect to Auth0 and then to /landing
    return res.oidc.login({ returnTo: "/home" });
});

//. Logout
router.get("/logout", handleLogout);
router.post("/logout", handleLogout);

// Exports 
export default router;
