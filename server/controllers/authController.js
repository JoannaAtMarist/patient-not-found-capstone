/* ─────────────────────────────────────────────────────────────────────────────────────
 * File: authController.js
 * Path: /server/controllers/authController.js
 * Description: 
 * ───────────────────────────────────────────────────────────────────────────────────── */

//~ Imports
import Account from "../models/Account.js";

// Exports 
//. Called when Auth0 redirects back to /callback
export async function handleAuthCallback(req, res) {
    try {
        // Auth0 user exists
        const oidcUser = req.oidc?.user;
        if (!oidcUser) return res.redirect("/login");

        const email = oidcUser.email;
        let user = await Account.findOne({ email });

        // Auto-create account if it doesn't exist
        if (!user) {
            user = await Account.create({
                email,
                role: "Doctor",  // default role
                name: oidcUser.name || "Unnamed User",
            });
        }

        // Save user to session
        req.session.user = {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            name: user.name,
        };

        return res.redirect("/home");
    } catch (err) {
        console.error("Auth callback failed:", err);
        return res.redirect("/login");
    }
}

//. logout
export function handleLogout(req, res) {
    req.session.destroy(() => {
        res.clearCookie("connect.sid");

        if (req.oidc?.logout) {
            return res.oidc.logout({
                returnTo: process.env.AUTH0_LOGOUT_REDIRECT || "http://localhost:3000/landing",
            });
        }

        return res.redirect("/landing");
    });
}
