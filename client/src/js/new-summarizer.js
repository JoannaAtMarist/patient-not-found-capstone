/* ─────────────────────────────────────────────────────────────────────────────────────
 * File: new-summarizer.js
 * Path: /client/src/js/new-summarizer.js
 * Description:
 *   Page controller for new-summarizer.html (multi-note workflow).
 *   - Manages the active note "Window" (1..3) and per-window saved plaintext in sessionStorage.
 *   - Integrates with shared file upload and export helpers (file-handler.js).
 * ───────────────────────────────────────────────────────────────────────────────────── */

//~ Imports
import { goEdit } from "./global.js";
import { attachFileUploadHandler, downloadDoc, downloadPdf, downloadJson } from "./file-handler.js";

console.log("[PNF] new-summarizer.js loaded");

//. Default to Window 1 on page load; initialize per-window flags if missing.
if (!["1", "2", "3"].includes(sessionStorage.getItem("Window"))) {
    sessionStorage.setItem("Window", "1");
}
["1", "2", "3"].forEach(n => {
    if (sessionStorage.getItem(`doc load ${n}`) == null) {
        sessionStorage.setItem(`doc load ${n}`, "false");
    }
});

//. Session
sessionStorage.setItem("Window", "1");

//. Global summary state

// Holds structured summary data in-memory
let multiSummaryData = {};

// Backup key in sessionStorage
const SUMMARY_STORAGE_KEY = "summariesJSON";

//. Save global summary state to sessionStorage
function undoSummaryChanges() {
    function determineRefresh(number) {
        if (number == "1") {
            return sessionStorage.getItem("Pretty Plaintext1");
        } else if (number == "2") {
            return sessionStorage.getItem("Pretty Plaintext2");
        } else {
            return sessionStorage.getItem("Pretty Plaintext3");
        }
    }
    const outputArea = determineOutput(sessionStorage.getItem("Window"));
    outputArea.value = determineRefresh(sessionStorage.getItem("Window"));
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

//. highlight + confidence helpers
function splitSentences(text) {
    const s = (text || "").replace(/\s+/g, " ").trim();
    if (!s) return [];
    const parts = [];
    let start = 0;
    for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (ch === '.' || ch === '!' || ch === '?') {
            const prev = s[i - 1], next = s[i + 1];
            const isDecimal = /\d/.test(prev) && /\d/.test(next); // don't split 0.8
            if (isDecimal) continue;
            parts.push(s.slice(start, i + 1).trim());
            if (s[i + 1] === ' ') i++;
            start = i + 1;
        }
    }
    if (start < s.length) parts.push(s.slice(start).trim());
    return parts.filter(Boolean);
}
function normalize(s) {
    return (s || "").toLowerCase()
        .replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}
function findBestSpan(source, sentence) {
    const src = normalize(source), tgt = normalize(sentence);
    if (!tgt) return null;
    const idx = src.indexOf(tgt);
    if (idx === -1) return null;
    const rawIdx = source.toLowerCase()
        .indexOf(sentence.trim().toLowerCase().slice(0, Math.min(sentence.length, 20)));
    return (rawIdx >= 0) ? { start: rawIdx, end: rawIdx + sentence.length } : null;
}
function applySourceHighlighting(sourceText, summaryText) {
    const hits = [];
    for (const s of splitSentences(summaryText)) {
        const h = findBestSpan(sourceText, s);
        if (h) hits.push(h);
    }
    hits.sort((a, b) => a.start - b.start);
    const merged = [];
    for (const h of hits) {
        if (!merged.length || h.start > merged[merged.length - 1].end) merged.push({ ...h });
        else merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, h.end);
    }
    let html = "", pos = 0;
    for (const m of merged) {
        html += sourceText.slice(pos, m.start);
        html += `<mark>${sourceText.slice(m.start, m.end)}</mark>`;
        pos = m.end;
    }
    return html + sourceText.slice(pos);
}
function detectLowConfidence(sourceText, summaryText) {
    const hedges = /\b(might|may|possibly|likely|uncertain|consider|suggests|appears)\b/i;
    return splitSentences(summaryText).map(s => ({
        sentence: s.trim(),
        low: !findBestSpan(sourceText, s) || hedges.test(s) || s.length < 12
    }));
}
function cleanedForConfidence(t) {
    return (t || "")
        .replace(/(^|\n)(Note ID:|Summary:|Allergies:).*\n?/g, "")
        .replace(/^"+|"+$/g, ""); // trim stray quotes from stringify or copy/paste
}
// Render for the active tab #
function renderPanelsFor(tabNum, sourceText, summaryText) {
    const useHi = document.getElementById(`cb-source-${tabNum}`)?.checked ?? true;
    const useCf = document.getElementById(`cb-conf-${tabNum}`)?.checked ?? true;
    const hiBox = document.getElementById(`sourceHighlightBox${tabNum}`);
    const cfBox = document.getElementById(`confidenceBox${tabNum}`);
    if (hiBox) hiBox.innerHTML = useHi
        ? applySourceHighlighting(sourceText, summaryText)
        : `<p class="placeholder-text">Source highlighting off.</p>`;
    if (cfBox) {
        if (!useCf) {
            cfBox.innerHTML = `<p class="placeholder-text">Confidence flags off.</p>`;
        } else {
            const summaryForConfidence = cleanedForConfidence(summaryText)
                .replace(/^Summary:\s*/, '');
            const flags = detectLowConfidence(sourceText, summaryForConfidence);
            cfBox.innerHTML = flags.map(f =>
                `<div class="flag ${f.low ? "low" : "ok"}">${f.low ? "⚠︎" : "✓"} ${f.sentence}</div>`
            ).join("");
        }
    }
}

