/* ─────────────────────────────────────────────────────────────────────────────────────
 * File: Summary.js
 * Path: /server/models/Summary.js
 * Description: Schema for generated summaries.
 * NOTE: Not used (yet?)
 * ───────────────────────────────────────────────────────────────────────────────────── */

const mongoose = require('mongoose');

const SummarySchema = new mongoose.Schema({
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    //originalText: { type: String, required: false },
    //redactedText: { type: String, required: false },
    //summaryText: { type: String, required: true },
    accuracyScore: { type: Number, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    exportFormat: { type: String, enum: ['pdf', 'docx', 'json'], default: 'pdf' },
    isRedacted: { type: Boolean, default: true },
    feedbackNotes: { type: String, default: '' },
    sourceHighlights: [String],
    language: 'en' | 'es',
    confidenceFlags: [String]
});

module.exports = mongoose.model('Summary', SummarySchema);