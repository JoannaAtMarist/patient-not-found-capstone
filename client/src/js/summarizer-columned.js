/* ─────────────────────────────────────────────────────────────────────────────────────
 * File: summarizer-columned.js
 * Path: /client/src/js/summarizer-columned.js
 * Description: The file was not selected for final submission prototype, but is included here for completeness.
 * ───────────────────────────────────────────────────────────────────────────────────── */

//~ Imports
import { goEdit } from "./global.js";
import { attachFileUploadHandler, downloadDoc, downloadPdf } from "./file-handler.js";

console.log("[PNF] summarizer.js loaded");

//. --- Safe window selection + one-time flags ---
if (!["1", "2", "3"].includes(sessionStorage.getItem("Window"))) {
    sessionStorage.setItem("Window", "1");
}
["1", "2", "3"].forEach(n => {
    if (sessionStorage.getItem(`doc load ${n}`) == null) {
        sessionStorage.setItem(`doc load ${n}`, "false");
    }
});

//. Global summary state

// Holds structured summary data in-memory
let multiSummaryData = {};

// Backup key in sessionStorage
const SUMMARY_STORAGE_KEY = "summariesJSON";

//. Audit log helpers
function logToAudit(message) {
    const box = document.getElementById("auditBox");
    if (!box) return;

    const timestamp = new Date().toLocaleTimeString();
    const entry = document.createElement("div");
    entry.className = "audit-line";
    entry.textContent = `[${timestamp}] ${message}`;
    box.appendChild(entry);
}

//~ Backend call: summarize single note
async function summarizeNotes(id, name, noteText) {
    console.log(`[PNF] summarizeNotes -> ${name} (id=${id}) chars=${noteText.length}`);

    const response = await fetch("/api/summarize/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: noteText })
    });

    if (!response.ok) {
        let errPayload = null;
        try { errPayload = await response.json(); } catch (_) { }
        const msg = errPayload?.error || `Pipeline failed (${response.status})`;
        throw new Error(msg);
    }

    const result = await response.json();
    console.log("[PNF] summarizeNotes() result keys:", Object.keys(result || {}));

    return {
        id,
        name,
        originalText: noteText,

        summary: result.summary || "",
        allergies: result.allergies || "",
        final: result.final || "",

        highlights: result.highlights || [],
        confidence_flags: result.confidence_flags || []
    };
}

