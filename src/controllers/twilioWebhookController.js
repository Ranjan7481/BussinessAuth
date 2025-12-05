// src/controllers/twilioWebhookController.js

const CallSession = require("../models/CallSession");
const Lead = require("../models/Lead");
const Service = require("../models/Service");
const { generateText } = require("../services/vertexClient");

function cleanScript(text) {
  return text
    .replace(/[*_`#>-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

exports.voiceTwiml = async (req, res) => {
  try {
    const cs = await CallSession.findById(req.params.callSessionId)
      .populate("leadId")     // fetch full lead document
      .populate("serviceId"); // fetch full service document

    if (!cs) {
      return res.status(404).type("text/xml")
        .send('<Response><Say>Script not found</Say></Response>');
    }

    const leadName = cs.leadId?.name || "Customer";
    const leadPhone = cs.leadId?.phone || "unknown number";
    const leadInterest = cs.leadId?.interest || "general business growth";
    const serviceName = cs.serviceId?.name || "our solution";

    // Build a prompt with actual dynamic data
    const prompt = `
      Create a cold call script for selling the service: ${serviceName}.
      Lead Name: ${leadName}.
      Lead Phone: ${leadPhone}.
      Lead Interest: ${leadInterest}.
      My Name: Ranjan Kumar from Wilson Automation.
      Keep it brief, friendly, and focused on the main benefit.
      Return ONLY spoken lines, no headings or explanations.
    `;

    let freshScript;
    try {
      freshScript = await generateText(prompt);
    } catch (err) {
      console.error("❌ Vertex AI generateText failed:", err.message);
    }

    let scriptText = freshScript || cs.script || "Hello, thanks for your time.";
    scriptText = cleanScript(scriptText);

    const safeScript = scriptText
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna" language="en-US">${safeScript}</Say>
</Response>`;

    res.type("text/xml").send(twiml);
  } catch (err) {
    console.error("❌ voiceTwiml error:", err);
    res.status(500).type("text/xml")
      .send('<Response><Say>Internal error retrieving script</Say></Response>');
  }
};
