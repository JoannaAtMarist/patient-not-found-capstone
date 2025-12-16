/* ─────────────────────────────────────────────────────────────────────────────────────
 * File: requireAdmin.js
 * Path: /server/middleware/requireAdmin.js
 * Description: Restricts access to Admin users only.
 * ───────────────────────────────────────────────────────────────────────────────────── */

// Exports 
export function requireAdmin(req, res, next) {

    const user = req.session?.user;

      console.log("requireAdmin called, User role:", user.role);

    if (!user || user.role !== "Administrator") {
        return res.status(403).json({
            success: false,
            error: "Access denied. Admin privileges required.",
            timestamp: new Date().toISOString(),
        });
    }
    next();
}
