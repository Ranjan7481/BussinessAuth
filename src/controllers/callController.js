const Lead = require("../models/Lead");
const Service = require("../models/Service");
const CallSession = require("../models/CallSession");
const { generateText } = require("../services/vertexClient");
const { makeCall } = require("../services/twilioService");

exports.callAllLeads = async (req, res) => {
  try {
    const leads = await Lead.find({
      createdBy: req.user.id,
      serviceId: { $exists: true, $ne: null }
    }).lean();

    if (!leads.length) {
      return res.status(404).json({ success: false, message: "No leads found to call" });
    }

    const serviceIds = [...new Set(leads.map(l => l.serviceId.toString()))];
    const services = await Service.find({ _id: { $in: serviceIds } }).lean();
    const serviceMap = services.reduce((acc, s) => {
      acc[s._id.toString()] = s;
      return acc;
    }, {});

    for (let lead of leads) {
      const service = serviceMap[lead.serviceId.toString()];
      if (!service) continue;

      let finalPhone = lead.phone.toString().trim();
      if (!finalPhone.startsWith("+")) finalPhone = "+91" + finalPhone;

      const prompt = `
        Create a professional cold call script for selling the service titled: ${service.title}.
        Lead Name: ${lead.name || "Customer"}
        Lead Interest: ${lead.interest || "General Inquiry"}
        Service Description: ${service.description || "N/A"}
        Keep the script brief, friendly, and focused on the main benefit.
      `;
      const script = await generateText(prompt);

      if (!script) {
        console.error("Script generation failed for lead:", lead._id);
        continue;
      }

      const cs = await CallSession.create({
        leadId: lead._id,
        serviceId: lead.serviceId,
        phone: finalPhone,
        script,
        status: "pending",
        cloudUri: lead.cloudUri,
        vertexDocId: lead.vertexDocId
      });

      try {
        const twilioCall = await makeCall(finalPhone, cs._id);
        cs.twilioSid = twilioCall.sid;
        cs.status = "initiated";
        await cs.save();
        console.log("✅ CallSession created:", cs._id);
      } catch (err) {
        cs.status = "failed";
        await cs.save();
        console.error("❌ Twilio call failed:", err.message);
      }
    }

    res.json({ success: true, message: "Calling process started for all leads" });
  } catch (err) {
    console.error("Error in callAllLeads:", err);
    res.status(500).json({ success: false, message: err.message || "Internal Server Error" });
  }
};
