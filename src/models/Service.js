const mongoose = require('mongoose');
const serviceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  pdfPath: String,
  description: String, // Extracted PDF text ka snippet (400 chars)
  fullText: String,    // Full extracted text (RAG context ke liye)
  vertexDocId: String, // Vertex Index mein datapoint ID
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  indexed: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);