//~ Main summarize handler
async function handleSummarizeClick() {
    const barInput = document.getElementById("textInputBar");
    const spinner = document.getElementById("loadingSpinner");
    const outputArea = document.getElementById("redactedText"); // optional now

    if (!barInput || !spinner) {
        console.error("[PNF] Summarizer DOM elements missing.");
        return;
    }

    const manualText = (barInput.value || "").trim();

    // uploadedNotes will be populated by file-handler.js
    const notes = window.__pnfUploadedNotes && window.__pnfUploadedNotes.length
        ? window.__pnfUploadedNotes
        : (manualText
            ? [{ id: crypto.randomUUID(), name: "Manual Input", text: manualText }]
            : []);

    if (!notes.length) {
        alert("Please paste text or upload at least one file.");
        return;
    }

    logToAudit(`Starting summarization for ${notes.length} note(s).`);

    spinner.classList.remove("hidden");
    if (outputArea) outputArea.value = "";
    multiSummaryData = {};

    try {
        const pipelinePromises = notes.map(note =>
            summarizeNotes(note.id, note.name, note.text)
                .then(result => ({ ok: true, result }))
                .catch(err => ({
                    ok: false,
                    result: {
                        id: note.id,
                        name: note.name,
                        originalText: note.text,
                        pipeline: {
                            error: err.message,
                            redacted: "",
                            summary: "",
                            final: "[ERROR] Pipeline failed"
                        }
                    }
                }))
        );

        const completed = [];
        for (const job of pipelinePromises) {
            completed.push(await job);
        }

        // Store results keyed by ID
        for (const { result } of completed) {
            multiSummaryData[result.id] = result;
        }

        // Build combinedText for editor use
        let combinedText = "";
        let displayedText = "";
        for (const obj of Object.values(multiSummaryData)) {
            combinedText += ` ${obj.name} \n`;
            if (obj.summary == "") {
                obj.summary = "Input does not appear to be a doctor note";
            }
            if (obj.allergies == "") {
                obj.allergies = "No Allergies";
            }

            let allergyDisplay = obj.pipeline.allergies;

            // If it's a list (array), join it with commas. If it's a string, keep it.
            if (Array.isArray(allergyDisplay)) {
                allergyDisplay = allergyDisplay.join(", ");
            } else {
                // Ensure it's a string and handle empty/null cases
                allergyDisplay = String(allergyDisplay || "");
            }

            displayedText += "Note ID: " + obj.id + "\nSummary: " + JSON.stringify(obj.summary, null, 2) + "\nAllergies: " + allergyDisplay + "\n\n";
            combinedText += JSON.stringify(obj, null, 2);
            combinedText += "\n\n";

            // === Advanced Highlight Injection ===
            const highlights = obj.highlights || [];
            const confidenceFlags = obj.confidence_flags || [];
            const originalText = obj.originalText || "";

            // 1. Highlight Source Note (rightPanel top)
            const sourceHighlightBox = document.getElementById("sourceHighlightBox");
            if (sourceHighlightBox) {
                if (highlights.length) {
                    sourceHighlightBox.innerHTML = highlightSourceNote(originalText, highlights);
                } else {
                    sourceHighlightBox.innerHTML = "<p class='placeholder-text'>No highlights returned.</p>";
                }
            }

            // 2. Confidence Flags (rightPanel bottom)
            const confidenceBox = document.getElementById("confidenceBox");
            if (confidenceBox) {
                if (confidenceFlags.length) {
                    confidenceBox.innerHTML = applyConfidenceFlags(obj.summary || "", confidenceFlags);
                } else {
                    confidenceBox.innerHTML = "<p class='placeholder-text'>No confidence flags.</p>";
                }
            }

        }

        // Build the final object to store in sessionStorage
        const finalState = {
            combinedText,
            files: Object.values(multiSummaryData)
        };

        sessionStorage.setItem(SUMMARY_STORAGE_KEY, JSON.stringify(finalState)); //Stringified finalState
        sessionStorage.setItem("Pretty Plaintext", displayedText); //What the user should see

        // Show combined JSON in barInput for now
        renderSummaryCards(multiSummaryData);

        logToAudit("Summarization complete. JSON written to output.");

    } catch (err) {
        console.error("[PNF] Summarization failed:", err);
        logToAudit(`Summarization error: ${err.message}`);
        if (outputArea) {
            outputArea.value = `Summarization error:\n${err.message}`;
        }
    } finally {
        spinner.classList.add("hidden");
    }
}

//. Toggle audit panel visibility
function setupAuditToggle() {
    const toggleBtn = document.getElementById("toggleAudit");
    const auditBox = document.getElementById("auditBox");
    if (!toggleBtn || !auditBox) return;

    toggleBtn.addEventListener("click", () => {
        const isHidden = auditBox.classList.toggle("hidden");
        toggleBtn.textContent = isHidden ? "Show Log" : "Hide Log";
    });
}

//~ Initialize file upload integration
function setupFileUpload() {
    const fileInput = document.getElementById("fileUpload");
    const barInput = document.getElementById("textInputBar");

    if (!fileInput) {
        console.warn("[PNF] #fileUpload not found on page.");
        return;
    }

    window.__pnfUploadedNotes = [];

    attachFileUploadHandler(fileInput, (parsedFiles) => {
        window.__pnfUploadedNotes = parsedFiles;

        if (barInput) {
            const combined = parsedFiles
                .map(f => ` ${f.name} \n${f.text}`)
                .join("\n\n");
            barInput.value = combined;
        }

        logToAudit(`Loaded ${parsedFiles.length} file(s) from upload.`);
    });
}

//~ Setup download buttons
function setupDownloadButtons() {
    const outputArea = document.getElementById("redactedText");
    const docBtn = document.getElementById("download-button-doc");
    const pdfBtn = document.getElementById("download-button-pdf");

    if (docBtn) {
        docBtn.addEventListener("click", () => {
            const text = outputArea?.value || "";
            downloadDoc(text, "Summary");
            logToAudit("Download (.doc) started.");
        });
    }

    if (pdfBtn) {
        pdfBtn.addEventListener("click", () => {
            const text = outputArea?.value || "";
            downloadPdf(text, "Summary");
            logToAudit("Download (.pdf) started.");
        });
    }
}

