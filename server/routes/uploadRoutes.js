/* ─────────────────────────────────────────────────────────────────────────────────────
 * File: uploadRoutes.js
 * Path: /server/routes/uploadRoutes.js
 * Description: Modularized upload routes.
 * ───────────────────────────────────────────────────────────────────────────────────── */

//~ Imports
import express from "express";
import multer from "multer";
import * as pdfParse from "pdf-parse"; // for pdf files
import mammoth from "mammoth"; // for docx files
import path from "path";
import fs from "fs";

const router = express.Router();

//. Temporary storage folder
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

//. Configure multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + "-" + file.originalname);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB limit
    fileFilter: (req, file, cb) => {
        const allowed = ["text/plain", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
        allowed.includes(file.mimetype)
            ? cb(null, true)
            : cb(new Error("Unsupported file type"));
    },
});

//. Text extraction function
const extractTextFromFile = (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    let extractedText = "";

    return new Promise((resolve, reject) => {
        if (ext === ".txt") {
            // For .txt files, simply read the content
            extractedText = fs.readFileSync(filePath, "utf8");
            resolve(extractedText);
        } else if (ext === ".pdf") {
            // For .pdf files, use pdf-parse to extract text
            const pdfBuffer = fs.readFileSync(filePath);
            pdfParse(pdfBuffer).then((data) => {
                extractedText = data.text;
                resolve(extractedText);
            }).catch(reject);
        } else if (ext === ".docx") {
            // For .docx files, use mammoth to extract text
            const docxBuffer = fs.readFileSync(filePath);
            mammoth.extractRawText({ buffer: docxBuffer })
                .then((result) => {
                    extractedText = result.value;
                    resolve(extractedText);
                })
                .catch(reject);
        } else {
            reject(new Error("Unsupported file type for text extraction"));
        }
    });
};

//~ POST /api/upload
router.post("/", upload.array("notes", 5), async (req, res) => {
    const fileList = req.files.map(f => ({
        original: f.originalname,
        path: f.path,
        sizeKB: (f.size / 1024).toFixed(1),
    }));

    try {
        // Extract text from uploaded files
        const textPromises = req.files.map(file => extractTextFromFile(file.path));
        const texts = await Promise.all(textPromises);

        // Store the extracted text and file info in session (or memory)
        req.session.uploadedFiles = texts; // Store extracted text in session

        res.json({
            success: true,
            message: `${req.files.length} file(s) uploaded successfully.`,
            files: fileList,
        });
    } catch (error) {
        res.status(500).send("Error processing files: " + error.message);
    }
});


export default router;

/*
router.post("/", upload.array("notes", 5), async (req, res) => {
    const fileList = req.files.map(f => ({
        original: f.originalname,
        path: f.path,
        sizeKB: (f.size / 1024).toFixed(1),
    }));

    try {
        const textPromises = req.files.map(file => extractTextFromFile(file.path));

        // Wait for all text extraction to finish
        const texts = await Promise.all(textPromises);

        // Example: Run redaction on the extracted text
        const redactedTexts = texts.map(text => redactPHI(text)); // Add your PHI redaction function here

        // After redaction, call AI summarization
        const aiSummaries = await Promise.all(redactedTexts.map(redactedText => summarize(redactedText)));

        res.json({
            success: true,
            message: `${req.files.length} file(s) uploaded and processed successfully.`,
            files: fileList,
            summaries: aiSummaries, // Send the AI summaries along with the uploaded files
        });
    } catch (error) {
        res.status(500).send("Error processing files: " + error.message);
    }
});
*/