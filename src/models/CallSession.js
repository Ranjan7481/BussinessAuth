const mongoose = require("mongoose");

const CallSessionSchema = new mongoose.Schema({
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: "Lead" },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
  phone: String,
  script: String,
  status: { type: String, default: "pending" }, // pending, initiated, in-progress, completed, failed
  twilioSid: String,
  cloudUri: String,
  vertexDocId: String
}, { timestamps: true });

module.exports = mongoose.model("CallSession", CallSessionSchema);
