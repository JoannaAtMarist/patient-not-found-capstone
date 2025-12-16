/* ─────────────────────────────────────────────────────────────────────────────────────
 * File: profile.js
 * Path: /client/src/js/profile.js
 * Description: Profile editor for Auth0-backed PNF accounts
 * ───────────────────────────────────────────────────────────────────────────────────── */

import { goHome } from "./global.js";

console.log("[PNF] profile.js loaded");

// Quit Without Saving
function quitWithoutSaving() {
    alert("Changes will not be saved.");
    goHome();
}

// Save Profile 
// updates Mongo-only editable fields via PATCH /api/users/update-profile
async function saveAndExit() {
    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const email = document.getElementById("email").value.trim();

    if (!firstName) return alert("First name cannot be blank.");
    if (!lastName) return alert("Last name cannot be blank.");
    if (!email) return alert("Email cannot be blank.");

    try {
        const res = await fetch("/api/users/update-profile", {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ firstName, lastName, email })
        });

        const data = await res.json();
        if (!res.ok || data.success === false) {
            console.error("[PNF] Update failed:", data);
            return alert(data.error || "Failed to update profile.");
        }

        alert("Profile updated successfully!");
        goHome();

    } catch (err) {
        console.error("[PNF] Error updating profile:", err);
        alert("An error occurred while saving your profile.");
    }
}

// Load Profile From Auth0 Session
// pulls the current logged-in user from /api/session/status and redirects to /login if missing
async function loadProfile() {
    try {
        const res = await fetch("/api/session/status", {
            method: "GET",
            credentials: "include"
        });

        const data = await res.json();

        if (!data.loggedIn || !data.user) {
            console.warn("[PNF] No session — redirecting to login");
            return (location.href = "/login");
        }

        const user = data.user;

        // Populate editable fields
        document.getElementById("firstName").value = user.firstName || "";
        document.getElementById("lastName").value = user.lastName || "";
        document.getElementById("email").value = user.email || "";

        // Populate non-editable Auth0-managed fields
        const usernameField = document.getElementById("userName");
        if (usernameField) {
            usernameField.value = user.username || "";
            usernameField.disabled = true;
        }

    } catch (err) {
        console.error("[PNF] Failed to load profile:", err);
        location.href = "/login";
    }
}

// INIT
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("quitButton")?.addEventListener("click", quitWithoutSaving);
    document.getElementById("saveButton")?.addEventListener("click", saveAndExit);

    loadProfile();
});

