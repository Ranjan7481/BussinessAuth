const fs = require('fs');
const Lead = require('../models/Lead');
const { parseCsv } = require('../utils/csvParser');
const { uploadFileToCloud, cleanCsvWithGemini, createEmbedding, upsertDatapoints } = require('../services/vertexClient');

const safeUnlink = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

exports.createLead = async (req, res, next) => {
  try {
    const { title, serviceId } = req.body;
    const filePath = req.file?.path;

    if (!title || !serviceId || !filePath) {
      safeUnlink(filePath);
      return res.status(400).json({ message: 'Title, Service ID, and CSV file required' });
    }

    // 1. Upload CSV to Cloud Storage
    const cloudUri = await uploadFileToCloud(filePath);

    // 2. Parse CSV locally for structured fields (name, phone, interest)
    const leadDataArray = await parseCsv(filePath);
    if (leadDataArray.length === 0) {
      safeUnlink(filePath);
      return res.status(400).json({ message: 'No valid leads found in CSV file.' });
    }

    // 3. Ask Gemini to clean/normalize CSV content (semantic fields)
    const cleanedText = await cleanCsvWithGemini(cloudUri);

    // 4. Create embedding for semantic search
    const embedding = await createEmbedding(`${title}\n\n${cleanedText.slice(0, 10000)}`);
    const datapointId = `lead_${Date.now()}_${req.user.id}`;

    // 5. Upsert into Vertex AI Vector Search
    await upsertDatapoints([{
      datapointId,
      featureVector: embedding,
      embeddingMetadata: {
        title,
        serviceId,
        cloudUri,
        text_snippet: cleanedText.slice(0, 500),
      },
    }]);

    // 6. Save structured leads in MongoDB
    const leadsToInsert = leadDataArray.map(data => ({
      ...data,
      title,
      serviceId,
      createdBy: req.user?.id,
      indexed: true,
      cloudUri,
      vertexDocId: datapointId
    }));

    const insertedLeads = await Lead.insertMany(leadsToInsert);

    // 7. Delete local uploaded file
    safeUnlink(filePath);

    res.json({
      success: true,
      message: `${insertedLeads.length} leads created successfully for Service ID: ${serviceId}`,
      count: insertedLeads.length,
      leads: insertedLeads
    });
  } catch (err) {
    safeUnlink(req.file?.path);
    next(err);
  }
};
