
# Repository Structure (Patient Not Found)

This map is **folder‑first** and includes one‑line purposes.

```
📁 Project Structure

├─ .env                       # Runtime secrets (NOT committed) – use env.example
├─ .gitignore                 # Git ignore rules
├─ README.md                  # Repo landing readme (pointers to /docs)
├─ docker-compose.yml         # Optional containers (MongoDB, etc.)

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
│  │  ├─ Fake Patient Summary/
│  │  │  ├─ Adults/
│  │  │  ├─ Children/
│  │  │  ├─ Elderly/
│  │  │  └─ Lengthy/
│  │  ├─ SyntheticDataTest/   # Synthetic and edge-case notes
│  │  └─ WackyTests/          # Adversarial or formatting-stress examples
│  └─ templates/              # Test harness templates or fixtures
│
├─ package.json               # Node package manifest
└─ package-lock.json          # Lockfile
```

## Notes & Conventions
- **utilities, not utils** – Per Joanna's preference. Keep naming consistent across client/server.
- **No PHI in repo** – sample notes are synthetic; logs store metadata only.
- **docs/official is the source of truth** for graded deliverables.
- **docs/documentation-index.md** as the main documentation entry.
- If you run with Docker, keep `docker-compose.yml` minimal (Mongo, maybe a seed task).

## Quick Cross-Refs
- Highlights & Confidence feature doc: `docs/official/features-highlights-confidence.md`
- API docs: `scripts/swagger.yaml` exposed via Swagger UI
- Entry points: `server/server.js` and `client/views/new-summarizer.html`
