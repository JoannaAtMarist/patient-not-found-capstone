/* ──────────────────────────────────────────────────────────────
 * File: navigation.js
 * Path: /client/src/js/navigation.js
 * Description: Navigation bar management for Patient Not Found;
 * renders authenticated vs pre-login nav;
 * redirects to /login when no user session exists;
 * has special behavior for prototype mode (uses prototype user).
 * ────────────────────────────────────────────────────────────── */

console.log("[PNF] navigation.js loaded");

// MODE detection (standard/dev/prototype)
let MODE = "standard";

async function loadMode() {
  try {
    const res = await fetch("/api/mode");
    const data = await res.json();
    MODE = data.mode || "standard";
  } catch {
    MODE = "standard";
  }
}

// Utility Navigation
import {
  goHome,
  goProfile,
  goSummary,
  goEdit,
  goAdmin,
  goGetHelp,
  logOut
} from "./global.js";

window.goHome = goHome;
window.goProfile = goProfile;
window.goSummary = goSummary;
window.goEdit = goEdit;
window.goGetHelp = goGetHelp;
window.goAdmin = goAdmin;
window.logOut = logOut;

// PROTOTYPE USER
function getPrototypeUser() {
  return {
    firstName: "Visitor",
    lastName: "",
    role: "demo"
  };
}

// Fetch logged-in user
async function getUserFromSession() {
  try {
    const res = await fetch("/api/session/status", {
      credentials: "include",
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.loggedIn ? data.user : null;

  } catch (e) {
    console.error("[PNF] Failed to fetch session:", e);
    return null;
  }
}

// Public pages where navbar is hidden
const publicPages = [
  "/login",
  "/create-account",
  "/forgot-password",
  "/landing"
];
const isPublicPage = publicPages.includes(window.location.pathname);

// Role color capsule
function getRoleColor(role) {
  if (!role) return "#6c757d";
  switch (role.toLowerCase()) {
    case "doctor": return "#198754";
    case "administrator": return "#0d6efd";
    case "assistant": return "#ba0915";
    case "scribe": return "#6f42c1";
    default: return "#6c757d";
  }
}

// Role badge (UI pill in header)
function renderRolePill(user) {
  if (!user) return "";

  const color = getRoleColor(user.role);

  return `
    <div class="role-pill" style="border-left: 5px solid ${color};">
      <div class="role-pill-name">${user.firstName || ""} ${user.lastName || ""}</div>
      <div class="role-pill-role" style="color:${color};">${user.role}</div>
    </div>
  `;
}

// Admin icon (only if Admin)
function renderAdminButton(user) {
  if (!user || user.role !== "Administrator") return "";

  return `
    <button onclick="goAdmin()" class="nav-icon-btn">
      <img src="/images/reload.png" width="25">
    </button>
  `;
}

// PRE-LOGIN NAV
function preLoginNav() {
  return `
    <nav id="navmenu">
      <img src="/images/PNF2.png" class="nav-logo">
      <b>Patient Not Found</b>

      <button class="login-btn" onclick="location.href='/login'">
        Login
      </button>
    </nav>
  `;
}

// Authenticated navigation bar
function authenticatedNav(user) {
  return `
    <nav id="navmenu">

      <!-- Left section -->
      <div class="nav-left">
        <button class="nav-icon-btn" onclick="goHome()">
          <img src="/images/PNF2.png" class="nav-logo">
        </button>
        <b>Patient Not Found</b>
      </div>

      <!-- Right section -->
      <div class="nav-right">

        ${renderAdminButton(user)}

        <button onclick="goProfile()" class="nav-icon-btn">
          <img src="/images/setting.png" width="25">
        </button>

        <button onclick="goGetHelp()" class="nav-icon-btn">
          <img src="/images/interrogation-mark.png" width="20">
        </button>

        <span onclick="logOut()" class="logout-link">Logout</span>

        ${renderRolePill(user)}

      </div>

    </nav>
  `;
}

// RENDER
function renderNav(isAuth, user) {
  const header = document.querySelector("header");
  if (!header) return;

  header.innerHTML = isAuth
    ? authenticatedNav(user)
    : preLoginNav();
}

// INIT
document.addEventListener("DOMContentLoaded", async () => {
  if (isPublicPage) return;

  await loadMode();

  let user = null;

  if (MODE === "prototype") {
    user = getPrototypeUser();
    renderNav(true, user);
    return;
  }

  user = await getUserFromSession();

  if (!user) return (location.href = "/login");

  renderNav(true, user);
});

export { };

