/* ─────────────────────────────────────────────────────────────────────────────────────
 * File: home.js
 * Path: /client/src/js/home.js
 * Description: Handles main-page navigation + HIPAA modal
 * ───────────────────────────────────────────────────────────────────────────────────── */

import {
    goSummary,
    goProfile,
    goAdmin,
    goProvideFeedback,
    goCreateNewSummary,
    placeholder
} from "./global.js";

console.log("[PNF] home.js loaded");

async function syncUserSession() {
    try {
        const res = await fetch("/api/session/status", { credentials: "include" });
        const data = await res.json();

        if (data.loggedIn && data.user) {
            const u = data.user;
            sessionStorage.setItem("role", u.role);
            sessionStorage.setItem("email", u.email);
            sessionStorage.setItem("username", u.username);
            sessionStorage.setItem("firstName", u.firstName || "");
            sessionStorage.setItem("lastName", u.lastName || "");
        } else {
            sessionStorage.clear();
        }
    } catch (e) {
        console.error("[PNF] syncUserSession failed:", e);
        sessionStorage.clear();
    }
}

document.addEventListener("DOMContentLoaded", async () => {

    // Audit Log Loader (Admin Only)
    await syncUserSession();
    async function loadAuditLogs() {
        try {
            const res = await fetch("/api/audit/logs", { credentials: "include" });
            const data = await res.json();

            const table = document.getElementById("audit-table-body");
            if (!table) return;

            table.innerHTML = "";

            data.logs.forEach(log => {
                const row = `
                <tr>
                  <td>${new Date(log.timestamp).toLocaleString()}</td>
                  <td>${log.user || log.username}</td>
                  <td>${log.type}</td>
                  <td>${log.message}</td>
                  <td>${log.path || log.context || "-"}</td>
                </tr>`;

                table.insertAdjacentHTML("beforeend", row);
            });
        } catch (err) {
            console.error("[PNF] Error loading audit logs:", err);
        }
    }

    // BUTTON EVENT LISTENERS
    // HIPAA overlay elements
    const hipaaOverlay = document.getElementById("hipaaOverlay");
    const closeAcceptBtn = document.getElementById("closeAcceptBtn");

    // Close the overlay when the user accepts
    if (hipaaOverlay && closeAcceptBtn) {
        closeAcceptBtn.addEventListener("click", () => {
            hipaaOverlay.style.display = "none";
        });
    }

    // Main home buttons
    // "Create New Summary"
    document.getElementById("summaryButton")
        ?.addEventListener("click", goCreateNewSummary);

    // "Account Settings" (first accountButton on the page)
    document.getElementById("accountButton")
        ?.addEventListener("click", goProfile);

    // Feedback (currently commented out in HTML; safe no-op if missing)
    document.getElementById("provideFeedbackButton")
        ?.addEventListener("click", goProvideFeedback);

    // Admin controls and visibility
    const adminBtn = document.getElementById("adminDashboardButton");
    const adminSection = document.getElementById("admin-dashboard");

    const role = sessionStorage.getItem("role");

    // toggles the admin section and binds the admin button only for role === "Administrator"
    if (role === "Administrator") {
        if (adminSection) adminSection.style.display = "block";
        adminBtn?.addEventListener("click", goAdmin);
        // Load audit logs when an admin lands on home
        loadAuditLogs();
    } else {
        if (adminSection) adminSection.style.display = "none";
    }

    // Set welcome header determined by role
    const username = sessionStorage.getItem("firstName") || "User";
    const last = sessionStorage.getItem("lastName") || "";
    const headerEl = document.getElementById("userHeader");

    if (role === "Doctor") {
        headerEl.innerText = `Welcome Back, Dr. ${last || username}.`;
    } else {
        headerEl.innerText = `Welcome Back, ${username}.`;
    }
});

