# System Architecture – Component Breakdown

This section describes the major backend components and how they cooperate to implement the Patient Not Found prototype.

---

## Routes Layer

The routes layer is responsible for defining HTTP paths and wiring them to controllers or middleware. All routes are mounted in `server.js` under the `/api` prefix where appropriate.

### `routes/configRoutes.js`

- **Mount path:** `/api/config`  
- **Endpoints:**
  - `GET /api/config` -> returns the current `AI_MODE` (e.g., `"openai"` or `"local"`).  
- Used by the frontend to show which summarizer is active.
- [Config Routes File](../server/routes/configRoutes.js)

### `routes/summaryRoutes.js`

- **Mount path:** `/api/summarize`  
- **Endpoints:**
  - `POST /api/summarize` -> universal summarization entrypoint. Chooses OpenAI or local Phi-4 based on `AI_MODE`.  
  - `POST /api/summarize/pipeline` -> full pipeline (validate -> redact -> summarize -> reintegrate).  
  - `POST /api/summarize/pipeline/multi` -> pipeline for multiple notes at once (files or JSON).  
  - `POST /api/summarize/openai` -> “force OpenAI” summarization endpoint.  
- Uses AI helpers from `summaryController.js` and `PipelineManager` plus `logHelper` for audit-style AI logging.
- [Summary Routes File](../server/routes/summaryRoutes.js)

### `routes/redactRoutes.js`

- **Mount path:** `/api/redact`  
- **Endpoints:**
  - `POST /api/redact` -> runs PHI redaction only (no summarization).  
- Calls `redactNote` in `redactController.js`, which internally prefers Philter and falls back to local regex redaction rules.
- [Redact Routes File](../server/routes/redactRoutes.js)

### `routes/accountRoutes.js`

- **Mount path:** `/api/users`  
- **Endpoints:**
  - `POST /api/users` -> create account (Auth0 + Mongo).  
  - `GET /api/users` -> list all accounts (requires login).  
  - `GET /api/users/:id` -> get single account (requires login).  
  - `PATCH /api/users/:id` -> update account (requires login).  
  - `DELETE /api/users/:id` -> delete account (requires login; treated as admin only in practice).  
- Uses `requireLogin` middleware to ensure only authenticated users with valid sessions can reach these endpoints.
- [Account Routes File](../server/routes/accountRoutes.js)

### `routes/auditRoutes.js`

- **Mount path:** `/api/audit`  
- **Endpoints:**
  - `GET /api/audit/logs` -> admin view of JSON audit log lines (requires admin).  
  - `POST /api/audit/log` -> manual/frontend audit entry creation.  
- Uses `requireAdmin` to restrict access to logs and `AuditLogService` for writing log entries.
- [Audit Routes File](../server/routes/auditRoutes.js)

### `routes/sessionRoutes.js`

- **Mount path:** `/api/session`  
- **Endpoints:**
  - `GET /api/session/status` -> returns whether the current browser has a valid session and, if so, basic user info.
- [Session Routes File](../server/routes/sessionRoutes.js)

### `routes/uploadRoutes.js`

- **Mount path:** `/api/upload`  
- Handles multi-file upload via `multer`, extracts text, and stores a lightweight `uploadedNotes` array in the session for later pipeline processing (no raw PHI is persisted to Mongo).
- [Upload Routes File](../server/routes/uploadRoutes.js)

### `routes/authRoutes.js`

- **Mount path:** `/` (Auth0-facing routes)  
- **Endpoints:**
  - `GET /callback` -> Auth0 callback; uses `authController.handleAuthCallback`.  
  - `GET /login` -> dev login page or redirects to Auth0 login in standard mode.  
  - `GET/POST /logout` -> clears session and calls Auth0 logout when configured.
- [Auth Routes File](../server/routes/authRoutes.js)  

---

## Controllers Layer

The controllers contain the core business logic for each route group.

### `controllers/summaryController.js`

- Normalizes note input from JSON or raw text (`normalizeNote`).  
- Uses `safeJSON` and `safeJSONadvanced` to parse model outputs into `{ summary, allergies, highlights[], confidence_flags[] }`.  
- Talks to OpenAI or local Ollama via `getAIClient()` and prompt templates to produce structured JSON summaries.
- [Summary Controller File](../server/controllers/summaryController.js)  

### `controllers/redactController.js`

Implements PHI redaction with a layered approach:

- Optional Philter redaction (`philterRedact`) when `PHILTER_ENABLED` is true.  
- Local regex redaction (names, dates, phone, SSN, email, addresses, etc.) as a fallback or non-Philter mode.  

Exposes:

- `redactNote(req, res)` -> Express handler for `/api/redact`.  
- `redactPipeline(body)` -> internal helper for `PipelineManager` that returns `{ redacted_text }`.

- [Redact Controller File](../server/controllers/redactController.js)  

### `controllers/accountController.js`

Integrates Auth0 Management API with local Mongo `Account` model:

- Creates users in Auth0 and then creates a matching Mongo document (including `auth0UserId`).  
- Provides CRUD operations: create, list, fetch-by-id, update (Mongo-only fields), delete.  
- Returns standardized JSON via `sendResponse(...)`.
- [Account Controller File](../server/controllers/accountController.js)  

### `controllers/authController.js`

- `handleAuthCallback` maps Auth0 OIDC user info into a local `Account` (creating one if missing) and stores a trimmed user object in the session as `req.session.user`.  
- `handleLogout` destroys the session, clears the cookie, and calls Auth0 logout with a configured return URL.
- [Auth Controller File](../server/controllers/auditController.js)  

