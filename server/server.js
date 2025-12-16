/* ─────────────────────────────────────────────────────────────────────────────────────
 * File: server.js
 * Path: /server/server.js
 * Description: Main Express server entry point for the Patient Not Found prototype.
 *   Handles all backend responsibilities including:
 *   • Express configuration and middleware setup (CORS, sessions, logging)
 *   • Persistent session management via MongoDB (connect-mongo)
 *   • Database connection and model integration (Mongoose)
 *   • AI endpoints for summarization and redaction (OpenAI API + Phi models)
 *   • User account management (registration, login, logout)
 *   • Role-based route access for Doctor, Administrator, and Assistant
 *   • Static serving of frontend pages (views, src, and public)
 *   • Swagger documentation for API testing and verification
 *
 * Notes:
 *   - Middleware and route order is deliberate — changing it may break routing or sessions.
 *   - Vite is referenced but not required; only Joanna has it partially set up.
 * 
 * Modes:
 *   standard  – real site, login required, Mongo ON, sessions ON
 *   dev       – developer mode, index.html root, login local-only, Mongo ON, sessions ON
 *   prototype – Render demo, Mongo OFF, NO sessions, NO login, direct access to summary
 * ───────────────────────────────────────────────────────────────────────────────────── */

//~ Imports
// ─────────────────────────────────────────────
// Load all environment and core dependencies used by the backend.
// Order is important: env -> Express core -> Middleware -> AI + Controllers
// ─────────────────────────────────────────────
//. ─── 1. Load env first ───────────────────────
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

//. ─── 2. Then load express and config ─────────
import express from "express";
import {
  AI_MODE,
  APP_MODE,
  PORT,
  MONGO_URI,
} from "./config/env.js";
import { getAIClient } from "./config/aiBootstrap.js";
import {
  isDev,
  isStandard,
  isPrototype,
} from "./utilities/ModeManager.js";

//. Core dependencies
// mongoose -> database ORM for MongoDB
import mongoose from "mongoose";
// path -> handles file & directory paths
import path from "path";
// body-parser -> parses text/plain bodies (used in some legacy endpoints)
import bodyParser from "body-parser";
// express-session -> manages session cookies for login state
import session from "express-session";
// swagger-ui-express + yamljs -> renders API documentation UI
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
// openai -> connects to OpenAI API for summarization
import { fileURLToPath } from "url";
// Cors & Mongo back up here
import cors from "cors";
import MongoStore from "connect-mongo";

//. Auth0
// AUTH0
import { auth } from "express-openid-connect";
// Mongo model (Auth0 auto-provision)
import Account from "./models/Account.js";

//import { requireLogin } from "./middleware/authGuard.js";

// some imports are intentionally done below

//. Session secret management
import crypto from "crypto";

// Dev-only: generate an ephemeral session secret if none provided
function getSessionSecret(appMode) {
  const provided = (process.env.SESSION_SECRET || "").trim();
  if (provided) return provided;

  if (appMode === "dev") {
    console.log("[session] DEV MODE: SESSION_SECRET not set; using ephemeral secret for this run.");
    return crypto.randomBytes(32).toString("hex");
  }

  throw new Error("SESSION_SECRET is required (set it in your environment / .env). Refusing to start.");
}

// Only compute a session secret if we will actually use sessions
const SESSION_SECRET = isPrototype ? null : getSessionSecret(APP_MODE);

//~ Express App Setup
// ─────────────────────────────────────────────
const app = express();
// Resolve __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//~ Database Connection (MongoDB)
// ─────────────────────────────────────────────
// Must load before sessions so that session store can attach to MongoDB.
// Uses either local DB or Atlas depending on .env.
// NOTE: Atlas automatically starts when the server starts.
// ─────────────────────────────────────────────
//. PROTOTYPE MODE CHECK -> Mongo OFF, Sessions OFF, Login OFF
console.log("STEP 1... Connecting to Mongo....");
if (isPrototype) {
  console.log("❌ PROTOTYPE MODE: MongoDB is DISABLED.");
} else {
  //. STANDARD + DEV -> Mongo ON
  mongoose.connect(MONGO_URI)
    .then(() => console.log("🥭 Connected to MongoDB"))
    .catch(err => console.error("❌ MongoDB connection failed:", err));
}
let mongoReady = false;
mongoose.connection.once("open", () => {
  console.log("🥭 MongoDB connection ready.");
  mongoReady = true;
});