//~ Setup Edit Summary button
function setupEditButton() {
    const editBtn = document.getElementById("editButton");
    if (!editBtn) return;

    editBtn.addEventListener("click", () => {
        logToAudit("Navigating to summary editor.");
        goEdit();
    });
}


//. new
function renderSummaryCards(summaryData) {
    const grid = document.getElementById("summaryGrid");
    if (!grid) return;

    grid.innerHTML = ""; // clear old summaries

    Object.values(summaryData).forEach(file => {
        const card = document.createElement("div");
        card.className = "summary-card";

        card.innerHTML = `
            <h3>${file.name}</h3>
            <pre>${applyConfidenceFlags(file.summary || "", file.confidence_flags || [])}</pre>
        `;

        grid.appendChild(card);
    });

    // Hook up per-card edit buttons
    document.querySelectorAll(".editOneSummary").forEach(btn => {
        btn.addEventListener("click", e => {
            const id = e.target.dataset.id;
            sessionStorage.setItem("singleSummaryId", id);
            goEdit();
        });
    });
}

//. new
function renderSidebar(summaryData) {
    const list = document.getElementById("summaryList");
    if (!list) return;

    list.innerHTML = "";

    Object.values(summaryData).forEach(file => {
        const li = document.createElement("li");
        li.textContent = file.name;
        li.dataset.id = file.id;

        li.addEventListener("click", () => {
            // highlight
            document.querySelectorAll("#summaryList li")
                .forEach(n => n.classList.remove("active"));
            li.classList.add("active");

            // scroll page to that summary card
            const card = document.querySelector(`[data-card-id="${file.id}"]`);
            if (card) {
                card.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });

        list.appendChild(li);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("[PNF] summarizer-columned DOMContentLoaded");

    // Top "Redact & Summarize" button
    const redactBtn = document.getElementById("redactButton");
    if (redactBtn) {
        redactBtn.addEventListener("click", handleSummarizeClick);
    } else {
        console.warn("[PNF] #redactButton not found.");
    }

    // Existing helpers (some may be no-ops on this page)
    setupAuditToggle();
    setupFileUpload();
    setupDownloadButtons();
    setupEditButton();

    // Bottom input bar
    const barInput = document.getElementById("textInputBar");
    const summarizeBtn = document.getElementById("summarizeFromBar");
    const uploadBtn = document.getElementById("uploadFromBar");
    const fileUploadTop = document.getElementById("fileUpload"); // reuse top input

    // Bottom "Upload Files" -> open the main file input
    if (uploadBtn && fileUploadTop) {
        uploadBtn.addEventListener("click", () => fileUploadTop.click());
    }

    // Bottom "Summarize" button
    if (summarizeBtn && barInput) {
        summarizeBtn.addEventListener("click", () => {
            const text = barInput.value.trim();

            if (text && (!window.__pnfUploadedNotes || window.__pnfUploadedNotes.length === 0)) {
                window.__pnfUploadedNotes = [{
                    id: crypto.randomUUID(),
                    name: "Manual Input",
                    text
                }];
            }

            handleSummarizeClick();
        });
    }
});

//~ Highlight Helpers (same as new-summarizer)
function highlightSourceNote(noteText, highlights) {
    let html = noteText;

    highlights.forEach(h => {
        if (!h.source_quote) return;

        const escaped = h.source_quote.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(escaped, "i");

        html = html.replace(
            regex,
            `<span class="src-highlight">$&</span>`
        );
    });

    return html;
}

function applyConfidenceFlags(summaryText, flags) {
    let html = summaryText;

    flags.forEach(flag => {
        if (!flag.sentence || !flag.confidence) return;

        const escaped = flag.sentence.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(escaped, "i");

        const className =
            flag.confidence === "low"
                ? "low-confidence"
                : flag.confidence === "medium"
                    ? "medium-confidence"
                    : "high-confidence";

        html = html.replace(
            regex,
            `<span class="${className}">$& <span class="conf-icon">⚠️</span></span>`
        );
    });

    return html;
}
