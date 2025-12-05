const Service = require("../models/Service");
const { uploadFileToCloud, cleanPdfWithGemini, createEmbedding, upsertDatapoints } = require("../services/vertexClient");

exports.createService = async (req, res) => {
  try {
    const { title } = req.body;
    const filePath = req.file?.path;
console.log("req.body:", req.body);
console.log("req.file:", req.file);

    if (!title || !filePath) {
      return res.status(400).json({ success: false, message: "Service title and PDF file required" });
    }

    // 1. Upload PDF to your bucket
    const cloudUri = await uploadFileToCloud(filePath);

    // 2. Ask Gemini to read and clean text directly from Cloud Storage
    const cleanedText = await cleanPdfWithGemini(cloudUri);

    // 3. Create embedding
    const embedding = await createEmbedding(`${title}\n\n${cleanedText.slice(0, 10000)}`);

    const datapointId = `service_${Date.now()}_${req.user.id}`;

    // 4. Upsert datapoint
    await upsertDatapoints([{
      datapointId,
      featureVector: embedding,
      embeddingMetadata: {
        title,
        text_snippet: cleanedText.slice(0, 500),
        cloudUri, // ✅ reference to your bucket
      },
    }]);

    // 5. Save meta to MongoDB
    const service = await Service.create({
      title,
      pdfPath: filePath,
      description: cleanedText.slice(0, 400),
      fullText: cleanedText,
      vertexDocId: datapointId,
      createdBy: req.user?.id,
      indexed: true,
      cloudUri,
    });

    return res.json({ success: true, message: "Service created and indexed.", service });
  } catch (err) {
    console.error("Unexpected error in createService:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