### `controllers/auditController.js`

- `getAuditLogs` reads the `server/logs/audit.log` file, parses JSON lines, and returns the most recent entries to admin users.  
- `logAudit` records manual audit entries via `AuditLogService`.
- [Audit Controller File](../server/controllers/auditController.js)

---

## Middleware

### `middleware/authGuard.js`

- `requireLogin` ensures there is a valid session user (and typically a valid OIDC auth state) before continuing to protected routes such as `/api/users`.

### `middleware/errorHandler.js`

- Centralizes error logging and HTTP status mapping for thrown errors.

### Logging and Audit Middleware

- `utilities/AuditLogService.js` plus `utilities/logHelper.js` implement JSON-line audit logging and structured AI event logs.  
- Summarizer routes call helpers like `logAIStart`, `logAITiming`, `logAISuccess`, and `logAIFailure` around each AI call to capture timing and minimal context without storing full PHI notes.

---

## Models

### `models/Account.js`

Mongoose schema for user accounts, including:

- `firstName`, `lastName`, `username`, `email`, `organization`, `role`, `auth0UserId`, and optional `password`.  

Used both in `accountController` and in `authController`’s login flow to map Auth0 OIDC users into local roles.

- [Account Model File](../server/models/Account.js)

### `models/Summary.js`

Stores a single summarized, *redacted* doctor note:

- `redactedNote` (string)
- `summaryText` (string)
- `allergies` (string or structured text)
- `sourceHighlights` (array)
- `confidenceFlags` (array)

Does **not** store the original full PHI note; only the redacted and summarized forms are persisted.

- [Summary Model File](../server/models/Summary.js)

### `models/AuditLog.js`

Structured audit entries with fields such as:

- `username`, `method`, `endpoint`, `statusCode`, `ip`, `userAgent`, and `message`.

Provides a Mongo-backed alternative or complement to the file-based audit log.

- [Audit Log Model File](../server/models/AuditLog.js)

---

## Pipeline Manager

### `pipeline/PipelineManager.js`

Orchestrates the three main stages for each note:

1. **Validation** – uses an AI classifier via `PromptBuilder` to verify that the input looks like a doctor note and throws custom error codes (e.g., `ERR_NOT_DOCTOR_NOTE`, `ERR_NO_NOTE_TEXT`) if invalid.  
2. **Redaction** – calls `redactPipeline({ note })`, which prefers Philter and falls back to local regex redaction, storing the redacted text in the pipeline results object.  
3. **Summarization** – builds a summarization prompt via `PromptBuilder` and calls the summarizer (OpenAI or local). Persists `summary`, `allergies`, `highlights`, and `confidence_flags` into the pipeline results object.  
4. **Reintegration** – combines the redacted note and the summary to produce a final, cleaned text block for display or export.

- `execute(noteText)` runs the pipeline for a single note and returns an object including `redacted`, `summary`, `allergies`, `highlights`, `confidence_flags`, and `final`.  
- `executeMany(notes)` runs the pipeline for an array of notes and returns an array of result objects (used by multi-file upload).

---

## Prompt Builder

### `prompts/summarizePromptEnhanced.js` and PromptBuilder

- `summarizePromptEnhanced` defines the JSON-only medical summarization instructions, requiring `{ summary, allergies, highlights[], confidence_flags[] }` from the model.  
- The `PromptBuilder` wrapper builds prompts like `buildPrompt({ mode, provider, noteText })`, so future modes (e.g., classification, confidence-only) can be added without changing route logic.

---

## Upload Handlers & Export Services

### Upload Handlers (`routes/uploadRoutes.js`)

- Use `multer` to accept multiple files, extract text for each, and store a minimal `uploadedNotes` array on the session (`[{ id, name, text }, …]`).  
- These are later consumed by `/api/summarize/pipeline/multi`.  
- Raw files are not persisted, and only redacted + summarized outputs are ever written to Mongo.

### Export Services

For this prototype, export endpoints in Swagger (PDF/Word/JSON) are stubs. The architecture reserves space for dedicated export services that take a `Summary` document and generate PDF, Word, or JSON for download without re-exposing raw PHI.

---

## Shared Utilities

### `config/env.js`

- Centralized environment configuration for `AI_MODE`, `APP_MODE`, `SUMMARY_MODE`, and Philter flags.  
- Logs the effective modes at startup and exposes getters for use throughout the backend.

### `config/aiBootstrap.js`

- Prepares the OpenAI client (or local client) at server startup and ensures the first AI call is fast.

### `utilities/AuditLogService.js` and `utilities/logHelper.js`

- Encapsulate JSON-line audit logging and standardized AI event logs so controllers and routes do not need to manually handle file I/O or timestamp formatting.
---
### Data Flow
- The user creates a request by uploading text and clicking the "Redact and Summarize" Button.
- The request is the routed and sent to OpenAI or to the local LLM.
- The request is processed by the LLM, confidential information is redcacted, and the note is converted into a summary.
- The LLM responds to the user's request with the completed summary.

### Narrative
1. The user submits a doctor note into the system.
2. If the note is not a real doctor note, throw a non-doctor note error. Otherwise, continue on to step 3.
3. Redact confidential information from the submitted text.
4. Summarize the doctor note. 
5. Format the output to include additional information such as allergies.
6. Output the summarized doctor note to the output box of the summarizer page.
7. The Audit Log reports that the user has generated a summary.