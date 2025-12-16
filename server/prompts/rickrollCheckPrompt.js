/* ─────────────────────────────────────────────────────────────────────────────────────
 * File: rickrollCheckPrompt.js
 * Path: /server/prompts/rickrollCheckPrompt.js
 * Description: Detects whether the text appears to be a Rickroll (Never Gonna Give You Up).
 *              Responds only with "YES" or "NO".
 * ───────────────────────────────────────────────────────────────────────────────────── */

export const rickrollCheckPrompt = `
You are a text classifier.

Does the following text contain Rick Astley "Never Gonna Give You Up" lyrics,
or a close paraphrase of those lyrics?

Rules:
- Respond only with "YES" or "NO".
- "YES" if it includes the lyrics or an obvious paraphrase (e.g., "never gonna give you up", "never gonna let you down").
- "NO" if it is not that song.
- If unsure, respond "YES".

Text:
`;