//~ Backend call: summarize single note
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

        const msg =
            errPayload?.error?.message ||
            errPayload?.error ||
            errPayload?.message ||
            `Pipeline failed (${response.status})`;

        const code =
            errPayload?.code ||
            errPayload?.error?.code ||
            errPayload?.errorCode;

        const e = new Error(msg);
        if (code) e.code = code;
        throw e;
    }

    const result = await response.json();
    console.log("[PNF] summarizeNote() result keys:", Object.keys(result || {}));

    return {
        id,
        name,
        originalText: noteText,
        pipeline: {
            summary: result.summary || "",
            allergies: result.allergies || "",
        }
    };
}

function determineText(number) {
    if (number == "1") {
        console.log("text1");
        return document.getElementById("textInput");
    } else if (number == "2") {
        console.log("text2");
        return document.getElementById("textInput2");
    }
    else {
        console.log("text3");
        return document.getElementById("textInput3");
    }
}
function determineOutput(number) {
    if (number == "1") {
        console.log("redact1");
        return document.getElementById("redactedText");
    } else if (number == "2") {
        console.log("redact2");
        return document.getElementById("redactedText2");
    }
    else {
        return document.getElementById("redactedText3");
    }
}
//~ Main summarize handler
async function handleSummarizeClick() {
    function determineSpinner(number) {
        if (number == "1") {
            console.log("spinner1");
            return document.getElementById("loadingSpinner");
        } else if (number == "2") {
            console.log("Spinner2");
            return document.getElementById("loadingSpinner2");
        }
        else {
            return document.getElementById("loadingSpinner3");
        }
    }

    const textArea = determineText(sessionStorage.getItem("Window"));
    const spinner = determineSpinner(sessionStorage.getItem("Window"));
    const outputArea = determineOutput(sessionStorage.getItem("Window"));

    const manualText = (textArea.value || "").trim();

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
    outputArea.value = "";
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
                            errorCode: err.code || "",
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
            // If backend rejected the note, show that error.
            if (obj.pipeline.error) {
                obj.pipeline.summary = obj.pipeline.error;
            }
            // If backend succeeded but summary is genuinely empty, show a neutral message.
            else if (!obj.pipeline.summary || !obj.pipeline.summary.trim()) {
                obj.pipeline.summary = "No summary returned.";
            }
            if (obj.pipeline.allergies == "" || obj.pipeline.allergies == null) {
                if (obj.pipeline.allergies == null) {
                    obj.pipeline.allergies = "No Allergies listed";
                }
            }

            let allergyDisplay = obj.pipeline.allergies;

            // If it's a list (array), join it with commas. If it's a string, keep it.
            if (Array.isArray(allergyDisplay)) {
                allergyDisplay = allergyDisplay.join(", ");
            } else {
                // Ensure it's a string and handle empty/null cases
                allergyDisplay = String(allergyDisplay || "");
            }

            displayedText += "Note ID: " + obj.id + "\nSummary: "
                + (obj.pipeline.summary || "")
                + "\nAllergies: " + allergyDisplay + "\n\n";

            combinedText += JSON.stringify(obj.pipeline, null, 2);
            combinedText += "\n\n";
        }

        // Build the final object to store in sessionStorage
        const finalState = {
            combinedText,
            files: Object.values(multiSummaryData)
        };

        sessionStorage.setItem(SUMMARY_STORAGE_KEY, JSON.stringify(finalState)); //Stringified finalState

        if (sessionStorage.getItem("Window") == "1") {
            sessionStorage.setItem("Pretty Plaintext1", displayedText);
        }
        if (sessionStorage.getItem("Window") == "2") {
            sessionStorage.setItem("Pretty Plaintext2", displayedText);
        }
        if (sessionStorage.getItem("Window") == "3") {
            sessionStorage.setItem("Pretty Plaintext3", displayedText);
        }

        // Show combined JSON in textarea for now
        outputArea.value = displayedText;

        //+ build a sourceText and render feature panels for the active tab
        const active = sessionStorage.getItem("Window") || "1";
        const textArea = determineText(active);
        const sourceText = (textArea?.value || "").trim();
        renderPanelsFor(active, sourceText, outputArea.value);

        logToAudit("Summarization complete. JSON written to output.");

    } catch (err) {
        console.error("[PNF] Summarization failed:", err);
        logToAudit(`Summarization error: ${err.message}`);
        outputArea.value = `Summarization error:\n${err.message}`;
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
    function determineFile(number) {
        if (number == "1") {
            console.log("file 1");
            return document.getElementById("fileUpload");
        }
        else if (number == "2") {
            console.log("file 2");
            return document.getElementById("fileUpload2");
        }
        else {
            console.log("file 3");
            return document.getElementById("fileUpload3");
        }
    }
    const fileInput = determineFile(sessionStorage.getItem("Window"));
    const textArea = determineText(sessionStorage.getItem("Window"));

    if (!fileInput) {
        console.warn("[PNF] #fileUpload not found on page.");
        return;
    }

    window.__pnfUploadedNotes = [];

    attachFileUploadHandler(fileInput, (parsedFiles) => {
        window.__pnfUploadedNotes = parsedFiles;

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
    function determineDoc(number) {
        if (number == "1") {
            return document.getElementById("download-button-doc");
        } else if (number == "2") {
            return document.getElementById("download-button-doc2");
        } else {
            return document.getElementById("download-button-doc3");
        }
    }
    function determinePdf(number) {
        if (number == "1") {
            return document.getElementById("download-button-pdf");
        } else if (number == "2") {
            return document.getElementById("download-button-pdf2");
        } else {
            return document.getElementById("download-button-pdf3")
        }
    }
    function determineJson(number) {
        if (number == "1") {
            return document.getElementById("download-button-json");
        } else if (number == "2") {
            return document.getElementById("download-button-json2");
        } else {
            return document.getElementById("download-button-json3");
        }
    }

    function getActiveWin() {
        const v = sessionStorage.getItem("Window");
        return (v === "1" || v === "2" || v === "3") ? v : "1";
    }

    const active = getActiveWin();
    const outputArea = determineOutput(active);
    const docBtn = determineDoc(active);
    const pdfBtn = determinePdf(active);
    const jsonBtn = determineJson(active);
    canAddListener(active);

    function canAddListener(number) {
        if (number == "1" && sessionStorage.getItem("doc load 1") == "false") {
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
                    // Minimal: dump current editor content as JSON
                    downloadJson({ summary: text }, "Summary");
                    logToAudit("Download (.json) started.");
                });
            }
            sessionStorage.setItem("doc load 1", "true");
        } else if (number == "2" && sessionStorage.getItem("doc load 2") == "false") {
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
                    downloadJson({ summary: text }, "Summary");
                    logToAudit("Download (.json) started.");
                });
            }
            sessionStorage.setItem("doc load 2", "true");
        } else if (number == "3" && sessionStorage.getItem("doc load 3") == "false") {
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
                    downloadJson({ summary: text }, "Summary");
                    logToAudit("Download (.json) started.");
                });
            }
            sessionStorage.setItem("doc load 3", "true");
        }
    }
    canAddListener(sessionStorage.getItem("Window"));
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

