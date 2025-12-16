/* ─────────────────────────────────────────────────────────────────────────────────────
 * File: summarizer.js
 * Path: /client/src/js/summarizer.js
 * Description:
 *   Page controller for summarizer.html (legacy multi-note workflow).
 *   - Manages the active note "Window" (1..3) and per-window load flags in sessionStorage.
 *   - Sends note text to POST /api/summarize/pipeline.
 *   - Stores structured results in memory and sessionStorage for downstream viewing/editing.
 * 
 * Note: The file was not selected for final submission prototype, but is included here for completeness.
 * ───────────────────────────────────────────────────────────────────────────────────── */

//~ Imports
import { goEdit } from "./global.js";
import { attachFileUploadHandler, downloadDoc, downloadPdf, downloadJson } from "./file-handler.js";

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

//. Save global summary state to sessionStorage
function undoSummaryChanges() {
    if (sessionStorage.getItem("Pretty Plaintext") == null) {
        sessionStorage.setItem("Pretty Plaintext", "None");
    }
    const outputArea = document.getElementById("redactedText");
    if (outputArea) {
        outputArea.value = sessionStorage.getItem("Pretty Plaintext");
    }
}

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

//~ Backend call: summarize a single note via the pipeline endpoint
async function summarizeNotes(id, name, noteText) {

    console.log(`[PNF] summarizeNotes -> ${name} (id=${id}) chars=${noteText.length}`);

    const response = await fetch("/api/summarize/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: noteText })
    });

    console.log("[PNF] /api/summarize/pipeline -> status", response.status);

    if (!response.ok) {
        let errPayload = null;
        try { errPayload = await response.json(); } catch (_) { }
        const msg = errPayload?.error || `Pipeline failed (${response.status})`;
        throw new Error(msg);
    }

    const result = await response.json();
    console.log("[PNF] summarizeNote() result keys:", Object.keys(result || {}));

    return {
        id,
        name,
        originalText: noteText,
        pipeline: {
            summary: result.summary || "",
            allergies: result.allergies || ""
        }
    };
}

//~ Main summarize handler
async function handleSummarizeClick() {
    const textArea = document.getElementById("textInput");
    const spinner = document.getElementById("loadingSpinner");
    const outputArea = document.getElementById("redactedText");

    const manualText = (textArea?.value || "").trim();

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

    if (spinner) {
        spinner.classList.remove("hidden");
    }
    if (outputArea) {
        outputArea.value = "";
    }
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

        // For now: sequential to keep logs easy to read
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

            if (obj.pipeline.summary === "") {
                obj.pipeline.summary = "Input does not appear to be a doctor note";
            }
            if (obj.pipeline.allergies === "" || obj.pipeline.allergies == null) {
                if (obj.pipeline.allergies == null) {
                    obj.pipeline.allergies = "User is allergic to using valid doctor notes.";
                } else {
                    obj.pipeline.allergies = "No Allergies";
                }
            }

            // Allergy display
            let allergyDisplay;
            if (Array.isArray(obj.pipeline.allergies)) {
                allergyDisplay = obj.pipeline.allergies.join(", ");
            } else {
                allergyDisplay = String(obj.pipeline.allergies);
            }

            displayedText +=
                "Note ID: " + obj.id + "\n" +
                "Summary: " + JSON.stringify(obj.pipeline.summary, null, 2) + "\n" +
                "Allergies: " + allergyDisplay + "\n\n";
        }

        // Build the final object to store in sessionStorage
        const finalState = {
            combinedText,
            files: Object.values(multiSummaryData)
        };

        sessionStorage.setItem(SUMMARY_STORAGE_KEY, JSON.stringify(finalState)); //Stringified finalState
        sessionStorage.setItem("Pretty Plaintext", displayedText); //What the user should see

        // Show combined JSON in textarea for now
        if (outputArea) {
            outputArea.value = displayedText;
        }

        logToAudit("Summarization complete. JSON written to output.");

    } catch (err) {
        console.error("[PNF] ❌ handleSummarizeClick() failed:", err);
        if (outputArea) {
            outputArea.value = `❌ Error:\n${err.message}`;
        }
    } finally {
        if (spinner) {
            spinner.classList.add("hidden");
        }
    }
}

