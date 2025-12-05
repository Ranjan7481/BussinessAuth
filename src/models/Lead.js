const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  title: { type: String, required: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },

  // CSV fields
  name: { type: String },
  phone: { type: String }, // Twilio calling ke liye
  interest: { type: String },

  // Cloud + Vertex references
  cloudUri: { type: String },       // gs:// bucket reference
  vertexDocId: { type: String },    // Vertex AI datapoint ID

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  indexed: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);
