# Patient Not Found — Frontend Architecture (v1.0)
### Updated: November 2025

This document describes the structure, responsibilities, and data flow of the **Patient Not Found frontend**.  
It reflects the post-cleanup, post-refactor architecture used for the December 2025 capstone release.

---

## Goals of This Architecture

- Reduce inline JS in HTML  
- Clearly separate global utilities, navigation rendering, page-specific logic, file upload/download, summarizer/editor functionality  
- Make the system easier to maintain as team members rotate  
- Prepare the UI for multi-file summaries and future layouts (tabs, cards, etc.)

---

## High-Level File Structure

```
client/
 └── src/
     ├── js/
     │    ├── global.js
     │    ├── navigation.js
     │    ├── login.js
     │    ├── home.js
     │    ├── create-account.js
     │    ├── profile.js
     │    ├── file-handler.js
     │    ├── summarizer.js
     │    └── summary-editor.js
     │
     └── css/
          ├── style.css
          ├── redactPHI.css
          ├── navigation.css
          └── hider.css
```

---

## Frontend Modules and Responsibilities

### 1. global.js
Shared logic available to every page.  
Contains navigation redirects, session helpers, logout logic.

### 2. navigation.js
Renders navbar based on authentication state.  
Shows pre-login or authenticated nav.

### 3. file-handler.js
Handles multi-file upload, text parsing, download helpers.

### 4. summarizer.js
Pipeline controller.  
Reads input, calls backend per note, builds structured JSON summary object.

### 5. summary-editor.js
Edits combined text while preserving per-file structured data.

### 6. login.js, home.js, profile.js, create-account.js
Each file controls one page with no inline JS.

---

## Data Flow Across Pages

```
summarizer.js
   |
   | builds summariesJSON object
   ▼
sessionStorage["summariesJSON"]
   |
   ▼
summary-editor.js
   |
   | edits combinedText
   ▼
sessionStorage["summariesJSON"]
   |
   ▼
Download as DOC/PDF
```

---

## Design Principles

- Separation of concerns  
- No inline scripts  
- Shared utilities isolated  
- Page-specific JS  
- UI-ready JSON summary structure

---


