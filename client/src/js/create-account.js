/* ─────────────────────────────────────────────────────────────────────────────────────
 * File: create-account.js
 * Path: /client/src/js/create-account.js
 * Description: Handle account creation form submission
 * ───────────────────────────────────────────────────────────────────────────────────── */

// Imports
import { goLogin } from "./global.js";

console.log("[PNF] create-account.js loaded");

//~ Event Listeners
document.addEventListener("DOMContentLoaded", () => {
    const button = document.getElementById("createbutton");
    if (button) button.addEventListener("click", createAccount);
});

/**
 * Validate that the string contains only permitted characters (letters, digits, @, dash).
 * @param {string} str - Value to validate.
 * @returns {boolean} False when invalid characters are present.
 */
function checkSpecialChar(str) {
    if (/^[a-z@-Z!-9]+$/.test(str) == true) // Returns true if the string contains characters outside the allowed set.
    {
        return false;
    }
    else {
        return true;
    }
}

//~ Functions
/**
 * Handles account creation form submission for the local (non-Auth0) flow.
 * Performs client-side validation and posts the user payload to /api/users.
 */
async function createAccount() {
    const username = document.getElementById("userName")?.value.trim();
    const firstName = document.getElementById("firstName")?.value.trim();
    const lastName = document.getElementById("lastName")?.value.trim();
    const email = document.getElementById("email")?.value.trim();
    const password = document.getElementById("passWord")?.value.trim();
    const organization = "Marist"; // Prototype default: organization is not user-editable yet.
    const role = document.getElementById("role-select")?.value;

    // Validation
    if (!username) return alert("Username cannot be blank.");
    if (!firstName) return alert("First name cannot be blank.");
    if (!lastName) return alert("Last name cannot be blank.");
    if (!email) return alert("Email cannot be blank.");
    // TODO: Better password rules
    if (!password) return alert("Password cannot be blank.");
    if (!role) return alert("Role cannot be blank.");

    if (checkSpecialChar(username) == true) return alert("Username cannot contain invalid characters.");
    if (checkSpecialChar(firstName) == true) return alert("First name cannot contain invalid characters.");
    if (checkSpecialChar(lastName) == true) return alert("Last name cannot contain invalid characters.");
    if (checkSpecialChar(email) == true) return alert("Email cannot contain invalid characters.");
    if (checkSpecialChar(password) == true) return alert("Password cannot contain invalid characters.");

    // Creates a local account via POST /api/users (non-Auth0 flow).
    try {
        const response = await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username,
                firstName,
                lastName,
                email,
                password,
                organization: "Marist",
                role
            })
        });

        const data = await response.json();

        if (response.ok && data.success !== false) {
            console.log("Account created:", data);
            window.location.href = "/login";
        } else {
            alert(data.error || "Account creation failed.");
        }
    } catch (err) {
        console.error("Create account failed:", err);
        alert("Something went wrong. Try again later.");
    }
}