//~ Initialize file upload integration
function setupFileUpload() {
    const fileInput = document.getElementById("fileUpload");
    const textArea = document.getElementById("textInput");

    if (!fileInput) {
        console.warn("[PNF] #fileUpload not found on page.");
        return;
    }

    // We'll stash parsed files in a global variable so editor.js can evolve later
    window.__pnfUploadedNotes = [];

    attachFileUploadHandler(fileInput, (parsedFiles) => {
        window.__pnfUploadedNotes = parsedFiles;

        // For now, show combined raw text in the input textarea
        if (textArea) {
            const combined = parsedFiles
                .map(f => ` ${f.name} \n${f.text}`)
                .join("\n\n");
            textArea.value = combined;
        }

        logToAudit(`Loaded ${parsedFiles.length} file(s) from upload.`);
    });
}

//~ Setup download buttons
function setupDownloadButtons() {
    const outputArea = document.getElementById("redactedText");
    const docBtn = document.getElementById("download-button-doc");
    const pdfBtn = document.getElementById("download-button-pdf");
    const jsonBtn = document.getElementById("download-button-json");

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

    if (jsonBtn) {
        jsonBtn.addEventListener("click", () => {
            const text = outputArea?.value || "";
            // Minimal version: dump what is in the editor as a JSON object
            downloadJson({ summary: text }, "Summary");
            logToAudit("Download (.json) started.");
        });
    }
}

//~ Setup Undo Changes button
function setupUndoButton() {
    const undo = document.getElementById("resetChanges");
    if (!undo) return;

    undo.addEventListener("click", () => {
        undoSummaryChanges();
    });
}

//~ DOMContentLoaded bootstrap
document.addEventListener("DOMContentLoaded", () => {
    console.log("[PNF] summarizer DOMContentLoaded");

    const redactBtn = document.getElementById("redactButton");
    if (redactBtn) {
        redactBtn.addEventListener("click", handleSummarizeClick);
    } else {
        console.warn("[PNF] #redactButton not found.");
    }

    setupFileUpload();
    setupDownloadButtons();
    setupUndoButton();
});


/*New Summary Page Logic Goes Here */
document.addEventListener("DOMContentLoaded", () => {
    const inputTabBtn = document.getElementById("sumOne");
    const redactedTabBtn = document.getElementById("sumTwo");
    const summaryTabBtn = document.getElementById("sumThree");

    const inputSection = document.getElementById("inputSection");
    const redactedSection = document.getElementById("redactedSection");
    const summarySection = document.getElementById("summarySection");

    // If this page does not have the tabbed layout, do nothing
    if (!inputTabBtn || !redactedTabBtn || !summaryTabBtn ||
        !inputSection || !redactedSection || !summarySection) {
        return;
    }

    function showTab(tabName) {
        // Hide all sections
        inputSection.classList.add("hidden");
        redactedSection.classList.add("hidden");
        summarySection.classList.add("hidden");

        // Remove active style from all tab buttons
        inputTabBtn.classList.remove("active");
        redactedTabBtn.classList.remove("active");
        summaryTabBtn.classList.remove("active");

        // Show selected section + style selected tab
        if (tabName === "input") {
            inputSection.classList.remove("hidden");
            inputTabBtn.classList.add("active");
        }
        else if (tabName === "redacted") {
            redactedSection.classList.remove("hidden");
            redactedTabBtn.classList.add("active");
        }
        else if (tabName === "summary") {
            summarySection.classList.remove("hidden");
            summaryTabBtn.classList.add("active");
        }
    }

    // Attach click handlers
    inputTabBtn.addEventListener("click", () => showTab("input"));
    redactedTabBtn.addEventListener("click", () => showTab("redacted"));
    summaryTabBtn.addEventListener("click", () => showTab("summary"));

    // Default tab on load
    showTab("input");
});