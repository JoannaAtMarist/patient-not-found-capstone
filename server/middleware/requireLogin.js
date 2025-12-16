/* ─────────────────────────────────────────────────────────────────────────────────────
 * File: requireLogin.js
 * Path: /server/middleware/requireLogin.js
 * Description: 
 * ───────────────────────────────────────────────────────────────────────────────────── */

// Exports 
export function requireLogin(req, res, next) {
  // Prototype mode: never require login
  if (process.env.APP_MODE === "prototype") return next();

  // Dev mode: always allow local-only simplified auth flow
  if (process.env.APP_MODE === "dev") return next();

  // Auth0 mode: require session.user
  if (req.session?.user) return next();

  return res.redirect("/login");
}