function setupUndoButton() {
    const undo = document.getElementById("resetChanges");
    const undo2 = document.getElementById("resetChanges2");
    const undo3 = document.getElementById("resetChanges3");

    undo.addEventListener("click", () => {
        undoSummaryChanges();
    });
    undo2.addEventListener("click", () => {
        undoSummaryChanges();
    });
    undo3.addEventListener("click", () => {
        undoSummaryChanges();
    });
}

//~ DOMContentLoaded bootstrap
document.addEventListener("DOMContentLoaded", () => {
    console.log("[PNF] summarizer DOMContentLoaded");

    const redactBtn = document.getElementById("redactButton");
    const redactBtn2 = document.getElementById("redactButton2");
    const redactBtn3 = document.getElementById("redactButton3");
    if (redactBtn) {
        redactBtn.addEventListener("click", handleSummarizeClick);
    } else {
        console.warn("[PNF] #redactButton not found.");
    }
    if (redactBtn2) {
        redactBtn2.addEventListener("click", handleSummarizeClick);
    } else {
        console.warn("[PNF] #redactButton2 not found.");
    }
    if (redactBtn3) {
        redactBtn3.addEventListener("click", handleSummarizeClick);
    } else {
        console.warn("[PNF] #redactButton3 not found.");
    }

    setupAuditToggle();
    setupFileUpload();
    setupDownloadButtons();
    setupEditButton();
    setupUndoButton();
});


