# API Documentation – Detailed Reference

This document provides the “complete API reference”: routes, methods, inputs, outputs, error codes, authentication notes, and PHI-handling notes.

---

## 1. Overview

The Patient Not Found backend exposes a JSON-based REST API under the base URL:

- **Base URL (local development):** `http://localhost:3000`
- **API root:** most endpoints are prefixed with `/api/*`
- **Interactive docs:** Swagger UI is available at `/api-docs` and is wired to the OpenAPI file in `/server/swagger.yaml`.

All AI endpoints accept either **`application/json`** (recommended) or **`text/plain`** for quick tests. Where appropriate, the backend supports both single-note and multi-note workflows (via session-backed uploads).

---

## 2. Authentication & PHI Handling

### 2.1 Authentication Model

- Authentication is handled via **Auth0** (OIDC) plus Express sessions (`connect.sid`).  
- Authenticated users are stored in `req.session.user` with `id`, `email`, `role`, and `name`.  
- Some routes (e.g., `/api/users/*`, `/api/audit/logs`) are protected by `requireLogin` or admin-only guards.

### 2.2 PHI Handling

Raw notes sent to AI endpoints may contain PHI. The system:

- Redacts PHI using either Philter or our local regex redactor before storing anything to Mongo.  
- Stores only redacted text and structured summaries in the `Summary` collection (no original PHI).  
- Uses audit logs that capture metadata (route, status, timing, username) but **not** raw note contents.

### 2.3 Session & Cookies

- Authentication-protected endpoints rely on the `connect.sid` cookie.  
- Swagger uses a `cookieAuth` security scheme for testing session-protected endpoints inside the UI.

---

## 3. Endpoint Summary

| Category                  | Method | Path                             | Description                                                   | Auth?                    |
|---------------------------|--------|----------------------------------|---------------------------------------------------------------|--------------------------|
| Config                    | GET    | `/api/config`                    | Returns current AI mode (`AI_MODE`).                          | No                       |
| Session                   | GET    | `/api/session/status`           | Returns session status and current user (if logged in).       | No (read-only)           |
| AI – summarize (auto)     | POST   | `/api/summarize`                | Universal summarization entrypoint (OpenAI or local).         | No (intended: logged-in) |
| AI – pipeline (single)    | POST   | `/api/summarize/pipeline`       | Full pipeline: validate -> redact -> summarize -> reintegrate.   | No (intended: logged-in) |
| AI – pipeline (multi)     | POST   | `/api/summarize/pipeline/multi` | Pipeline for multiple notes (upload or JSON array).           | No (intended: logged-in) |
| AI – OpenAI only          | POST   | `/api/summarize/openai`         | Forces OpenAI summarizer regardless of `AI_MODE`.             | No                       |
| AI – redaction only       | POST   | `/api/redact`                   | PHI redaction; returns only redacted text.                    | No                       |
| Accounts                  | POST   | `/api/users`                    | Create user (Auth0 + Mongo).                                  | No (admin-only context)  |
| Accounts                  | GET    | `/api/users`                    | List users (requires login, typically admin).                 | Yes (`requireLogin`)     |
| Accounts                  | GET    | `/api/users/:id`                | Get single user (requires login).                             | Yes (`requireLogin`)     |
| Accounts                  | PATCH  | `/api/users/:id`                | Update user fields (requires login).                          | Yes (`requireLogin`)     |
| Accounts                  | DELETE | `/api/users/:id`                | Delete user (requires login; admin-only in practice).         | Yes (`requireLogin`)     |
| Audit                     | GET    | `/api/audit/logs`               | Read JSON audit log lines (admin only).                       | Yes (`requireAdmin`)     |
| Audit                     | POST   | `/api/audit/log`                | Record manual audit entry.                                    | Yes (logged-in)          |
| Upload                    | POST   | `/api/upload/files`             | Upload 1–5 files, extract note text, store in session.        | No (intended: logged-in) |

Placeholder and stretch-goal endpoints (export, OCR, highlight-only views) are documented in Swagger but may not have full implementations; these are clearly marked with `501 Not Implemented` in the API spec.

---

## 4. Detailed Endpoint Descriptions

### 4.1 `POST /api/summarize` – Universal Summarization

**Description**  
Universal entrypoint for summarization. Chooses OpenAI vs local Phi-4 based on `AI_MODE` and returns a structured JSON summary.

**Request**

- **Headers:**  
  - `Content-Type: application/json` or `text/plain`
- **Body (JSON preferred):**

```json
{
  "note": "Free-text clinical note...",
  "summaryMode": "normal | advanced"
}
```