//~ AUTH0 CONFIG
console.log("STEP 2... Auth0 config defined....");
const auth0Config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH0_SECRET?.trim(),
  baseURL: process.env.AUTH0_BASE_URL?.trim(),
  clientID: process.env.AUTH0_CLIENT_ID?.trim(),
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL?.trim(),
};

//~ Authentication Middleware
// DEV helper
// function skipAuthIfDev(req, res, next) {
//   if (isDev) return next();
//   return requireLogin(req, res, next);
// }

//~ Middleware
// ─────────────────────────────────────────────
// Order matters — JSON parser first, then text/plain fallback.
// Sessions and CORS come next, followed by dev logging.
// must precede all routes below.
// ─────────────────────────────────────────────
// Parse JSON request bodies
app.use(express.json());
// Handle raw text/plain requests, parse plain text if no JSON
app.use(bodyParser.text({ type: "text/plain" }));

//~ Sessions + CORS Setup (AFTER successful connection to MongoDB)
//. CORS Configuration
// ─────────────────────────────────────────────
// CORS (Cross-Origin Resource Sharing) and Sessions often work together.
// CORS decides *who* is allowed to talk to the backend, and Sessions decide
// *whether that user stays logged in* once connected.
// ─────────────────────────────────────────────
// In this project:
// - The cors() config allows both ports 5173 (Vite) and 3000 (Express) to connect.
// - The 'credentials: true' flag ensures cookies (sessions) are included.
// - Without credentials:true, your login would work for one request then vanish.
// - The session() middleware stores a session cookie ('connect.sid') in the browser.
// - That cookie points to a MongoDB record that holds your session data.
// - If MongoDB is restarted or session expires, that “memory” is gone.
// ─────────────────────────────────────────────
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
}));

//. Persistent Sessions stored in MongoDB
// STANDARD + DEV -> Mongo-backed sessions
// PROTOTYPE -> NO SESSIONS AT ALL
console.log("STEP 3... Sessions set....");
if (!isPrototype) {
  app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    // Do not store empty sessions. This reduces DB load and prevents
    // sending unnecessary cookies before a user actually logs in.
    store: MongoStore.create({
      mongoUrl: MONGO_URI,
      collectionName: "sessions",
      ttl: 3600, // Set TTL to 1 hour (3600 seconds)
      autoRemove: 'native', // Enable auto removal of expired sessions
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60, // 1 hour
    },
  }));
  console.log("🪪 Mongo-backed session store active");
} else {
  console.log("🎸 Prototype mode: Session middleware DISABLED");
}

// Auth0 MUST come after session()
//app.use(auth(auth0Config));

//~ AUTH0 MIDDLEWARE (AFTER SESSIONS)
console.log("STEP 4... Auth0 Middleware....");
if (isStandard && !isPrototype) {
  if (!auth0Config.secret || !auth0Config.baseURL || !auth0Config.clientID || !auth0Config.issuerBaseURL) {
    console.error("❌ Auth0 config is incomplete. Check AUTH0_* env vars.");
  } else {
    app.use(auth(auth0Config));
    console.log("🔐 Auth0 middleware enabled");
  }
} else {
  console.log("⛔ Auth0 disabled (not standard mode)");
}

