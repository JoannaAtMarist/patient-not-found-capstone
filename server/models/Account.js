/* ─────────────────────────────────────────────────────────────────────────────────────
 * File: Account.js
 * Path: /server/models/Account.js
 * Description: Stores the account schema for users.
 * ───────────────────────────────────────────────────────────────────────────────────── */

//~ Imports
//import bcrypt from "bcryptjs";
import mongoose from "mongoose";

// Schema for user accounts
const accountSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: false },
  email: { type: String, required: true, unique: true, trim: true },
  organization: { type: String, trim: true },
  role: {
    type: String,
    enum: ["Doctor", "Administrator", "Assistant", "Other Clinician", "Scribe"],
    default: "Doctor"
  },
  // 🔐 Link to Auth0 user
  auth0UserId: { type: String, unique: true, sparse: true },
}, { timestamps: true });

// Encrypt password before saving (only if changed)
/*accountSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});*/

const Account = mongoose.model("Account", accountSchema);
export default Account;
