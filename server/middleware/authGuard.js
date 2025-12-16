/* ─────────────────────────────────────────────────────────────────────────────────────
 * File: authGuard.js
 * Path: /server/middleware/authGuard.js
 * Description: Security and session protection middleware
 * ───────────────────────────────────────────────────────────────────────────────────── */

// Exports 
/**
 * requireLogin()
 * Checks whether a valid session exists.
 * - If the request is for an API route (starts with /api), respond with 401 JSON.
 * - If the request is for a frontend view, redirect to the login page.
 */
export function requireLogin(req, res, next) {
  const user = req.user || req.session?.user;

  if (user) {
    //normalize to req.user so downstream code can rely on it 
    req.user = user;
    return next(); // user is logged in
  }

  // 🔒 Not logged in
  if (req.originalUrl.startsWith("/api")) {
    // API calls get JSON, not redirects
    return res.status(401).json({ error: "Unauthorized: CAS login required." });
  } else {
    // Frontend routes get redirected to login page
    return res.redirect("/login");
  }
}
