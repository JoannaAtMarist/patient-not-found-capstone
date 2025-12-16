# Requirements Document – Version 1.1  
**Project Title:** AI-Powered Summary Generation for Doctor Notes  
**Group Members:** Joanna Picciano, Patrick Daileg, Alondra Trejo-Palma, Samuel Wu  
**Date:** 11/26/25

---

## Changes from v1.0
- Added missing risks from questionnaire.  
- Added security requirements (HTTPS, access control, temporary data lifecycle).  
- Added logging requirements (login events, summary events, PHI-free logs).  
- Improved constraints and dependencies section.  
- Reorganized structure for clarity in Project Plan.

---

# 1. Introduction

## 1.1 Purpose
This document defines the functional, non-functional, security, and logging requirements for the AI-Powered Summary Generation system. These requirements support project planning, design, implementation, testing, and evaluation.

## 1.2 Scope
The system allows doctors to upload or enter clinical notes and receive AI-assisted summaries. It provides redaction of sensitive information, editable summaries, PDF/Word export, and simple authentication. The system is a prototype, intended for demonstration purposes only, using de-identified or synthetic data.

## 1.3 Stakeholders
- **Doctors / Scribes (Primary Users):** Use the system to summarize clinical notes.  
- **Admin:** Manages system setup, accounts, and access.  
- **IT Support:** Assists with environment setup and API connectivity.  
- **Professor:** Review deliverables and functionality.

---

# 2. Functional Requirements

## FR-1: Text Input
The system must allow users to submit typed clinical notes.  
**Rationale:** Enables basic summarization without file uploads.  
**Verification:** Manual input test.

## FR-2: File Upload (Multiple Files)
The system should allow users to upload multiple files at once.  
**Rationale:** Supports batch summarization.  
**Verification:** Upload test with multiple files.

## FR-3: PHI Handling
The system must only store **redacted summaries**, never raw PHI.  
**Rationale:** Reduces privacy and compliance risks.  
**Verification:** Ensure stored summaries do not contain unredacted PHI.

## FR-4: Exporting Summaries
The system must allow export of summaries as **PDF and Word** documents.  
**Rationale:** Supports clinical workflows.  
**Verification:** Download and open export files.

## FR-5: Editable Summaries
The system must allow users to edit summaries after they are generated.  
**Rationale:** Allows corrections to AI output.  
**Verification:** Modify summary text and confirm persistence.

## FR-6: Source Text Highlighting
The system should include highlighted references to the original text.  
**Rationale:** Improves trust and verification of AI output.  
**Verification:** Compare highlight positions and summary sections.

## FR-7: AI Failure Fallback
If AI fails, the system should display the original clinical note and a placeholder summary.  
**Rationale:** Ensures system remains usable.  
**Verification:** Disable AI and confirm fallback behavior.

---

# 3. Non-Functional Requirements

## NFR-1: Minimal Interface
The system should have a minimal, clean, single-page interface.  
**Rationale:** Enhances usability.  
**Verification:** UI inspection.

## NFR-2: Performance
The system must generate a summary in **10 seconds or less** for a one-page typed note.  
**Rationale:** Usability requirement.  
**Verification:** Timed performance test.

## NFR-3: Authentication
The system must support basic username/password authentication for doctors and admin.  
**Rationale:** Access control.  
**Verification:** Login test.

## NFR-4: Password Reset
The system must support password reset through email link or mock workflow.  
**Rationale:** Expected modern feature.  
**Verification:** Simulated password reset test.

## NFR-5: Accessibility
The system should support basic accessibility features (alt text, clear fonts).  
**Rationale:** Improves inclusivity.  
**Verification:** Accessibility audit.

## NFR-6: Role Handling
The system must support at least:
- **Doctor role** (full usage access)  
- **Admin role** (system setup, limited oversight)

**Verification:** Login as each role and verify permissions.

---

# 4. Security Requirements

## SEC-1: HTTPS Requirement
All communication must be protected through HTTPS when deployed.  
**Rationale:** Protects authentication and note content.  
**Verification:** Deployment environment test.

## SEC-2: Storage Restrictions
No raw PHI may be stored at any time (temporary or long-term).  
**Rationale:** Risk reduction.  
**Verification:** Review storage after sessions.

## SEC-3: Temporary Data Lifecycle
Any uploaded or typed data must be removed upon logout or session end.  
**Rationale:** Minimizes retention risk.  
**Verification:** Check local/session data after logout.

## SEC-4: Access Control
Only authenticated users may access summaries, uploads, or history.  
**Rationale:** Prevents unauthorized access.  
**Verification:** Attempt unauthorized access.

## SEC-5: De-identification
Only synthetic or de-identified data may be used during development.  
**Rationale:** Ethical and legal compliance.  
**Verification:** Team review and test materials audit.

---

# 5. Logging Requirements

## LOG-1: Authentication Logging
The system must record login and logout events.  
**Rationale:** Provides basic security auditing.  
**Verification:** Inspect audit output after login/logout.

## LOG-2: Summary Generation Logging
The system must log each summary-generation request, including user identity and timestamp.  
**Rationale:** Supports traceability.  
**Verification:** Audit log inspection.

## LOG-3: Log Contents
Each log entry should include:  
- Timestamp  
- Username / User ID  
- Path or action  
- Status outcome (success/failure)

**Verification:** Confirm logged entries.

## LOG-4: Log Safety
Logs must never contain PHI or raw note text.  
**Verification:** Inspect logs for absence of sensitive fields.

---

# 6. Constraints

## C-1: Limited Number of Users
Prototype will support 1–2 doctors initially; scalability is out of scope.

## C-2: AI Accuracy Limitations
AI may not reach full clinical accuracy due to time, model, and prototype constraints.

## C-3: Not Fully HIPAA-Compliant
The system simulates HIPAA awareness but does not meet full HIPAA standards.

## C-4: De-Identified / Synthetic Data Only
Real patient data must not be used in development or demo.

## C-5: Free/Open-Source Tools
The project must use free or open-source frameworks, APIs, and libraries when possible.

## C-6: Hardware Restrictions
Development is limited to personal laptops or free cloud tiers.

## C-7: Internet Dependency
System requires internet for AI summarization; offline mode is not supported.

---

# 7. Risks and Dependencies

## 7.1 Risks

### R-1 AI Inaccuracy
AI may omit key clinical details such as diagnoses or medication changes.

### R-2 Privacy & Compliance Risks
The prototype provides only basic warnings and is not suitable for real PHI.

### R-3 Bias in AI Output
Model performance may vary across specialties or note types; bias detection is out of scope.

### R-4 Liability
AI output is not for clinical use and may misrepresent information.

### R-5 Internet Dependency
Loss of connectivity prevents summarization.

### R-6 Uncertainty / Low Confidence Output
If confidence scoring is unsupported by the API, uncertain areas cannot be highlighted.

## 7.2 Dependencies
- Cloud AI service (e.g., OpenAI).  
- Optional OCR library for stretch goals.  
- Web framework (Node.js/Express).  
- Local or cloud hosting used for demo.

---

# 8. Acceptance Criteria

- A doctor can log in and submit text or uploaded notes for summarization.  
- Summaries can be edited and exported as PDF/Word.  
- Summaries are generated in approximately 10 seconds or less.  
- System supports multiple doctor/admin logins.  
- Summary accuracy reaches at least **80% recall for key clinical terms** (diagnoses, medications, allergies).  
- Only redacted summaries are stored; no PHI persists after logout.  
