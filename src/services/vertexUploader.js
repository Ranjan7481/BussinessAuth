const fs = require("fs");
const path = require("path");
const { createEmbedding, upsertDatapoints } = require("./vertexClient");

async function uploadCsvToVertex(filePath, leadIdOrServiceId, title = "") {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const summaryText = `${title}\n\n${content.slice(0, 5000)}`;
    const emb = await createEmbedding(summaryText);
    if (!emb || !Array.isArray(emb)) throw new Error("Embedding creation failed");

    const datapoint = {
      datapointId: `lead_csv_${leadIdOrServiceId}`,
      featureVector: emb,
      embeddingMetadata: {
        title: String(title || ""),
        textSnippet: summaryText.slice(0, 1000),
        leadId: String(leadIdOrServiceId),
        type: "lead-csv",
        source: path.basename(filePath)
      }
    };

    console.log("⤴️ uploadCsvToVertex - prepared datapoint:", {
      datapointId: datapoint.datapointId,
      vectorLen: datapoint.featureVector.length,
      metadataKeys: Object.keys(datapoint.embeddingMetadata)
    });

    const resp = await upsertDatapoints([datapoint]);
    if (!resp) throw new Error("Vertex upsertDatapoints failed");
    return datapoint.datapointId;
  } catch (err) {
    console.error("❌ ERROR uploadCsvToVertex:", err && (err.message || err));
    throw err;
  }
}

module.exports = { uploadCsvToVertex };
