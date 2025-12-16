/* ─────────────────────────────────────────────────────────────────────────────────────
 * File: summaryRoutes.js
 * Path: /server/routes/summaryRoutes.js
 * Description: Modularized summary routes.
 * ───────────────────────────────────────────────────────────────────────────────────── */

//~ Imports
import express from "express";
import { AI_MODE } from "../config/env.js";
import {
    summarizeWithOpenAiCloud,
    summarizeWithPhi4,
    //summarizeWithPhi4Mini,
} from "../controllers/summaryController.js";
import { logAIStart, logAITiming, logAISuccess, logAIFailure } from "../utilities/logHelper.js";

const router = express.Router();


//~ Universal Summarize (decides based on AI_MODE)
router.post("/", async (req, res) => {
    const route = "/api/summarize";
    const note = typeof req.body === "string" ? req.body : req.body.note;

    logAIStart(req, route, note?.length || 0, AI_MODE);

    if (!note) return res.status(400).json({ error: "Missing note in request" });

    const start = performance.now();
    try {
        let result;

        if (AI_MODE === "local") {
            console.log("Local LLM mode -> summarizeWithPhi4()");
            result = await summarizeWithPhi4({ note });
        } else {
            console.log("OpenAI mode -> summarizeWithOpenAiCloud()");
            result = await summarizeWithOpenAiCloud({ note });
        }

        const end = performance.now();
        logAITiming(req, route, start, end);
        logAISuccess(req, route, result);
        return res.json(result);
    } catch (err) {
        logAIFailure(req, route, err);
        return res.status(500).json({ error: "Summarization failed" });
    }
});

//~ PIPELINE MODE
//. Full Pipeline Summarization (Redact -> Summarize -> Reintegration)
import { PipelineManager } from "../pipeline/PipelineManager.js";

router.post("/pipeline", async (req, res) => {
    const route = "/api/summarize/pipeline";
    const note = typeof req.body === "string" ? req.body : req.body.note;
    if (!note) return res.status(400).json({ error: "Missing note in request" });

    logAIStart(req, route, note.length, AI_MODE);
    const start = performance.now();
    try {
        const pipeline = new PipelineManager({ provider: AI_MODE === "local" ? "phi4" : "openai" });
        const result = await pipeline.execute(note);

        const end = performance.now();
        logAITiming(req, route, start, end);
        logAISuccess(req, route, result);
        return res.json(result);
    } catch (err) {
        logAIFailure(req, route, err);
        return res.status(500).json({ error: err.message || "Pipeline summarization failed" });
    }
});


//~ MULTI-FILE PIPELINE
//. Redact -> Summarize -> Reintegration for an array of notes
router.post("/pipeline/multi", async (req, res) => {
    const route = "/api/summarize/pipeline/multi";

    // Accept notes from body OR from session (uploaded files)
    const notes =
        Array.isArray(req.body?.notes) && req.body.notes.length > 0
            ? req.body.notes
            : req.session?.uploadedNotes;

    if (!notes || !Array.isArray(notes) || notes.length === 0) {
        return res.status(400).json({
            error: "No notes provided. Upload files first or send { notes: [{id, name, text}, ...] }."
        });
    }

    console.log(`[PNF] Multi-file pipeline request: ${notes.length} notes`);

    const totalLength = notes.map(n => n.text || "").join(" ").length;
    //logAIStart(route, notes.join(" ").length, AI_MODE); // rough total length
    logAIStart(req, route, totalLength, AI_MODE);
    const start = performance.now();
    try {
        const result = await pipeline.executeMany(notes);
        const end = performance.now();
        logAITiming(req, route, start, end);
        logAISuccess(req, route, result);
        return res.json(result);
    } catch (err) {
        logAIFailure(req, route, err);
        return res.status(500).json({ error: err.message || "Multi-file pipeline failed" });
    }
});

//~ Explicit model endpoints
//. OpenAI Summarize
router.post("/openai", async (req, res) => {
    const route = "/api/summarize/openai";
    const start = performance.now();
    try {
        logAIStart(route, (req.body?.note || "").length, "openai");
        const result = await summarizeWithOpenAiCloud(req.body);
        const end = performance.now();
        logAITiming(route, start, end);
        logAISuccess(route, result);
        res.json(result);
    } catch (err) {
        logAIFailure(route, err);
        res.status(500).json({ error: "Summarization failed" });
    }
});

//. Phi-4 Summarize
router.post("/phi4", async (req, res) => {
    const route = "/api/summarize/phi4";
    const start = performance.now();
    try {
        logAIStart(route, (req.body?.note || "").length, "local-phi4");
        const result = await summarizeWithPhi4(req.body);
        const end = performance.now();
        logAITiming(route, start, end);
        logAISuccess(route, result);
        res.json(result);
    } catch (err) {
        logAIFailure(route, err);
        res.status(500).json({ error: "Phi-4 summarization failed" });
    }
});

//. Phi-4-Mini Summarize
router.post("/phi4-mini", async (req, res) => {
    const route = "/api/summarize/phi4-mini";
    const start = performance.now();
    try {
        logAIStart(route, (req.body?.note || "").length, "local-phi4-mini");
        const result = await summarizeWithPhi4Mini(req.body);
        const end = performance.now();
        logAITiming(route, start, end);
        logAISuccess(route, result);
        res.json(result);
    } catch (err) {
        logAIFailure(route, err);
        res.status(500).json({ error: "Phi-4-Mini summarization failed" });
    }
});

// Exports 
export default router;
