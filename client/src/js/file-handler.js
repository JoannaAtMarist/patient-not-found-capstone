/* ─────────────────────────────────────────────────────────────────────────────────────
 * File: file-handler.js
 * Path: /client/src/js/file-handler.js
 * Description: Shared helper functions for file upload + download on the summarizer.
 * 
 * - parseUploadedFiles(inputEl): reads all selected files into text.
 * - attachFileUploadHandler(inputEl, onParsed): convenience wrapper for change event.
 * - downloadDoc(text): downloads given text as a .doc file.
 * - downloadPdf(text): downloads given text as a .pdf file (uses global jsPDF).
 * ───────────────────────────────────────────────────────────────────────────────────── */

console.log("[PNF] file-handler.js loaded");

const MAX_FILES = 5;

//~ Generate unique IDs for uploaded files
function generateFileId() {
    return crypto.randomUUID();
}

//~ Helpers: read files as text (.txt/.json)
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = e => resolve((e.target?.result || "").toString());
        reader.onerror = e => reject(e);

        reader.readAsText(file);
    });
}

/**
 * Read selected files (txt/json) into text content with a max of five files.
 * @param {HTMLInputElement} fileInputEl - File input element to read from.
 * @returns {Promise<Array<{id:string,name:string,text:string}>>} Parsed file data.
 */
export async function parseUploadedFiles(fileInputEl) {
    const filesList = fileInputEl?.files;
    if (!filesList || !filesList.length) return [];

    // Turn FileList into an array and enforce the 5-file limit
    const allFiles = Array.from(filesList);
    if (allFiles.length > MAX_FILES) {
        console.warn(
            `[PNF] User selected ${allFiles.length} files; limiting to first ${MAX_FILES}.`
        );
        // TODO: Replace alert() with an inline UI message.
        alert(`You selected ${allFiles.length} files. Only the first ${MAX_FILES} will be used.`);
    }

    const filesToProcess = allFiles.slice(0, MAX_FILES);
    const results = [];

    for (const file of filesToProcess) {
        const id = generateFileId();
        const name = file.name || "Unnamed File";
        const lower = name.toLowerCase();

        try {
            if (lower.endsWith(".txt") || lower.endsWith(".json")) {
                let text = await readFileAsText(file);

                if (lower.endsWith(".json")) {
                    try {
                        const parsed = JSON.parse(text);
                        text = JSON.stringify(parsed, null, 2);
                    } catch {
                        // Keep raw text if JSON.parse fails
                    }
                }

                results.push({ id, name, text });
            } else {
                results.push({
                    id,
                    name,
                    text: `[${name}] could not be parsed in-browser. Please add backend parsing for this file type.`
                });
            }
        } catch (err) {
            console.error("[PNF] Error reading file:", name, err);
            results.push({
                id,
                name,
                text: `[${name}] failed to read: ${err.message || err}`
            });
        }
    }

    return results;
}

/**
 * Attach a change listener to a file input and invoke a callback with parsed files.
 * @param {HTMLInputElement} fileInputEl - File input element to monitor.
 * @param {Function} onParsed - Callback invoked with parsed files array.
 */
export function attachFileUploadHandler(fileInputEl, onParsed) {
    if (!fileInputEl) {
        console.warn("[PNF] attachFileUploadHandler: no file input element found.");
        return;
    }

    fileInputEl.addEventListener("change", async () => {
        const parsed = await parseUploadedFiles(fileInputEl);
        if (!parsed || !parsed.length) return;

        if (typeof onParsed === "function") {
            onParsed(parsed);
        }
    });
}

//~ Download helpers
export function downloadDoc(text, baseName = "Summary") {
    const blob = new Blob([text || ""], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    const dateInfo = new Date().toISOString().replace(/[:.]/g, "-");

    link.download = `${baseName} ${dateInfo}.doc`;
    link.href = url;
    link.style.display = "none";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

export function downloadPdf(text, baseName = "Summary") {
    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert("PDF export is not available (jsPDF not loaded).");
        return;
    }

    const doc = new window.jspdf.jsPDF();
    const content = text || "";
    const lines = doc.splitTextToSize(content, 180);

    doc.text(lines, 10, 10);

    const dateInfo = new Date().toISOString().replace(/[:.]/g, "-");
    doc.save(`${baseName} ${dateInfo}.pdf`);
}

//~ Download JSON helper
export function downloadJson(data, baseName = "Summary") {
    try {
        const json = JSON.stringify(data ?? {}, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        const dateInfo = new Date().toISOString().replace(/[:.]/g, "-");

        link.download = `${baseName} ${dateInfo}.json`;
        link.href = url;
        link.style.display = "none";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (err) {
        console.error("[PNF] Failed to create JSON download:", err);
        alert("Sorry, something went wrong while preparing the JSON download.");
    }
}
