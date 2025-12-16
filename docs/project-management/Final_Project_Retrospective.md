# Final Project Retrospective — Patient Not Found (PNF)
**CMPT 475 – Fall 2025**

## 1. Project Overview
Patient Not Found is a prototype web application designed to assist doctors in summarizing clinical notes using AI. The focus of this prototype was accuracy, ease of use, and privacy awareness.

The system successfully allows users to:
* Upload typed clinical notes (PDF/DOCX/TXT)
* Generate AI-assisted summaries with automatic PHI redaction
* Edit and export summaries
* Manage sessions via Doctor/Admin login roles
* View system audit logs

## 2. Final Scope & Delivery Status
**In Scope (Completed):**
* Typed note summarization
* Redaction (structured + fallback mechanisms)
* Editable summary interface
* PDF and Word export
* Multi-file upload support
* Authentication (Auth0 + Local Sessions)
* Audit logging (metadata only)
* AI failure handling & error codes

**Out of Scope (Deferred):**
* Full HIPAA compliance (prototype awareness only)
* EHR integration
* Multi-language support
* Autonomous model training

## 3. Timeline & Adjustments
The project followed a dynamic timeline adapted to technical discoveries:
* **Weeks 1-4:** Focus on Architecture & AI feasibility.
* **Weeks 5-8:** Backend foundation & Pipeline development.
* **Weeks 9-12:** Integration & UI refinement.
* **Adjustments:**
    * Database schema was simplified to avoid storing PHI.
    * Logging was prioritized earlier due to debugging complexity.
    * UI tasks were shifted to accommodate backend integration needs.

## 4. Technical Discoveries & Lessons Learned
* **Redaction Complexity:** Required deeper prompt engineering than anticipated; a multi-layered approach (Philter + Regex fallback) was implemented.
* **Parsing:** PDF/Word parsing required specific library handling (`pdf-parse`, `mammoth`) to maintain text integrity.
* **Error Handling:** Granular error codes became essential for debugging the AI pipeline.
* **Testing:** Testing with varied synthetic notes exposed edge cases that simple inputs missed.

## 5. Risks & Mitigations
* **Accuracy Risk:** Mitigated via multi-step prompt design and a manual edit phase for doctors.
* **Privacy Risk:** Mitigated by enforcing a "no PHI storage" policy; database only stores redacted content.
* **Performance Variance:** Mitigated by pipeline optimization and minimal UI bloat.
* **Resource Availability:** Mitigated by centralizing backend ownership to ensure critical path delivery.

## 6. Conclusion
The project delivered a functioning prototype that aligns with core requirements. Despite adjustments in workflow, the final system demonstrates a realistic, working solution for AI-assisted clinical documentation.