/*New Summary Page Logic Goes Here */
document.addEventListener("DOMContentLoaded", () => {
    sessionStorage.setItem("Pretty Plaintext1", "");
    sessionStorage.setItem("Pretty Plaintext2", "");
    sessionStorage.setItem("Pretty Plaintext3", "");
    sessionStorage.setItem("doc load 1", "false");
    sessionStorage.setItem("doc load 2", "false");
    sessionStorage.setItem("doc load 3", "false");
    const inputTabBtn = document.getElementById("sumOne");
    const redactedTabBtn = document.getElementById("sumTwo");
    const summaryTabBtn = document.getElementById("sumThree");

    const summaryOneSection = document.getElementById("summaryOneSection");
    const summaryTwoSection = document.getElementById("summaryTwoSection");
    const summaryThreeSection = document.getElementById("summaryThreeSection");

    //++ highlight + confidence
    ["1", "2", "3"].forEach(n => {
        const s = document.getElementById(`cb-source-${n}`);
        const c = document.getElementById(`cb-conf-${n}`);
        const out = determineOutput(n);
        const txt = determineText(n);
        function rerender() { renderPanelsFor(n, (txt?.value || ""), (out?.value || "")); }
        if (s) s.addEventListener("change", rerender);
        if (c) c.addEventListener("change", rerender);
    });


    function showTab(tabName) {
        // Hide all sections
        summaryOneSection.classList.add("hidden");
        summaryTwoSection.classList.add("hidden");
        summaryThreeSection.classList.add("hidden");

        // Remove active style from all tab buttons
        inputTabBtn.classList.remove("active");
        redactedTabBtn.classList.remove("active");
        summaryTabBtn.classList.remove("active");

        // Show selected section + style selected tab
        if (tabName === "input") {
            summaryOneSection.classList.remove("hidden");
            inputTabBtn.classList.add("active");
            sessionStorage.setItem("Window", "1");
        }
        else if (tabName === "redacted") {
            summaryTwoSection.classList.remove("hidden");
            redactedTabBtn.classList.add("active");
            sessionStorage.setItem("Window", "2");
        }
        else if (tabName === "summary") {
            summaryThreeSection.classList.remove("hidden");
            summaryTabBtn.classList.add("active");
            sessionStorage.setItem("Window", "3");
        }
        setupFileUpload();
        setupDownloadButtons();
    }

    //For the slider
    const toggleSwitch = document.getElementById("toggleSwitch");
    const fileUploadDiv = document.getElementById("fileUploadDiv");

    //Initial state of the slider is off (must be turned on for file upload)
    fileUploadDiv.style.display = 'none';

    toggleSwitch.addEventListener('change', function () {
        if (this.checked) {
            //Show the file upload button 
            fileUploadDiv.style.display = 'block';
        } else {
            //Hide the button
            fileUploadDiv.style.display = 'none';
        }
    });

    //For the 2nd slider
    const toggleSwitch2 = document.getElementById("toggleSwitch2");
    const fileUploadDiv2 = document.getElementById("fileUploadDiv2");

    //Initial state of the slider is off (must be turned on for file upload)
    fileUploadDiv2.style.display = 'none';

    toggleSwitch2.addEventListener('change', function () {
        if (this.checked) {
            //Show the file upload button 
            fileUploadDiv2.style.display = 'block';
        } else {
            //Hide the button
            fileUploadDiv2.style.display = 'none';
        }
    });

    //For the 3rd slider
    const toggleSwitch3 = document.getElementById("toggleSwitch3");
    const fileUploadDiv3 = document.getElementById("fileUploadDiv3");

    //Initial state of the slider is off (must be turned on for file upload)
    fileUploadDiv3.style.display = 'none';

    toggleSwitch3.addEventListener('change', function () {
        if (this.checked) {
            //Show the file upload button 
            fileUploadDiv3.style.display = 'block';
        } else {
            //Hide the button
            fileUploadDiv3.style.display = 'none';
        }
    });

    // Attach click handlers
    inputTabBtn.addEventListener("click", () => showTab("input"));
    redactedTabBtn.addEventListener("click", () => showTab("redacted"));
    summaryTabBtn.addEventListener("click", () => showTab("summary"));

    // Default tab on load
    showTab("input");
});