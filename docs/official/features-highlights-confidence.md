# Source Text Highlighting & Confidence Flags — Clinician Guide

## What these features do
- **Source text highlighting** shows the exact phrases in the original note that the summary drew from. It helps you verify that key statements in the summary have supporting language in the source note.
- **Confidence flags** mark summary sentences that may need a second look so you know what to double‑check first.

Both features are available on the Summary page as optional panels under the editor.

## Where you’ll see them
- **Source Highlights** panel shows the original note with yellow highlights on matched phrases.
- **Confidence Flags** panel lists summary sentences with badges:
  - **✓** = typical confidence
  - **⚠︎** = needs review (hard to match to source wording or includes cautious language like “may,” “likely,” “appears”).

You can toggle these panels on/off with **Source text highlighting** and **Confidence flags** checkboxes under the summary box.

## How to use them quickly
1. **Scan flags first.** Review ⚠︎ sentences before anything else.
2. **Trace to source.** Use yellow highlights to confirm the summary’s wording in the original note.
3. **Edit in place.** If something looks wrong or incomplete, edit the summary directly in the editor.

## What they are not
- They are assistive cues, not a diagnosis or clinical decision tool.
- Highlights are approximate text matches; if the note’s wording is very different, a sentence may not highlight even if it’s clinically correct.

## For reviewers and developers
When advanced formatting is enabled by the backend, the response may include “highlights” and “confidence_flags” fields. The UI renders these when present, and falls back to client‑side heuristics when they are missing. No PHI is stored in logs; only metadata (who, when, route).

### Example of advanced fields (response shape)
```json
{
  "summary": "…",
  "allergies": "…",
  "highlights": [
    { "summary_sentence": "...", "source_quote": "...", "source_location": "sentence X" }
  ],
  "confidence_flags": [
    { "sentence": "...", "confidence": "high | medium | low" }
  ]
}
```

## FAQ
**Can I turn them off?** Yes. Use the checkboxes below the summary box per tab.  
**Why is a sentence flagged?** It didn’t closely match wording in the source or contained cautious language.  
**Why didn’t a correct sentence highlight?** The match is approximate; paraphrasing may prevent a highlight.

---

_This document is part of the Patient Not Found prototype documentation._
