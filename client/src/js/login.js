/* ─────────────────────────────────────────────────────────────────────────────────────
 * File: login.js
 * Path: /client/src/js/login.js
 * Description: Login page script. 
 * In standard mode, login is initiated via backend-auth route (Auth0/CAS/etc). 
 * This file wires the login button to that flow.
 * ───────────────────────────────────────────────────────────────────────────────────── */

import { goHome } from "./global.js";

console.log("[PNF] login.js loaded");

// LOCAL EVENT LISTENER (no in-HTML onclick)
// NOTE: login handler is provided by the active auth mode; 
// ensure handleLogin is defined before wiring events.
document.addEventListener("DOMContentLoaded", () => {
    const loginButton = document.getElementById("login-button");
    loginButton?.addEventListener("click", handleLogin);

    document.getElementById("password")?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();   // stop browser's form submission
            handleLogin();        // do our custom login
        }
    });
});