//~ AUTH0 -> MONGO USER SYNC (Auto-Provision)
console.log("STEP 5... Auth0 to Mongo Bridge....");
async function ensureMongoUser(req, res, next) {
  try {
    //Do not run unless mongo isn't ready
    if (!mongoReady) {
      return next();
    }

    if (!req.oidc || !req.oidc.isAuthenticated()) return next();

    const info = req.oidc.user || {};
    const email = info.email;
    const auth0Id = info.sub;
    const username = email || auth0Id;

    if (!username) return next();

    let user =
      await Account.findOne({ auth0UserId: auth0Id }) ||
      await Account.findOne({ email }) ||
      await Account.findOne({ username });

    if (!user) {
      user = await Account.create({
        username,
        email,
        firstName: info.given_name || "Auth0",
        lastName: info.family_name || "User",
        role: "Doctor",
        auth0UserId: auth0Id,
      });
      console.log("[Auth0] Auto-provisioned:", username);
    } else if (!user.auth0UserId) {
      user.auth0UserId = auth0Id;
      await user.save();
    }

    req.session.user = {

      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,


    };

    req.user = req.session.user;
    return next();

  } catch (err) {
    console.error("[Auth0] Mongo sync error:", err);
    //res.status(500).send("Auth0 user provisioning error.");
    return next();
  }
}

app.use(ensureMongoUser);

//. Disable caching (avoid stale session reuse)
console.log("STEP 6... no cache....");
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

//. Production-safe logger
console.log("STEP 7... Safe Logger....");
app.use((req, res, next) => {
  // Do NOT log request bodies here to avoid leaking PHI or summaries.
  const path = req.originalUrl || req.url;
  console.log(`[${req.method}] ${path}`);
  next();
});

//~ AUTH ROUTES (Must go before Root Routes)
console.log("STEP 8... Auth Routes Loading....");
import authRoutes from "./routes/authRoutes.js";
app.use(authRoutes);


//~ Attach Global Middleware
//. Audit Logger
import { auditLogger } from "./middleware/auditLogger.js";
app.use(auditLogger);


//~ Unified Root Route Handler
// ─────────────────────────────────────────────
// Handles the default route ("/").
// Note: This route MUST appear *before* static middleware so that
//       Express does not serve index.html before checking the session.
// ─────────────────────────────────────────────
console.log("STEP 9... All Routes Loading....");
//. Allow Auth0 to complete login
//app.get("/callback", (req, res, next) => next());
//. Development mode: redirect root to dev page before auth flow
if (isDev) {
  app.get("/", (req, res) => res.redirect("/dev-page"));
  //. PROTOTYPE MODE -> skip login, go to home
} else if (isPrototype) {
  app.get("/", (req, res) => res.redirect("/home"));
  //. STANDARD MODE -> real login
} else {
  app.get("/", (req, res) => {
    const sessionUser = req.session?.user;

    // Not logged in -> public landing page
    if (!sessionUser || !req.oidc.isAuthenticated()) {
      return res.redirect("/landing");
    }

    // Logged in -> always go to home (regardless of role)
    return res.redirect("/home");
  });
}

//~ Frontend Static Serving
// ─────────────────────────────────────────────
// Serves static assets (CSS, JS, images) directly from /client.
// These do NOT require authentication.
// 
// Example:
//   /client/src/js/home.js -> GET /js/home.js
//
// NOTE: These static handlers must come *after* the unified "/" route.
//       Otherwise Express will serve index.html before session logic runs.
// ─────────────────────────────────────────────
// viewspath MUST come after express setup, and BEFORE routes
const viewsPath = path.join(__dirname, "../client/views");
console.log("🐾 viewsPath:", viewsPath);

app.use(express.static(path.join(__dirname, "../client/src")));
app.use(express.static(path.join(__dirname, "../client/public")));

// Later build React with Vite (npm run build -> /dist)
//app.use(express.static(path.join(__dirname, "../client/dist")));

// 🚧 Development mode static serving
// Serves ALL of /client directly (so you can open HTML pages manually without login)
if (isDev) {
  app.use(express.static(path.join(__dirname, "../client")));
  console.log("🧱 Dev static root enabled");
}

//~ Page Routes
// These serve HTML pages from /client/views.
// PROTOTYPE MODE -> disable all login/profile/etc
// Only /summary and static assets should work
//. Public Routes (No login required)
app.get("/dev-page", (req, res) =>
  res.sendFile("index.html", { root: path.join(__dirname, "../client") })
);

