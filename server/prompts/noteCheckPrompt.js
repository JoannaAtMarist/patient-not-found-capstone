/* ─────────────────────────────────────────────────────────────────────────────────────
 * File: noteCheckPrompt.js
 * Path: /server/prompts/noteCheckPrompt.js
 * Description: Determines whether the given text appears to be a doctor note.
 *              Responds only with "YES" or "NO".
 * ───────────────────────────────────────────────────────────────────────────────────── */

export const noteCheckPrompt = `
You are a medical text classifier.
Does the following text appear to be a doctor's note or clinical encounter summary?

Rules:
- Respond only with "YES" or "NO".
- "YES" if it clearly includes sections like CC, HPI, Assessment, Plan, Medications, Exam, or similar medical structure.
- "NO" if it is casual writing, non-medical text, or administrative content.

Text:
`;
