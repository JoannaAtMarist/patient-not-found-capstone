/* ──────────────────────────────────────────────────────────────
 * File: /client/src/js/global.js
 * Purpose: Shared global functions used across ALL pages.
 * 
 * This file contains:
 *  - Navigation helpers (goHome, goProfile, etc.)
 *  - Logout logic
 *  - Session helper functions
 *  - General-purpose utilities
 *
 * Page-specific logic must NOT be added here.
 * Navigation bar rendering stays in navigation.js.
 * ──────────────────────────────────────────────────────────────
 */

console.log("[PNF] global.js loaded");

//~   SESSION HELPERS

// Get user's first name
export function getFirstName() {
    return sessionStorage.getItem("firstName") || "";
}

// Get user's last name
export function getLastName() {
    return sessionStorage.getItem("lastName") || "";
}

// Get full display name
export function getUserFullName() {
    const f = getFirstName();
    const l = getLastName();
    return f || l ? `${f} ${l}`.trim() : "";
}

// Get role
export function getRole() {
    return sessionStorage.getItem("role") || "";
}

// Shortcut: Is Admin?
export function isAdmin() {
    return getRole() === "Administrator";
}

//~ GLOBAL NAVIGATION HELPERS
// These are safe, global redirect helpers used everywhere.
// They do NOT depend on navigation.js and can be called from any page.

export function goHome() {
    location.href = "/home";
}

export function goProfile() {
    location.href = "/profile";
}

export function goSummary() {
    location.href = "/summary";
}

export function goEdit() {
    location.href = "/editor";
}

export function goAdmin() {
    location.href = "/admin-dashboard";
}

export function goCreateAccount() {
    location.href = "/create-account";
}

export function goLogin() {
    location.href = "/login";
}

export function goGetHelp() {
    location.href = "/help";
}
export function goProvideFeedback() {
    location.href = "/feedback";
}
export function goCreateNewSummary(){
    location.href = "/new-summarizer"; 
}

//~ LOGOUT
export function logOut() {
    console.log("[PNF] core.logOut()");

    // Clear local storage immediately
    sessionStorage.clear();

    // Let the browser fully follow the Auth0 logout redirect flow
    window.location.href = "/logout";   // uses GET, but your route supports both
}

//~ PLACEHOLDER (for features not implemented)
export function placeholder() {
    alert("This feature is coming soon!");
}

