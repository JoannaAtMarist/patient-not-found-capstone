# Capping Project: 404 Patient Not Found

---  
## Table of Contents

- [Capping Project: 404 Patient Not Found](#capping-project-404-patient-not-found)
- [Team Members](#team-members)
- [1. Project Overview](#1-project-overview)
  - [1.1. Abstract](#11-abstract)
  - [1.2. Motivation](#12-motivation)
  - [1.3. Objectives](#13-objectives)
  - [1.4. Scope](#14-scope)
- [2. Background and Research](#2-background-and-research)
- [3. System Design and Architecture](#3-system-design-and-architecture)
  - [3.1. Functional Requirements](#31-functional-requirements)
  - [3.2. Non-Functional Requirements](#32-non-functional-requirements)
  - [3.3. Use Cases, User Stories, User Personas](#33-use-cases-user-stories-user-personas)
  - [3.4. System Architecture](#34-system-architecture)
  - [3.5. Technology Stack](#35-technology-stack)  
  - [3.6. Security, Privacy, and Compliance](#36-security-privacy-and-compliance)
    - [3.6.1 Security Controls Not Implemented (Prototype Limits)](#361-security-controls-not-implemented-prototype-limits)
- [4. Data Design](#4-data-design)
- [5. Implementation Details](#5-implementation-details)
  - [5.1. Development Methodology](#51-development-methodology)
  - [5.2. Core Features](#52-core-features)
  - [5.3. API Documentation](#53-api-documentation)
  - [5.4. Repository Structure](#54-repository-structure)
- [6. Testing and Quality Assurance](#6-testing-and-quality-assurance)
  - [6.1. Testing Approach](#61-testing-approach)
  - [6.2. Sample Test Case](#62-sample-test-case)
  - [6.3. Tools](#63-tools)  
  - [6.4. Automated Testing Gaps and Next Steps](#64-automated-testing-gaps-and-next-steps)
- [7. Deployment](#7-deployment)
  - [7.1. Setup and Installation](#71-setup-and-installation)
  - [7.2. Environment Variables](#72-environment-variables)
  - [7.3. Deployment Notes](#73-deployment-notes)
- [8. Results and Evaluation](#8-results-and-evaluation)
  - [8.1. Acceptance Criteria](#81-acceptance-criteria)  
  - [8.2. System Evaluation Summary (Rubric-Based)](#82-system-evaluation-summary-rubric-based)
  - [8.3. Areas for Improvement (Based on Evaluation Feedback)](#83-areas-for-improvement-based-on-evaluation-feedback)
- [9. Lessons Learned](#9-lessons-learned)
- [10. Future Work](#10-future-work)  
  - [10.1 Improvements Based on Evaluation Feedback](#101-improvements-based-on-evaluation-feedback)
- [11. Appendices](#11-appendices)
- [12. References](#12-references)
- [13. Acknowledgments](#13-acknowledgments)
- [14. Project Timeline](#14-project-timeline)

---

## Team Members
| Name | Role | 
|------|------|
| Joanna Picciano | Project Manager / Backend Developer | 
| Patrick Daileg | Frontend Developer / Testing Lead | 
| Alondra Trejo Palma | Frontend Developer | 
| Samuel Wu | Testing Support / Developer | 
| Faculty Advisor | Professor Juan Arias | 
---

## 1. Project Overview

### 1.1. Abstract
The 404 Patient Not Found system is a prototype web application that generates AI-assisted summaries of clinical notes. Doctors can type or upload notes, receive a redacted and structured summary, edit the output, and export it as PDF or Word. The system is designed for educational purposes using synthetic or de-identified data and does not attempt full HIPAA compliance.  
Technologies include Node.js/Express, a modern JavaScript frontend, cloud-based AI APIs, basic authentication with password reset, and an audit logging system.  
The expected outcome is a functional demonstration of automated summarization, redaction, and simple workflow support for healthcare documentation tasks, highlighting feasibility and limitations within a capstone-level project.  

### 1.2. Motivation
Clinical documentation is time-consuming, especially for providers managing large patient loads. AI summarization tools can help reduce administrative burden, but many systems are expensive or not customizable for academic environments.  
This project explores how AI can assist in summarizing de-identified medical notes while maintaining privacy constraints and providing user-editable output. The prototype supports both student learning and evaluation of potential workflows for future healthcare applications.  

### 1.3. Objectives
- Allow doctors to input or upload clinical notes.  
- Generate AI-based summaries within 10 seconds.  
- Provide redaction so only non-PHI summaries are stored.  
- Enable summary editing and PDF/Word export.  
- Support basic authentication, password reset, and role handling.  
- Maintain audit logs of logins and summary-generation events.  
- Produce ≥80% recall of key clinical concepts such as diagnoses, medications, and allergies.  

### 1.4. Scope
The system provides note input, AI summarization, redaction, editable output, and export options. It includes login, password reset, and an admin role for system oversight.  
Out of scope: full HIPAA compliance, real patient data, EHR integration, multi-clinic scaling, advanced accessibility, model retraining, and high-availability deployment.  

---  

<br>  

## 2. Background and Research  

#### Joanna Picciano:  
 [Research Topics](../docs/official/research/Joanna%20Picciano%20-%20Research.md) 

#### Patrick Daileg:  
 [Research Topics](../docs/official/research/Patrick%20Daileg%20-%20Research%20Topics.pdf) 

#### Alondra Trejo Palma:
  [Research Topics](../docs/official/research/Alondra%20Trejo%20-%20ResearchTopics.pdf)

#### Samuel Wu:  
 [Research Topics](../docs/official/research/Samuel%20Wu%20-%20Research%20Topics.pdf)  

---  

<br>  

## 3. System Design and Architecture

### 3.1. Functional Requirements  
Full detailed functional requirements are documented in:  
 [Requirements Document v1.1](../docs/official/project-plan/requirements/requirements-document-v1.1.md)  
 This includes all core system behaviors, feature definitions, and verification methods.  

### 3.2. Non-Functional Requirements  
See full NFR list in:  
 [Requirements Document v1.1](../docs/official/project-plan/requirements/requirements-document-v1.1.md)  
 This includes performance, usability, accessibility, and authentication requirements.  

### 3.3. Use Cases, User Stories, User Personas  

[Use Cases](../docs/official/404PNF_use_cases.pdf)  
  
[User Personas - Ally](../docs/user/user-persona-ally.pdf)

[User Personas - John](../docs/user/user-persona-john.pdf)

[User Personas - Lydia](../docs/user/user-persona-lydia.pdf)



### 3.4. System Architecture
The system follows a simple client–server model.  
The frontend sends note text or uploaded files to the backend, which processes input through a multi-stage pipeline: normalization, optional file parsing, AI summarization, redaction, post-processing, and structured output.   
Authentication and sessions control access, while an audit logging service records user activity. Summaries are returned to the browser and not stored in MongoDB; optional audit logs capture metadata only (no PHI text).  

1. See Source Text Highlighting & Confidence Flags — Clinician Guide for how alignment and confidence metadata are presented to users:  
[Source Text Highlighting & Confidence Flags](../docs/official/features-highlights-confidence.md)  

2. System Architecture Diagram:  
[System Architecture Diagram](../docs/official/3.4%20System%20Architecture%20diagram.png)  

3. System Architecture Component Breakdown:  
[System Architecture Component Breakdown](../docs/official/system-architecture-reference.md)  

 


### 3.5. Technology Stack

| Layer     | Technology                                                                 |
|---------- |-----------------------------------------------------------------------------|
| Frontend  | Vanilla HTML/CSS/JS (Patrick’s layout), tabbed “new-summarizer” UI         |
| Identity  | **Auth0** + `express-openid-connect` middleware                             |
| Backend   | **Node.js + Express**, OpenAI API client, routes for `/api/summarize/*`     |
| Sessions  | `express-session` + **`connect-mongo`** (Mongo-backed session store)        |
| Database  | **MongoDB** via **Mongoose** (accounts + audit metadata only; no PHI)       |
| Parsing   | `multer` (uploads), `pdf-parse` (PDF), `mammoth` (DOCX)                     |
| Docs/API  | Swagger UI (`swagger-ui-express` + `yamljs`)                                |
| Security  | CORS, `dotenv` for secrets, bcryptjs for local hashes as needed             |
| Tooling   | GitHub & Projects, Postman; prototype hosting (Render); Node fetch          |
| Modes     | `AI_MODE` (openai/local), `SUMMARY_MODE` (normal/advanced), `APP_MODE`      |


> Image: [Tech Stack](../docs/official/tech%20stack.png)  


### 3.6. Security, Privacy, and Compliance

- **PHI handling and redaction**  
Handled by fallback code (or Philter). Redacts sensitive patient information (such as their real name).  

- **Authentication and authorization**  
Account creation, password hashing, password reset tokens and authentication are all handled by Auth0.  

- **Session management**  
Sessions are created when a user logs in to the system. Sessions are cleared after the tab is closed or if the user logs out.  

- **Data in transit**  
Redacted doctor notes are sent to OpenAI and LLM's for summarization. Sensitive information is not leaked to the best of the application's abilities.  

- **Data at rest**   
Since Doctor note summaries are not stored within this application, just an extra security for HIPAA information, it is fully destroyed after session ends.  

- **Third-party services**  
This Application uses: Auth0, MongoDB, OpenAI, phi4-mini.  


### 3.6.1 Security Controls Not Implemented (Prototype Limits)

This system is a capstone prototype intended for demonstration and educational use. The following controls are *not* implemented to a production or HIPAA-aligned standard:

- **Not HIPAA compliant / no BAA**  
  The project is not designed or validated as a HIPAA-compliant medical system and should not be used with real PHI.

- **Incomplete end-to-end PHI guarantees**  
  The system is designed to minimize PHI exposure (redaction-first approach), but it cannot guarantee perfect detection/redaction or perfect model behavior.

- **Limited “user access logging” coverage**  
  Audit logging exists, but it is not yet comprehensive for all user actions (e.g., full read access trails, export/download events, admin actions, and granular UI events).

- **Security requirements coverage gaps**  
  Some security and access-logging requirements discussed earlier in planning are not fully represented as explicit requirements and verification steps.

- **No formal threat modeling / pen testing**  
  The project does not include a formal threat model, penetration testing, or security audit.

- **Hardening and compliance features not completed**  
  Items such as encryption-at-rest validation, retention policies, least-privilege reviews, and production monitoring/alerting would be required for real deployment.

---  

<br>  

## 4. Data Design  

### 4.1. ER Diagram  
[ER Diagram](../docs/official/diagrams/Database_ER%20_diagram.pdf) 

### 4.2.  Database Schema  
[Schema](../docs/official/diagrams/schema.pdf)  

### 4.3. External Datasets & APIs  

#### Datasets  
- No third-party datasets are used.  
- Test notes in /tests/data/* are synthetic. Production notes are user-supplied at runtime.  
- PHI handling: notes are processed in memory; raw note text is not stored in the database or logs. Audit logs contain metadata only (user, route, timestamps).    

#### APIs  
- **OpenAI Chat Completions** (when `AI_MODE=openai`)
  - Purpose: redaction + summarization.
  - Data sent: redacted or minimally necessary note text plus prompt instructions; never logs PHI.
  - Key env vars: `OPENAI_API_KEY`, `AI_MODE`, `SUMMARY_MODE` (`normal|advanced`), timeouts.
  - Behavior: retries + timeouts at the route level; if advanced fields (`highlights`, `confidence_flags`) aren’t returned, UI falls back to client heuristics.  
- **Auth0 (OIDC via express-openid-connect)**    
  - Purpose: authentication (login/logout), user profile claims.
  - Flow: standard hosted login; session persisted via `express-session` + `connect-mongo`.
  - Key env vars: `AUTH0_ISSUER_BASE_URL`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `SESSION_SECRET`.
  - Scopes: `openid profile email`. No direct Management API usage for this prototype.  

#### Local/Offline Option  
Local LLM (when `AI_MODE=local`) routes summarization to a local model (e.g., phi4) instead of OpenAI; no external network calls.  

#### Privacy & Security Notes  
- No PHI is written to MongoDB or logs.  
- Exports (PDF/DOCX) are user-initiated; server does not retain generated files after response.  
- All secrets live in `.env` (never committed). Use `.env.example` for documentation.  

---  

<br>  

## 5. Implementation Details

### 5.1. Development Methodology
The team followed a lightweight Agile approach with weekly goals aligned to course milestones. Work was tracked using GitHub Issues and a Project Board. Each team member maintained a personal branch, and merges occurred after review. Development was iterative, with early prototypes guiding refinements to summarization, UI, and authentication features. 

The backend did not start completely from scratch. Joanna used her CMPT 221 Software Development II project as a structural skeleton for this application (Picciano, 2024). Specifically,
she reused the overall `server.js` outline (Express setup, routing pattern) and the basic separation
into controllers and models. For the capstone, these pieces were refactored and extended to support
new requirements. 


### 5.2. Core Features  
- Typed and file-based note input (PDF/DOCX).  
- AI summarization using cloud LLMs (internet required).   
- Redaction and PHI-safe output; UI shows HIPAA warning text (awareness only).    
- Editable summary panel (in-place editing after generation).   
- PDF, Word, and JSON export.  
- Basic authentication via Auth0; password reset supported as requirement (workflow).   
- Audit logging for login and summary events (incl. pipeline calls).    
- Source Text Highlights (maps summary phrases to note text). _(Now implemented; was a stretch goal.)_  
- Confidence Flags (marks low-confidence sentences or weak matches). _(Now implemented; was a stretch goal.)_   
- Advanced mode toggle from backend (`SUMMARY_MODE=advanced`) to surface highlight/flag metadata when available.  


### 5.3. API Documentation

API Reference: [API Reference Documentation](../docs/official/api-reference.md)  

### 5.4. Repository Structure  


```
Project Structure

├─ client/                    # Frontend (Patrick’s final layout)
│  ├─ guide/                  # Static guides or onboarding notes for users
│  ├─ src/                    # Static assets served by Express
│  │  ├─ css/                 # Stylesheets (style.css, help.css, navigation.css, new-summarizer.css)
│  │  ├─ images/              # Logos, icons, illustrations
│  │  └─ js/                  # Client scripts (new-summarizer.js, navigation.js, global.js)
│  └─ views/                  # HTML pages (new-summarizer.html, help.html)

├─ docs/                      # Project documentation
│  ├─ dev/                    # Engineering docs (in-progress notes)
│  │  ├─ pre-development/     # Early brainstorming and planning
│  │  │  ├─ pp-legos/         # “Paper prototype” Lego flow ideas / diagrams
│  │  │  └─ ui-mockups/       # Wireframes and mockups
│  │  └─ resources/           # Reference material for developers
│  ├─ official/               # Deliverables for grading / sharing
│  │  ├─ diagrams/            # Architecture, flow, ER, and pipeline diagrams
│  │  ├─ presentations/       # Slide decks (weekly status, final)
│  │  ├─ project-plan/        # Plan, timeline, and progress artifacts
│  │  │  └─ requirements/     # Requirements questionnaire + updates
│  │  └─ research/            # Literature and tooling research notes
│  └─ user/                   # End-user help (how-to, screenshots, FAQs)

├─ scripts/                   # Currently only contains swagger.yaml

├─ server/                    # Express backend
│  ├─ config/                 # Auth0, sessions, CORS, and environment setup
│  ├─ controllers/            # Route handlers (thin controllers)
│  ├─ errors/                 # Error classes and error mappers
│  ├─ logs/                   # Audit logs and server log output (rotated/filtered)
│  ├─ middleware/             # Express middleware (auth guards, rate limits, etc.)
│  ├─ models/                 # Mongoose schemas (User, AuditLog, …) – metadata only, no PHI
│  ├─ pipeline/               # Summarization pipeline orchestrators
│  ├─ prompts/                # LLM prompts (summarize, redact, advanced mode)
│  ├─ routes/                 # API routes (/api/summarize, /api/summarize/pipeline, auth, redact)
│  ├─ utilities/              # Logging helpers, AuditLogService, parsers (pdf-parse, mammoth), etc.
│  └─ server.js               # App entry (Express + Auth0 + sessions + Swagger UI)

├─ tests/                     # Test data and templates (no PHI)
│  ├─ data/
│  └─ templates/              # Test harness templates or fixtures
│
├─ .env                       # Runtime secrets (NOT committed) – use .env.example
├─ .gitignore                 # Git ignore rules
├─ README.md                  # Repo landing readme (pointers to /docs)
├─ docker-compose.yml         # Optional containers (MongoDB, etc.)
├─ package.json               # Node package manifest
└─ package-lock.json          # Lockfile  
```  
Link to file: [Repository Structure](../docs/official/repository-structure.md)  

### 5.5. Project Management Artifacts
The project was managed using GitHub Projects and weekly sprint planning. Key planning documents include:
* [Final Project Retrospective](../docs/project-management/Final_Project_Retrospective.md) (Post-Mortem & Scope Analysis)
* [Team Roles & Contributions Matrix](../docs/project-management/Team_Roles_Matrix.md)
* [Initial Work Breakdown Structure](../docs/project-management/Initial_WBS.md)  

---  

<br>  

## 6. Testing and Quality Assurance
[Testing Document](../docs/dev/404pnf_testing_doc.pdf)

### 6.1. Testing Approach

**Unit Testing** - Testing is done during development of a new feature. If a bug or critical flaw is found, it is reported on the Bug Board of GitHub Issues. Once the issue has been remedied, it will be continuously tested until everything works as expected. 

**Integration Testing** - Integration is when a major feature is in the process of being implemented. Previous features will be tested to ensure that the new feature does not break previously implemented and completed features.

**User Testing** - When our public demo was released, allowing people who are not directly involved in the project to test the program and discuss what they like/do not like about the system. Feedback will be used to improve the system to ensure that it meets user standards.

All in all, testing is a rolling assignment. Testing occurs during, and even after development, to ensure that the end product meets requirements.

### 6.2. Test Cases 


|Test ID|Description|Input|Expected Output|Result|
|-------|-----------|-----|---------------|------|
|TC-01|Login with valid credentials|Username and Password|Dashboard|Pass|
|TC-02|Login with incorrect credentials|Invalid Username and Password|Error|Pass|
|TC-03|Account Creation|Fill Out All Fields, Valid Email|Valid Account, able to log in|Pass|
|TC-04|Password Reset|email, new password|User is able to log in after resetting password|Pass|
|TC-05|Account Settings (Save and Quit)|Changing info in applicable fields|Saved new information to server|Fail|
|TC-06|Account Settings (Quit Without Saving)|Changing info in applicable fields|Undo changes to Account|Pass|
|TC-07|Navigation Bar|User's first and last name + role|Full Name and role displayed|Pass|
|TC-08|Summary Generation|Uploaded file/Text Input|AI Generates a Summary|Pass|
|TC-09|Edit Summary|Edits to summary|User-Edited Summary|Pass|
|TC-10|Download Functions|Click PDF or DOC Download Button|Downloaded file on user's computer|Pass|

### 6.3. Tools  
- GitHub (For sharing our work between our group)
- GitHub Issues (Progress Tracking)
- Swagger (Route Testing)
- Postman (Route Testing)
- Render (Public Demo Deployment)
- Multer
- PDF-Parse, Mammoth (For converting PDF or DOC file input into plain text)


### 6.4. Automated Testing Gaps and Next Steps

The project includes structured testing practices and tools, but the current testing approach is more manual and integration-driven than fully automated. The following gaps were identified during evaluation:

- **Limited automated coverage**  
  Automated tests do not yet cover a broad range of routes, edge cases, and pipeline failure modes.

- **AI-provider dependency**  
  Some behaviors are hard to test repeatably without stable mocks/stubs for external AI APIs and local model outputs.

- **Inconsistent response format testing**  
  There is not yet a single automated suite verifying consistent success/error response envelopes across all endpoints.

- **UI regression testing not established**  
  There is no automated UI regression layer (smoke tests, accessibility checks, or snapshot tests) for the frontend.

Planned improvements:
- Add **route-level integration tests** for core endpoints (upload -> parse -> pipeline -> export).
- Add **unit tests** for pipeline stages (validation, redaction, summarization, reinsertion).
- Introduce **mock AI providers** for deterministic pipeline testing.
- Add **contract tests** to enforce consistent API response formats and error codes.
- Add a minimal **CI test gate** (run tests on PR) to prevent regressions.

---  

<br>  

## 7. Deployment

### 7.1. Setup and Installation
Installation Guide: [Startup Guide](../docs/dev/startup-guide.md)  
Dependencies: [Dependencies List](../docs/dev/dependencies.md)


### 7.2 Environment Variables

Create a local `.env` from `.env.example` (never commit `.env`).  
Use **APP_MODE=prototype** for the Render demo; **APP_MODE=standard** for the “real site” locally.

**Required (all modes)**
- `AI_MODE` = `openai` | `local`
- `SUMMARY_MODE` = `normal` | `advanced`  *(advanced enables highlights/flags when available)*
- `APP_MODE` = `standard` | `dev` | `prototype`
- `PORT` (default 3000)

**Backend & Auth**
- `MONGO_URI` — Mongo connection string (no PHI stored; metadata only)
- `AUDIT_DB_MODE` — `true|false` to enable Mongo-backed audit logs
- `SESSION_SECRET` — long random string
- `OPENAI_API_KEY` — when `AI_MODE=openai`
- `AUTH0_ISSUER_BASE_URL`, `AUTH0_DOMAIN`, `AUTH0_BASE_URL`,
  `AUTH0_CLIENT_ID`, `AUTH0_SECRET`, `AUTH0_LOGOUT_REDIRECT`

**Optional (admin tooling only; omit from deployed app if unused)**
- `AUTH0_MGMT_CLIENT_ID`, `AUTH0_MGMT_CLIENT_SECRET`, `AUTH0_MGMT_AUDIENCE`

#### `.env.example` (sanitized)
```ini
# === AI ===
# openai | local
AI_MODE=openai
# normal | advanced (advanced enables highlights/flags if available)`
SUMMARY_MODE=advanced

# === App Mode ===
# standard = real site (Auth0 + Mongo + sessions)
# dev      = local-only simplified auth flow, still uses Mongo + sessions
# prototype= Render demo (not for clinical use)
APP_MODE=standard

# === MongoDB ===
# Format: mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority

# If true, audit logs go to Mongo (metadata only, no PHI)
AUDIT_DB_MODE=false

# === OpenAI ===
# Only required when AI_MODE=openai
OPENAI_API_KEY=sk-<your-key>

# === Auth0 (OIDC via express-openid-connect) ===
AUTH0_ISSUER_BASE_URL=https://<your-tenant>.us.auth0.com
AUTH0_DOMAIN=<your-tenant>.us.auth0.com
# e.g., http://localhost:3000 for local; https://your-app.onrender.com for Render
AUTH0_BASE_URL=http://localhost:3000
AUTH0_CLIENT_ID=<public-client-id>
# App/session secret used by express-openid-connect (treat as sensitive)
AUTH0_SECRET=<long-random-string>
# Post-logout redirect URL (must be allowlisted in Auth0)
AUTH0_LOGOUT_REDIRECT=http://localhost:3000/landing

# === Auth0 Management API (optional; use only in admin scripts) ===
# Keep these out of frontend and production app containers when not needed.
AUTH0_MGMT_CLIENT_ID=<m2m-client-id>
AUTH0_MGMT_CLIENT_SECRET=<m2m-client-secret>
AUTH0_MGMT_AUDIENCE=https://<your-tenant>.us.auth0.com/api/v2/

# === Sessions ===
# Long, random string; rotate if exposed
SESSION_SECRET=<another-long-random-string>

# === Server ===
PORT=3000  
 ```

For full details on how APP_MODE affects routing, login, sessions, and MongoDB,
see the complete guide:  
[APP_MODE Guide](../docs/dev/app_mode-guide.md)  

 

### 7.3 Deployment Notes

**Hosting (Prototype / User Testing Only)**
- Deployed to **Render** from GitHub (no Docker/CI pipeline).
- URL: https://four04pnf-x47x.onrender.com  *(prototype environment; not for clinical use)*  
- Purpose: usability feedback and team demos; **not** an official or HIPAA-aligned release.
- Data handling in prototype:
  - Test notes are synthetic; user-supplied notes are processed in memory and not persisted.
  - Audit logs record metadata only (user, route, timestamps); no PHI is logged.
  - Secrets via `.env` in Render dashboard; no keys committed to the repo.

**Known Prototype Limits**
- No BAA/HIPAA controls, no EHR integration, no VPN/VPC isolation.
- No guaranteed uptime/SLA; manual deploys via Render dashboard.
- Rate limiting and monitoring are minimal (sufficient for class demos only).

**If moving to Production (Outline)**
- **Hosting**: containerized on a HIPAA-eligible platform (e.g., AWS/GCP/Azure) with VPC, private subnets, WAF, and load balancer.
- **Identity**: enterprise SSO (OIDC/SAML) with role claims; enforce MFA; session store hardened.
- **EHR Integration**: SMART on FHIR / HL7 interfaces; patient context launch; read-only scope to start.
- **Data & PHI**: zero-retention by default; encrypted at rest (KMS) and in transit (TLS 1.2+); signed BAAs with all vendors (LLM, hosting).
- **Observability**: structured audit logs, SIEM forwarding, alerts (uptime, error rate, latency).
- **Pipeline**: Dockerfile + CI/CD (build, test, SCA, IaC scan); secrets in a vault (not env files).
- **Compliance**: risk assessment, access reviews, disaster recovery (RTO/RPO), and formal incident response.

> Summary: The Render site is a **prototype for user testing only**. A real deployment would occur inside a healthcare organization’s environment (or a HIPAA-eligible cloud), integrated with EHR systems and backed by full security/compliance controls.

---  

<br>  

## 8. Results and Evaluation

**What Features Work Reliably?**
|Goal|Achieved|Evidence|
|----|--------|--------|
|_Login and Logout_|✅|Able to login and logout|
|_Password Reset_|✅|Users are able to reset their password via Auth0 email verification|
|_Navigation Bar_|✅|Settings and Help page are linked properly, name and role tag display user info properly|
|_HIPAA Warning_|✅|Displays every time the Home Menu is accessed, can be dismissed via a button|
|_Admin Dashboard_|✅|Admins can view the Audit Log via the Admin Dashboard, inaccessible to other users|
|_Summary Generator_|✅|Users are able to generate summaries from uploaded files or pasted text|
|_Summary Editor_|✅|Users can edit a generated summary, undo their changes, and download summaries to their computer.|

**What Features Were Scrapped or Do Not Work As Intended?**
|Goal|Achieved|Evidence|
|----|--------|--------|
|_Account Settings_|❌|Unable to save account changes|  
*Note: This was a new limitation brought about by switching to Auth0 with limited time left.  

**Summarizer Accuracy**
|Goal|Achieved|Evidence|
|----|--------|--------|
|_80% Accuracy_|❌|69% Accuracy, Please see [Patrick and Sam's Testing Report](../docs/official/dataset%20and%20recall%20accuracy.pdf)|

**Redaction Consistency**

Known Issues:
- May redact names of objects, or any two words that the AI may think of as a name of a person (e.g. Pepto Bismol).  
- May have issues redacting the entirety of someone's name (e.g. Linda-Jeane Chandler may result in Linda-[REDACTED NAME]).  
- May miss allergies.  

*Note: The first two issues are from the fallback redactor; upgrade to Philter may solve the inconsistencies.  

**Performance**
|Goal|Achieved|Evidence|
|----|--------|--------|
|_OpenAI Summarizes around 10 seconds or less_|✅|[Time Table](../docs/official/testing%20time%20table.png)|

**Workflow Stability**
|Goal|Achieved|Evidence|
|----|--------|--------|
|_No Broken Pages_|✅|All important pages are linked together|
|_Edit Function_|✅|Users can edit summaries|
|_Undo Function_|✅|Users can undo changes to a summary and start fresh|

**Known Limitations**
- Summarization and Redaction require a dedicated GPU if using a local LLM.  
- Summary generator may hallucinate or miss information when generating a summary.  
- AI may be slow depending on notes uploaded, or if you overload it with concurrent notes.  
- Highlights and Confidence Flags feature increase summary generation time.  


### 8.1. Acceptance Criteria:  

- A doctor can log in and upload or type notes.  
- AI generates summaries within ~10 seconds.  
- Summaries are editable and exportable (PDF/Word).  
- The system supports multiple doctor/admin logins.  
- Summaries achieve at least 80% recall for key clinical concepts.  
- No PHI is stored; summaries stay in the browser, and only PHI-free audit metadata is logged.    


### 8.2. System Evaluation Summary (Rubric-Based)

Strengths:
- **Fulfillment of purpose:** Delivers a functional prototype for clinical note summarization and redaction with clear scope limitations (demo-only).
- **Coding structure:** Clear separation of concerns across routes/controllers/middleware/services and a modular AI workflow.
- **Internal documentation:** Architecture and API documentation are a notable strength; materials are organized and readable.
- **Overall project quality:** Strong educational value and broad feature coverage for a capstone prototype.

Areas noted for improvement:
- **UI/UX polish:** UI is functional but basic; needs more modern styling and clearer consolidation of experimental views.
- **Accessibility:** No clear accessibility features documented (keyboard navigation, contrast considerations, etc.).
- **Code quality consistency:** Error response formats are not fully consistent across endpoints.
- **AI pipeline complexity documentation:** Some complex AI processing logic would benefit from stronger inline documentation.
- **Type safety:** Plain JavaScript means less compile-time protection than a typed approach (e.g., TypeScript).
- **Automated testing depth:** Testing framework exists, but automated coverage is limited compared to production expectations.
- **Requirements traceability:** Some risks and security/access logging expectations discussed earlier are not fully reflected as explicit requirements + verification steps.
- **Use-case modeling completeness:** Use cases should emphasize user goals and include missing flows (multi-file upload, export formats, history, fallback behaviors, password reset, and clearer admin vs doctor boundaries).

### 8.3. Areas for Improvement (Based on Evaluation Feedback)

UI/UX and Accessibility
- Improve visual polish and consistency (layout, spacing, typography, feedback states).
- Consolidate or clearly label experimental views; reduce confusion for demo users.
- Add and document accessibility basics (keyboard navigation, focus states, readable contrast, clear headings).

Security, Privacy, and Compliance (Prototype Limits)
- Expand documentation to explicitly list what is *not* implemented for a production healthcare system.
- Strengthen and document **user access logging** coverage (what events are logged and why).
- Improve requirements traceability: ensure security + logging expectations are represented as requirements with verification methods.

Code Quality and Maintainability
- Standardize API response envelopes (success/error) across all endpoints.
- Centralize error handling and error-code mapping to reduce route-by-route variance.
- Add more inline documentation/JSDoc around AI pipeline stages, inputs/outputs, and failure modes.
- Consider TypeScript (or structured runtime validation) for safer data handling.

Testing and Quality Assurance
- Increase automated test coverage (unit + integration) for pipeline stages and core routes.
- Add deterministic mocks for AI providers to make tests repeatable.
- Add regression checks for response format consistency and key user flows.

---  

<br>  

## 9. Lessons Learned  

#### Joanna Picciano:  
- *Adaptability over Rigidity:*  
"(Wo)man plans, and God laughs."  
While my initial Gantt charts were detailed, real-world development required us to pivot constantly. I learned that a project manager’s value isn't in sticking to the plan, but in how effectively they re-route the team when the plan inevitably breaks.  
- *Architectural Flexibility:*  
Learned the importance of decoupling the frontend from the backend early. By treating the AI pipeline as an independent API, I was able to swap model providers (OpenAI vs. Local) without breaking the UI.  
- *Pipeline Latency Management:*  
Discovered that chaining multiple AI calls (Redaction → Summarization → Formatting) creates significant latency. Implementing a "stateful" progress feel for the user became critical for UX.  
- *Prompt Engineering vs. Code Logic:*  
learned that "fixing" AI behavior is often about prompt context rather than JavaScript logic. Iterating on the system prompt proved more effective for accuracy than writing complex regex post-processors.  
- *The "Middleware Hell" of Express:*  
Learned the hard way that order matters in `server.js`. Debugging session middleware placement relative to Auth0 and body-parsers gave me a deep appreciation for request lifecycles.


#### Patrick Daileg:  
- If you have issues with anything you're working on, please speak up or ask for more information about it.
- If you disagree with someone's idea, please keep it cool. Try not to argue with others. 
- Finding a middle ground is a great idea when your team has conflicting ideas.

#### Alondra Trejo Palma:  
- Always keep team members updated on tasks being handled specially when they depend or are dependent for easy work flow.
- Commit as many times as possible lingering code will cause breakage later on.
- Agreement on where to take the project is crucial, eveyones opinion matters to keep project moving.
- Working as a group can be difficult specially when personalities and the way we express ourselves is vastly different. But once we understand it becomes easier to collaborate with one another.
- At times doing your own research should come first, if there comes a point when you might not understand your research ask someone else to look it with you. As the saying goes two heads work better than one at times.  

#### Samuel Wu:   
- Further understanding into event listeners & the usage of sessionStorage.  
- When doing research, research it thoroughly and do not throw assumptions as to the quality of it unless you are certain that it doesn't work or would slow you down too much.  
- Ensure that there are not any miscommunication errors when discussing the functionality of how a page should function.  
- Find a working schedule for the team to collaboratively work.  
- Pace yourselves accordingly or try to at least lay out the base foundations of the project first.  

---  

<br>  

## 10. Future Work  
- Implement stronger PHI Redaction
- Implement advanced Accessibility-Friendly features like keyboard navigation
- Add more Role-Specific features
- Aim For higher summary accuracy
- OCR implementation to work with handwritten or audio note recordings
- Auto-Categorization
- Improvements to Admin Dashboard (e.g. Search Function)
- Performance Optimization
- UI Improvements  

### 10.1 Improvements Based on Evaluation Feedback

High Priority (most directly tied to grading feedback)
- Standardize API success/error response formats across all endpoints.
- Expand automated testing: pipeline unit tests + route integration tests + mocked AI providers.
- Add documented accessibility baseline (keyboard navigation, focus states, contrast notes).
- Improve UI polish and consolidate/label experimental views.

Medium Priority
- Add stronger inline documentation/JSDoc for AI pipeline stages and complex processing logic.
- Improve requirements traceability: reflect security + access logging expectations as explicit requirements with verification steps.
- Strengthen audit logging coverage (more complete event tracking: exports, admin actions, key user actions).

Longer-Term / Post-Capstone Expansion
- Consider TypeScript adoption or runtime schema validation for safer input/output handling.
- Enhance admin dashboard usability (search/filter, audit views).
- Expand OCR/ingestion capabilities (handwritten notes, audio workflows) with clear privacy constraints.
- Performance optimization and scaling considerations (queues, caching, rate limiting, monitoring).


---  

<br>  

## 11. Appendices  
- [User Manual](../docs/official/404PNF_help_documentation.pdf)
- [Installation Guide](../docs/dev/startup-guide.md)
- [Patrick and Sam's Testing Report](../docs/official/dataset%20and%20recall%20accuracy.pdf)
- [HIPAA Awareness](../docs/user/HIPAA-Awareness.txt)

---  

<br>  

## 12. References  
- Arias, J. (2024). *Project 2 - Server Side - F24* [Course handout].  
  CMPT 221: Software Development II, Marist College.
- Auth0. (2025). *Auth0 documentation*. https://auth0.com/docs
- Google. (2025). *Gemini (large language model)*. https://gemini.google.com
- Google. (2025). *NotebookLM (AI research and note-taking tool)*. https://notebooklm.google/
- MongoDB Inc. (2025). *MongoDB documentation*. https://www.mongodb.com/docs/
- Mountain Fog, Inc. (2025). *Philter: Open-source PHI and PII redaction software*. https://www.philterd.ai/open-source-software/
- OpenAI. (2025). *ChatGPT (large language model) [AI chatbot]*. https://chat.openai.com/
- OpenAI. (2025). *OpenAI API reference: Introduction*. https://platform.openai.com/docs/api-reference/introduction
- OpenJS Foundation. (2025). *Express.js documentation*. https://expressjs.com/
- OpenJS Foundation. (2025). *Node.js documentation*. https://nodejs.org/en/docs
- Picciano, J. (2024). *Data Manager client–server application backend* [currently unpublished course project].  
  CMPT 221: Software Development II, Marist College.
- Render. (2025). *Render documentation*. https://render.com/docs
- SmartBear Software. (2025). *Swagger documentation*. https://swagger.io/docs/
- Yusuf. (2024, March 10). *Useful Github Actions: Discord Webhooks*. Medium. https://medium.com/@yusufbiyik/useful-github-actions-discord-webhooks-6e356751d954
  
---

<br><br>  

## 13. Acknowledgments
Thanks to mentors, faculty advisors, and collaborators who supported the project.  

**Our faculty advisor:**  
Professor Juan Arias.  

---  

<br>  

## 14. Project Timeline

|Milestone|Deliverable|Date|
|---------|-----------|----|
|Proposal Approved| Problem Statement & Plan|Aug 27|  
|Requirements| Requirement Questionnaire |Sep 1|  
|Requirements| Requirements Document |Sep 8|  
|Project Plan| Project Plan & Gantt Submission|Sep 8|
|Midterm Demo|Prototype & Presentation|Oct 20|
|Final Presentation|Final Demo|Dec 8|
|Final Submission|Full System & Report|Dec 12|

---  

<br>  