app.get("/landing", (req, res) => res.sendFile("landing.html", { root: viewsPath }));
app.get("/create-account", (req, res) => res.sendFile("create-account.html", { root: viewsPath }));
//app.get("/password", (req, res) => res.sendFile("password.html", { root: viewsPath }));
//. Login & logout
function requireLogin(req, res, next) {
  if (isDev) {
    return next();
  }
  const isAuth0 = req.oidc && req.oidc.isAuthenticated && req.oidc.isAuthenticated();
  if (!isAuth0 || !req.session?.user) {
    return res.redirect("/login");
  }
  return next();
}

//. Protected Routes
app.get("/home", requireLogin, (req, res) => res.sendFile("home.html", { root: viewsPath }));
app.get("/profile", requireLogin, (req, res) => res.sendFile("profile.html", { root: viewsPath }));
app.get("/members", requireLogin, (req, res) => res.sendFile("members.html", { root: viewsPath }));
app.get("/admin-dashboard", requireLogin, (req, res) => res.sendFile("admin-dashboard.html", { root: viewsPath }));
app.get("/help", requireLogin, (req, res) => res.sendFile("help.html", { root: viewsPath }));
app.get("/feedback", requireLogin, (req, res) => res.sendFile("feedback.html", { root: viewsPath }));
app.get("/documentation", requireLogin, (req, res) => res.sendFile("404PNF_documentation.pdf", { root: viewsPath }));

app.get("/summarizer", requireLogin, (req, res) => res.sendFile("summarizer.html", { root: viewsPath }));
app.get("/new-summarizer", requireLogin, (req, res) => res.sendFile("new-summarizer.html", { root: viewsPath }));
app.get("/summarizerC", requireLogin, (req, res) => res.sendFile("summarizer-columned.html", { root: viewsPath }));

//~ API Endpoints
// Main application logic: configuration + summarization routes + accounts.

//. Route Imports
import configRoutes from "./routes/configRoutes.js";
import summaryRoutes from "./routes/summaryRoutes.js";
import redactRoutes from "./routes/redactRoutes.js";
import accountRoutes from "./routes/accountRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

//. Route Mounts
app.use("/api/config", configRoutes);
app.use("/api/summarize", summaryRoutes);
app.use("/api/redact", redactRoutes);
app.use("/api/users", accountRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/session", sessionRoutes);
app.use("/api/upload", uploadRoutes);

//. API APP_MODE Route
app.get("/api/mode", (req, res) => {
  res.json({
    mode: APP_MODE
  });
});

//~ Swagger Setup
try {
  const swaggerPath = path.join(process.cwd(), "scripts", "swagger.yaml");
  const swaggerDocument = YAML.load(swaggerPath);

  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
      // Swagger CSS file 
      customCssUrl: "../css/swagger-theme.css",
      customSiteTitle: "Patient Not Found API Docs",
      swaggerOptions: {
        docExpansion: "none",
        defaultModelsExpandDepth: -1,
        persistAuthorization: true,
      },
    })
  );

  console.log("🧸 Swagger load success.");
} catch (err) {
  console.warn("⚠️ Swagger load failed:", err.message);
}


//~ 404 Catch-All + Error Handling
//. MUST BE LAST ROUTE IN FILE
app.use((req, res) => res.status(404).sendFile("404.html", { root: viewsPath }));

//. Error Handler
// Every thrown error or rejected Promise that isn’t caught will funnel through it.
import { errorHandler } from "./middleware/errorHandler.js";
app.use(errorHandler);


//~ SERVER START
// Begins listening after all setup complete
app.listen(PORT, () => {
  console.log(`🖥️ Server running at http://localhost:${PORT}`);
  console.log(`📘 Swagger UI available at http://localhost:${PORT}/api-docs`);

  if (isDev) console.log("🚧 DEV MODE ACTIVE");
  if (isPrototype) console.log("🎸 PROTOTYPE MODE ACTIVE");
  if (isStandard) console.log("🔒 STANDARD MODE ACTIVE");
});


// Exports 
// Export app
export default app;