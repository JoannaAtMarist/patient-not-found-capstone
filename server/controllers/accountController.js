/* ─────────────────────────────────────────────────────────────────────────────────────
 * File: accountController.js
 * Path: /server/controllers/accountController.js
 * Description: Handles user account creation, authentication, and session management.
 * 
 * Auth0 Edition
 * ───────────────────────────────────────────────────────────────────────────────────── */

//~ Imports
import Account from "../models/Account.js";
import { ManagementClient } from "auth0";

//~ Auth0 Management API Client
const auth0 = new ManagementClient({
  domain: process.env.AUTH0_DOMAIN,               // e.g. dev-xxxx.us.auth0.com
  clientId: process.env.AUTH0_MGMT_CLIENT_ID,     // M2M app
  clientSecret: process.env.AUTH0_MGMT_CLIENT_SECRET,
  scope: "create:users read:users update:users read:users_app_metadata update:users_app_metadata"
});


//~ Utility — consistent API response
function sendResponse(res, status, success, message, data = null) {
  const payload = {
    success,
    message,
    timestamp: new Date().toISOString(),
  };
  if (data) payload.data = data;
  return res.status(status).json(payload);
}

// ─────────────────────────────────────────────────────────────
// CONTROLLERS 🚀
// ─────────────────────────────────────────────────────────────

//. List all accounts
export async function getAllAccounts(req, res, next) {
  try {
    const accounts = await Account.find().select("-password");
    return sendResponse(res, 200, true, "Accounts retrieved successfully", accounts);
  } catch (err) {
    err.status = 500;
    err.message = "Failed to get accounts";
    next(err);
  }
}

//. Create account  (Auth0 ➜ Mongo)
export async function createAccount(req, res, next) {
  try {
    const { firstName, lastName, username, password, email, organization, role } = req.body;

    if (!firstName || !lastName || !username || !password || !email) {
      return sendResponse(
        res,
        400,
        false,
        "First name, last name, username, email, and password are required"
      );
    }

    // ensure duplicate usernames don’t exist in Mongo
    const existing = await Account.findOne({ username: username.trim() });
    if (existing) {
      return sendResponse(res, 409, false, "Username already exists");
    }

    // -----------------------------------------------------------------
    // 1️⃣ Create user in Auth0
    // -----------------------------------------------------------------
    let auth0User;
    try {
      auth0User = await auth0.users.create({
        connection: "Username-Password-Authentication",
        email,
        password,
        given_name: firstName,
        family_name: lastName,
        name: `${firstName} ${lastName}`,
        user_metadata: { role: role || "Doctor" },
      });
    } catch (err) {
      console.error("Auth0 user creation failed:", err);
      return sendResponse(res, 400, false, "Auth0 signup error: " + err.message);
    }

    // -----------------------------------------------------------------
    // 2️⃣ Create local MongoDB user
    // -----------------------------------------------------------------
    const newAccount = new Account({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      username: username.trim(),
      // In Auth0 mode, Mongo password is optional; you could omit it entirely.
      password,
      email: email.trim(),
      organization: organization?.trim() || "",
      role: role || "Doctor",
      auth0UserId: auth0User.user_id, // <-- IMPORTANT
    });

    await newAccount.save();

    const sanitized = {
      _id: newAccount._id,
      firstName: newAccount.firstName,
      lastName: newAccount.lastName,
      username: newAccount.username,
      email: newAccount.email,
      organization: newAccount.organization,
      role: newAccount.role,
    };

    return sendResponse(res, 201, true, "Account created successfully", sanitized);

  } catch (err) {
    console.error("[AccountController] createAccount error:", err);
    err.status = 400;
    next(err);
  }
}

//. Get account info
export async function getAccountInfo(req, res, next) {
  try {
    const account = await Account.findById(req.params.id).select("-password");
    if (!account) return sendResponse(res, 404, false, "Account not found");
    return sendResponse(res, 200, true, "Account retrieved successfully", account);
  } catch (err) {
    err.status = 500;
    next(err);
  }
}

//. Update account (Mongo-only fields)
export async function updateAccount(req, res, next) {
  try {
    const updates = { ...req.body };

    // Prevent Auth0-controlled fields from being changed here
    delete updates.password;
    delete updates.username;
    delete updates.auth0UserId;

    const updated = await Account.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updated) return sendResponse(res, 404, false, "User not found");

    return sendResponse(res, 200, true, "Account updated successfully", updated);

  } catch (err) {
    err.status = 400;
    next(err);
  }
}

//. Delete account (Mongo only for now)
export async function deleteAccount(req, res, next) {
  try {
    const deletedUser = await Account.findByIdAndDelete(req.params.id);
    if (!deletedUser) return sendResponse(res, 404, false, "User not found");
    return sendResponse(res, 200, true, "Account deleted successfully");
  } catch (err) {
    err.status = 500;
    next(err);
  }
}




