// server/config/auth0Management.js
import fetch from "node-fetch";

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const MGMT_CLIENT_ID = process.env.AUTH0_MGMT_CLIENT_ID;
const MGMT_CLIENT_SECRET = process.env.AUTH0_MGMT_CLIENT_SECRET;
const MGMT_AUDIENCE = process.env.AUTH0_MGMT_AUDIENCE;

// Simple in-memory token cache
let mgmtToken = null;
let mgmtTokenExpiresAt = 0;

async function getManagementToken() {
    const now = Date.now();
    if (mgmtToken && now < mgmtTokenExpiresAt) {
        return mgmtToken;
    }

    const resp = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            client_id: MGMT_CLIENT_ID,
            client_secret: MGMT_CLIENT_SECRET,
            audience: MGMT_AUDIENCE,
            grant_type: "client_credentials",
        }),
    });

    if (!resp.ok) {
        const errText = await resp.text();
        console.error("[Auth0Mgmt] Failed to get token:", resp.status, errText);
        throw new Error("Failed to get Auth0 management token");
    }

    const data = await resp.json();
    mgmtToken = data.access_token;
    // exp in seconds -> ms; subtract 10s for safety
    mgmtTokenExpiresAt = now + (data.expires_in - 10) * 1000;

    return mgmtToken;
}

export async function createAuth0User({ email, password, firstName, lastName }) {
    const token = await getManagementToken();

    const resp = await fetch(`https://${AUTH0_DOMAIN}/api/v2/users`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            email,
            password,
            connection: "Username-Password-Authentication", // default DB connection name
            verify_email: true,
            given_name: firstName,
            family_name: lastName,
        }),
    });

    if (!resp.ok) {
        const errText = await resp.text();
        console.error("[Auth0Mgmt] Failed to create user:", resp.status, errText);
        throw new Error("Auth0 user creation failed");
    }

    const user = await resp.json();
    console.log("[Auth0Mgmt] Created Auth0 user:", user.user_id, email);
    return user;
}
