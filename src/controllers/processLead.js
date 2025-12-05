// src/controllers/processLead.js

const Lead = require("../models/Lead");
const fs = require("fs");
const csv = require("csv-parser");

const {
  createEmbedding,
  searchIndex,
  generateTextWithContext,
} = require("../services/vertexClient");

exports.processLead = async (req, res, next) => {
  try {
    const { leadId, rowIndex, phone } = req.body;

    if (!leadId) return res.status(400).json({ message: "leadId required" });
    if (rowIndex === undefined)
      return res.status(400).json({ message: "rowIndex required" });

    // 1) Fetch lead from DB
    const lead = await Lead.findById(leadId);
    if (!lead) return res.status(404).json({ message: "Lead not found" });

    // 2) Read CSV rows
    const csvPath = lead.csvFilePath;
    if (!csvPath)
      return res.status(500).json({ message: "CSV path missing" });

    const rows = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on("data", (data) => rows.push(data))
        .on("end", resolve)
        .on("error", reject);
    });

    if (!rows[rowIndex]) {
      return res.status(400).json({ message: "Row index out of range" });
    }

    const row = rows[rowIndex];

    // 3) EMBEDDING GENERATION
    const qEmb = await createEmbedding(
      `${lead.title} ${row.name || ""} ${row.email || ""} ${phone || ""}`
    );
    console.log("EMBEDDING RESPONSE:", qEmb);

    // 4) VERTEX SEARCH
    const searchResp = await searchIndex(qEmb, 10);
    console.log("SEARCH RESPONSE RAW:", searchResp);

    const neighbors = searchResp?.results?.[0]?.neighbors || [];

    // 5) EXTRACT CONTEXT
    const serviceContexts = neighbors
      .filter((n) => n.payload?.type === "service")
      .map((n) => n.payload?.text);

    const leadContexts = neighbors
      .filter((n) => n.payload?.type === "lead-csv")
      .map((n) => n.payload?.text);

    const contexts = [...serviceContexts, ...leadContexts];
    console.log("CONTEXTS USED:", contexts);

    // 6) GENERATE CALL SCRIPT
    const script = await generateTextWithContext(lead.title, contexts);

    // 7) RESPONSE
    res.json({
      success: true,
      message: "Script generated",
      leadTitle: lead.title,
      targetRow: row,
      contextsUsed: contexts,
      script,
    });
  } catch (error) {
    console.error("Error in processLead:", error);
    next(error);
  }
};
