# Background and Research

## Joanna Picciano

- [Initial Tech Stack & Analysis](../../project-management/Initial_Research_Analysis.md)

My research focused on making a privacy-conscious, demo-ready AI summarization system achievable within a capstone timeline. I concentrated on the practical constraints that actually shape a real build: cost limits, reliability, deployment realities, and team workflow. This research directly informed the project’s architecture decisions (multi-stage AI pipeline, hybrid model support), development operations (branching + automation), and usability/trust features (source highlighting, confidence flags, export formats).  

### Research Focus Areas

#### AI infrastructure, provider selection, and cost constraints
- Compared cloud AI options (OpenAI, Azure, Google) with attention to pricing, rate limits, setup complexity, and “free tier” limitations.
- Outcome: supported a hybrid approach so development/testing could continue even when cloud usage was limited.

#### Local LLM exploration and model shortlisting
- Compiled and evaluated local model candidates (ex: Mistral, Phi-4) for feasibility in development environments.
- Outcome: created an early “model options” reference for experimentation and fallback planning.

#### Pipeline architecture and privacy-first processing
- Researched redact-first workflows and multi-stage pipeline patterns.
- Outcome: designed a multi-stage pipeline (Normalization -> Redaction -> Summarization -> Reintegration) to improve privacy handling and keep failure points isolated.  

#### Trust and usability features for clinicians
- Investigated patterns that help users trust AI output (traceability + uncertainty signaling).
- Outcome: implemented/outlined source-text highlighting and confidence/uncertainty cues, plus export formats to fit real documentation workflows.

#### Backend integration research (Express ordering, middleware, and stability)
- Researched and learned practical Express constraints: middleware order, session/auth wiring, and route mounting structure.
- Outcome: improved system stability by treating server initialization as a strict, documented sequence rather than “move code anywhere.”

#### DevOps and team workflow research
- Learned branching strategies and PR-based collaboration to reduce merge risk across multiple contributors.
- Researched GitHub Actions and lightweight scripts to automate repeatable tasks and reduce manual errors.

#### Data storage and environment portability
- Researched MongoDB local development vs MongoDB Atlas deployment differences (connection strings, environment variables, access setup).
- Outcome: enabled smoother collaboration and deployment-aligned testing.

#### API documentation and testing workflow
- Researched API documentation tooling and implemented Swagger UI to keep frontend development unblocked and endpoints testable without backend deep-dives.

#### Project management tooling and planning support
- Evaluated Jira/Asana/ClickUp/Trello and ultimately used GitHub Issues/Projects for repo-native tracking.
- Used NotebookLM alongside LLM tools (ChatGPT/Gemini) to accelerate planning artifacts (WBS, risks, timelines) while keeping scope controlled.


### Additional Research Areas & What I Learned

#### 1) Project Planning Methods (Agile, timelines, and scope control)
- Explored Agile/Scrum-style iteration plan for a semester capstone.
- Focused on “scope protection” tactics: MVP definition, sprint goals, and pre-demo vs. post-demo re-scoping.
- Outcome: kept the project on-schedule by repeatedly re-evaluating requirements and reassigning work based on risk and time.

#### 2) Project Management Tool Selection (and why GitHub Projects won)
- Compared tools like Jira, Asana, ClickUp, and Trello for planning/tracking.
- Considered: learning curve, cost/free tiers, team adoption, and code integration.
- Outcome: selected GitHub Projects because it’s tightly coupled to Issues/PRs/branches and was the easiest to keep “true” to the repo.

#### 3) Cloud AI Selection (cost limits + “no free tier” reality)
- Compared OpenAI vs. Azure vs. Google options primarily on:
  - cost predictability, free tier limitations, and integration complexity
  - speed of setup vs. time budget
- Outcome: designed the backend so the summarization engine can switch between paid API mode and local LLM mode depending on environment/cost constraints.

#### 4) Local LLM exploration (for development + fallback)
- Researched and compiled a starter list of local models for experimentation (ex: Mistral, Phi-4, etc.).
- Considered: model size, inference speed, instruction-following reliability, and hardware constraints.
- Outcome: supported a “hybrid” approach where local LLMs can be used during development/testing when cloud usage is limited.

#### 5) AI Pipeline Architecture (redact -> summarize -> reintegrate)
- Studied “redaction-first” patterns and multi-stage pipelines for privacy-conscious workflows.
- Outcome: designed a multi-stage pipeline:
  - Normalization -> Redaction -> Summarization -> Reintegration (plus error-handling boundaries between stages)
- Benefit: easier to debug, safer defaults, and clearer failure modes than a single monolithic prompt.

#### 6) Branching, pull requests, and team workflow
- Learned feature-branch workflows, PR review habits, and how to reduce merge pain.
- Outcome: established a working branching rhythm for a mixed-skill team (and learned the hard way what happens without it).

#### 7) MongoDB Local -> MongoDB Atlas migration
- Researched connection-string differences, IP allowlisting, and environment variable management.
- Outcome: enabled cloud-hosted DB access for easier collaboration and deployment alignment.

#### 8) GitHub Actions + scripts (automation + guardrails)
- Investigated CI/CD basics: automated checks, scripted workflows, and repeatable tasks.
- Outcome: helped reduce “manual steps” and made it easier to keep the repo consistent across machines.

#### 9) Swagger (API documentation + frontend independence)
- Evaluated options for API testing and documentation, then implemented Swagger UI for routes.
- Outcome: frontend devs could test endpoints without digging through backend code.

#### 10) File uploading + parsing  
- Researched safe upload handling and document-to-text extraction approaches.
- Outcome: supported typed and file-based input.

#### 11) Source highlighting + confidence flags (trust features)
- Researched “traceability” UX patterns (showing what parts of the source influenced the output).
- Outcome: implemented prompts/logic to return highlight mappings + confidence cues to increase user trust.

#### 12) OCR research (unfinished, but investigated)
- Looked into OCR feasibility and constraints (especially handwriting).
- Outcome: documented as a stretch goal due to time + reliability concerns; groundwork research completed even though implementation wasn’t finished.

#### 13) JSON export research
- Researched structured output formats for future interoperability.
- Outcome: added export capability so summaries can be reused beyond PDF/Word.

#### 14) NotebookLM + LLM tools for planning
- Used NotebookLM alongside ChatGPT/Gemini for planning artifacts (WBS, risk lists, task decomposition).
- Outcome: accelerated document drafting and helped keep planning artifacts aligned with evolving scope.

#### 15) “server.js breaks if the order is wrong” (module + middleware ordering lessons)
- Learned (painfully) how Express middleware order, Auth/session wiring, and route mounting order can silently break the app.
- Outcome: improved understanding of server initialization structure and why “just moving code around” can cause cascading failures.

---

### Artifacts / Where this research shows up in the repo
- Planning + scope: `docs/project-management/`
- Setup + environment: `docs/dev/startup-guide.md`, `docs/dev/dependencies.md`
- Architecture + pipeline: `docs/official/system-architecture-reference.md`, diagrams under `docs/official/diagrams/`
- API docs: Swagger YAML + Swagger UI notes in docs
- Trust features: `docs/official/features-highlights-confidence.md`