- `summaryMode` is optional and defaults to the `SUMMARY_MODE` env variable.  
- When sending `text/plain`, the entire body is treated as the note.
- When `SUMMARY_MODE=advanced`, the service attempts to include highlights and confidence_flags; otherwise these arrays may be empty.  

**Response (200 OK)**

```json
{
  "summary": "3–5 sentence clinical summary.",
  "allergies": "List of allergies or empty string.",
  "highlights": [
    {
      "summary_sentence": "...",
      "source_quote": "...",
      "source_location": "sentence X"
    }
  ],
  "confidence_flags": [
    {
      "sentence": "...",
      "confidence": "high | medium | low"
    }
  ]
}
```

These fields are produced by parsing the model output via `safeJSON` / `safeJSONadvanced`, which extract `summary`, `allergies`, `highlights`, and `confidence_flags` from a JSON-only prompt.

**Error Responses**

- `400 Bad Request` – missing note text

```json
{ "error": "Missing note in request" }
```

- `500 Internal Server Error` – AI or parsing failure

```json
{ "error": "Summarization failed" }
```

**Authentication / PHI Notes**

- Auth not enforced at the route level, but intended to be used by logged-in users through the frontend.  
- Incoming notes may contain PHI, but only the summarized text and anonymized alignment metadata are persisted in Mongo; raw inputs are not stored.

---

### 4.2 `POST /api/summarize/pipeline` – Full Pipeline (Single Note)

**Description**  
Runs the full pipeline – note type validation, PHI redaction, summarization, and reintegration – for a single note using `PipelineManager.execute()`.

**Request**

```json
{
  "note": "Doctor note text..."
}
```

**Response (200 OK)**

```json
{
  "redacted": "Redacted version of the note with PHI placeholders.",
  "summary": "Short clinical summary.",
  "allergies": "Allergy section (if any).",
  "highlights": [ /* alignment list as above */ ],
  "confidence_flags": [ /* uncertainty flags as above */ ],
  "final": "Final reintegrated text for display."
}
```

**Error Responses**

- `400 Bad Request` – validation failure (e.g., not a doctor note, no text).  
  Uses custom error codes internally (`ERR_NO_NOTE_TEXT`, `ERR_NOT_DOCTOR_NOTE`) but exposes plain messages.
- `500 Internal Server Error` – any other pipeline failure

```json
{ "error": "Pipeline summarization failed" }
```

**Authentication / PHI Notes**

- Same as `/api/summarize`, but with an additional guarantee: only **redacted** text is propagated into later stages and stored.  
- The pipeline never writes the original note to Mongo; only redacted and summarized forms are saved.

---

### 4.3 `POST /api/summarize/pipeline/multi` – Multi-Note Pipeline

**Description**  
Performs the full pipeline on a collection of notes. Source text can come either from:

- JSON body (`{ notes: [...] }`), or  
- `req.session.uploadedNotes` (set by `/api/upload/files`).

**Request (JSON)**

```json
{
  "notes": [
    { "id": "file1", "name": "note1.txt", "text": "Note text #1" },
    { "id": "file2", "name": "note2.txt", "text": "Note text #2" }
  ]
}
```

**Response (200 OK)**

```json
{
  "results": [
    {
      "index": 0,
      "fileId": "file1",
      "fileName": "note1.txt",
      "redacted": "...",
      "summary": "...",
      "allergies": "...",
      "highlights": [ ... ],
      "confidence_flags": [ ... ],
      "final": "...",
      "error": null
    },
    {
      "index": 1,
      "fileId": "file2",
      "fileName": "note2.txt",
      "redacted": "...",
      "summary": "...",
      "allergies": "...",
      "highlights": [ ... ],
      "confidence_flags": [ ... ],
      "final": "...",
      "error": null
    }
  ]
}
```

**Error Responses**

- `400 Bad Request` – no notes provided

```json
{
  "error": "No notes provided. Upload files first or send { notes: [{id, name, text}, ...] }."
}
```

- `500 Internal Server Error` – multi-file pipeline failure

```json
{ "error": "Multi-file pipeline failed" }
```

**Authentication / PHI Notes**

- Multi-file requests may contain PHI in both the uploaded files and JSON body.  
- As with single-note pipeline, only redacted and summarized outputs are stored; `uploadedNotes` live only in the session and are not persisted to Mongo.

---

### 4.4 `POST /api/redact` – Redaction Only

**Description**  
Runs PHI redaction on a single note and returns only the redacted text.

**Request**

```json
{ "note": "Doctor note text..." }
```

**Response (200 OK)**

```json
{ "redacted": "Note with PHI removed or replaced." }
```

