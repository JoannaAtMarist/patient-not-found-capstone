#### **4. Create a Work Breakdown Structure (WBS)**
The project will follow **weekly sprints**. **Timeline from Week 1 (Aug 25) to Project Wrap-up (Dec 12):**
###### **Overall Bird's Eye View Phases & Tasks:**
**Phase 1: Requirements & Planning (Aug 25 - Sep 7)**
*   Define project goals and scope.
*   Identify stakeholders.
*   Establish communication plan.
*   Team roles and responsibilities assignment.
*   Initial research into AI, database, and UI tools.
*   Submit Requirements Questionnaire.
*   Submit Project Plan.
*   Submit Requirements Document.

**Phase 2: Design & Core Research (Sep 8 - Sep 28)**
*   **Main Timeline (Backend/AI/Database Focus):**
    *   AI Integration research (LLM selection, PHI redaction strategies).
    *   Database selection and research.
    *   Initial AI/Database development and experimentation.
    *   Backend foundation setup (Node.js/Express).
    *   Initial AI & Database Integration efforts.
*   **Design Timeline (UI/UX/Diagrams Focus):**
    *   Use Case and Class Diagrams.
    *   UI Mockups and Wireframes (minimal, single-page).
    *   Research interface mockup tools (e.g., InVision or Figma).
    *   Research testing data and Postman needs.

**Phase 3: Development & Integration (Sep 29 - Oct 12)**
*   **Main Timeline:**
    *   Continued Backend foundation development.
    *   Full AI & Database Integration.
    *   Implementing core summary generation logic.
    *   Developing redaction functionality.
    *   Doctor login and basic admin role handling.
*   **Design Timeline:**
    *   UI Development (implementing mockups with Bootstrap/Material design).
    *   Implementing multiple file upload functionality.
    *   Implementing summary display and editing in UI.
    *   Accessibility (clear fonts, alt text) implementation.
*   **Integrated:** UI & Backend Integration.

**Phase 4: Testing & Demo Preparation (Oct 13 - Oct 19)**
*   Rigorous testing of core functionalities (summary generation, redaction, login, export).
*   Performance testing against ≤10 sec goal.
*   User acceptance testing with sample 'gold' notes.
*   Mid-term Peer Evaluation (Oct 15).
*   Demo preparation and presentation rehearsals.

**Phase 5: Post-Demo Refinement & Enhancements (Oct 20 - Nov 30)**
*   **Main Timeline (Backend/AI/Database Focus):**
    *   Review Demo Feedback, Initial Bug Fixing, and Performance Analysis.
    *   Refine core AI summary generation and redaction logic, aligning with v3 goals.
    *   Implement robust password reset and audit logging functionalities.
    *   Optimize database and ensure integration stability.
    *   Address remaining critical bugs and prepare for stretch goals.
    *   Limited Work during Thanksgiving Break (Nov 27-30): Minor bug squashing, planning for v4 Stretch Goals (e.g., basic OCR experimentation, JSON export).
*   **Design Timeline (UI/UX/Diagrams Focus):**
    *   Collect UI/UX feedback from the demo and plan further UI enhancements.
    *   Develop enhanced UI features (e.g., improved file upload and export workflows).
    *   Implement accessibility upgrades beyond basic compliance (e.g., colorblind support if feasible).
    *   Implement source text highlighting for improved trust.
    *   UI polish and usability improvements.
    *   Limited Work during Thanksgiving Break (Nov 27-30): UI cleanup and documentation contribution.
*   **Integrated:**
    *   Continuous Testing & Validation against "gold" notes.
    *   Regression Testing after each major feature enhancement.
    *   Weekly Status Report Preparation.

**Phase 6: Final Documentation & Project Wrap-up (Dec 1 - Dec 12)**
*   **Main Timeline:**
    *   Final Code Review and Repository Cleanup.
    *   Ensure all "main goals met with bugs squashed".
*   **Documentation Timeline:**
    *   Finalize System Documentation (README.md).
    *   Compile Project Documentation (Requirements Document, Project Plan).
    *   Complete User Documentation (Setup Guides, User Instructions).
    *   Generate test reports and logs.
*   **General Tasks:**
    *   Last Team Class (Dec 1).
    *   Final Submission (Dec 5).
    *   Project Archiving and Final Review of Deliverables.
    *   Note: Final Exam Period (Dec 8-12).

Goals by priority and timeline.
v1 Goals (base to build on): 
	1. Input: sent as data. Output: received as data.
	2. Basic Summary generation
	3. Single-page interface: text input + summary output window.
	4. Login support for doctors
v2 Goals (pre-demo) :
	1. Input: typed/pasted into UI. Output: displayed in UI.
	2. Redaction
	3. Time goal ≤10 seconds for a one-page typed note.
	4. Summary accuracy ≥80% recall of key terms (diagnoses, meds, allergies).
	5. AI failure placeholder
	6. HIPAA awareness/warnings
	7. Login support for admin
v3 Goals (post-demo): 
	1. Single-page interface: file upload + summary output window + export files.
	2. Input: import multiple files. Output: export as PDF/Word.
	3. Editable summaries
	4. Password reset
	5. Accessibility: alt text
	6. Audit logs for login & use
V4 Stretch Goals: 
	• Source Text Highlighting (confirm that it is a stretch goal)
	• OCR for Handwritten Notes.
	• Spanish language support.
	• JSON Export.
	• Accessibility Upgrades (colorblind & beyond basics).
	• Uncertainty Highlighting / Confidence Flags.
	• Assistant login

