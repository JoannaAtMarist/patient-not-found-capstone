/* ─────────────────────────────────────────────────────────────────────────────────────
 * File: admin-dashboard.js
 * Path: /client/src/js/admin-dashboard.js
 * Description: Handles admin navigation + audit logs (Auth0 edition)
 * ───────────────────────────────────────────────────────────────────────────────────── */

// SYNC USER SESSION (Auth0-backed)
// pulls /api/session/status and mirrors it into sessionStorage for UI gating (role/email/name)
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

// NAVIGATION HELPERS
async function goToProfileSettings() {
    console.log("[PNF] Navigating to profile...");
    await Promise.resolve();
    location.replace("./profile");
}

async function logOut() {
    console.log("[PNF] logOut() clicked");
    sessionStorage.clear();

    try {
        await Promise.resolve();
        location.href = "/logout";     // Auth0 logout endpoint
    } catch (err) {
        console.error("[PNF] Logout failed:", err);
    }
}

// AUDIT LOGS (ADMIN ONLY)
// expects data.logs and renders them into #audit-table-body
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

// PAGE LOAD LOGIC
// on DOMContentLoaded: sync session, check role, load audit logs if admin
document.addEventListener("DOMContentLoaded", async () => {

    // Sync Auth0 session -> sessionStorage
    await syncUserSession();

    // Determine user role
    const role = sessionStorage.getItem("role");

    // Hide admin dashboard if not admin
    if (role !== "Administrator") {
        const adminDiv = document.getElementById("admin-dashboard");
        if (adminDiv) adminDiv.style.display = "none";
        return;
    }

    // Admin -> load audit logs
    loadAuditLogs();
});