**Error Responses**

- `400 Bad Request` – invalid or missing note text

```json
{ "error": "Invalid or missing note text." }
```

- `500 Internal Server Error` – internal redaction failure

```json
{ "error": "Internal redaction failure." }
```

**Authentication / PHI Notes**

- No authentication required in the prototype.  
- Route is designed to be safe because the response only includes PHI-stripped content.

---

### 4.5 `GET /api/session/status` – Session Status

**Description**  
Returns whether the current request has a valid authenticated session, combining Express session and Auth0 OIDC state.

**Response (200 OK)**

When logged in:

```json
{
  "loggedIn": true,
  "user": {
    "id": "...",
    "email": "...",
    "role": "Doctor",
    "name": "User Name"
  }
}
```

When not logged in:

```json
{
  "loggedIn": false,
  "message": "No active session"
}
```

**Auth / PHI Notes**

- Read-only, does not touch PHI.

---

### 4.6 `GET /api/config` – AI Mode

**Description**  
Returns the current AI mode (`openai` or `local`) so the frontend can label the summarizer appropriately.

**Response (200 OK)**

```json
{ "AI_MODE": "openai" }
```

**Auth / PHI Notes**

- Public and does not handle PHI.

---

### 4.7 `POST /api/users` and Related Account Routes

#### `POST /api/users` – Create Account

**Input**

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "username": "bingo",
  "password": "test123",
  "email": "jane@example.com",
  "organization": "Marist University",
  "role": "Doctor"
}
```

**Behaviour**

1. Creates a user in Auth0 via the Management API.  
2. Creates a local `Account` document with `auth0UserId` pointing at the Auth0 user.

**Success (201 Created)**

```json
{
  "success": true,
  "message": "Account created successfully",
  "account": {
    "_id": "...",
    "firstName": "Jane",
    "lastName": "Doe",
    "username": "bingo",
    "email": "jane@example.com",
    "organization": "Marist University",
    "role": "Doctor"
  }
}
```

**Error Responses**

- `400 Bad Request` – Auth0 signup error or validation error  
- `409 Conflict` – duplicate username (if enforced)  
- `500 Internal Server Error` – generic server error

#### `GET /api/users` – List Accounts

- Protected by `requireLogin`.  
- Returns an array of account objects (password omitted).

#### `GET /api/users/:id` – Get Account Info

- Protected by `requireLogin`.  
- Returns one account (password omitted) or `404` if not found.

#### `PATCH /api/users/:id` – Update Account

- Protected by `requireLogin`.  
- Allows updates to selected fields; explicitly forbids direct changes to `password`, `username`, and `auth0UserId`.

#### `DELETE /api/users/:id` – Delete Account

- Protected by `requireLogin`.  
- Deletes the Mongo record (Auth0 deletion is a future enhancement).

---

### 4.8 `GET /api/audit/logs` and `POST /api/audit/log`

#### `GET /api/audit/logs` – Admin Audit View

- Protected by an admin guard.  
- Reads up to 200 most recent JSON lines from `server/logs/audit.log`, reverses them (most recent first), and returns:

```json
{
  "success": true,
  "count": 10,
  "logs": [ /* log entries */ ]
}
```

- On error (file missing or unreadable), returns status 500:

```json
{
  "success": false,
  "error": "Unable to read audit log file."
}
```

#### `POST /api/audit/log` – Manual Audit Entry

**Request Body**

```json
{
  "type": "manual",
  "message": "Something happened...",
  "context": "frontend"
}
```

**Behaviour**

- Creates an entry with caller’s username, IP, and `userAgent` and appends it to the audit log via `AuditLogService`.

**Success (200 OK)**

```json
{
  "success": true,
  "message": "Audit entry recorded successfully."
}
```

---

### 4.9 Upload & Placeholder Endpoints

#### `POST /api/upload/files` – Multi-File Upload

- Accepts up to 5 text or document files.  
- Extracts text and stores a session-level `uploadedNotes` array.  
- No PHI is persisted to Mongo from this route; it is only used as input to `/api/summarize/pipeline/multi`.

#### Placeholder / Export Endpoints

The Swagger file also documents future endpoints such as:

- `GET /api/summaries/{id}/export/pdf`
- `GET /api/summaries/{id}/export/word`
- `GET /api/summaries/{id}/export/json`
- `GET /api/summaries/{id}/highlight`
- `GET /api/summaries/{id}/confidence`
- `POST /api/ocr`

These endpoints are either partially implemented or stubbed. In the prototype they return `501 Not Implemented` and exist mainly to show the intended future shape of the API.
