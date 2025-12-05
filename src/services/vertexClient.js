const { GoogleAuth } = require("google-auth-library");
const { Storage } = require("@google-cloud/storage");
const path = require("path");

const PROJECT = process.env.GCP_PROJECT;
const LOCATION = process.env.GCP_LOCATION || "us-central1";
const EMB_MODEL = "text-embedding-004";
const GEN_MODEL = process.env.GEN_MODEL || "gemini-2.5-flash";
const INDEX_NAME = process.env.VERTEX_INDEX_NAME;
const BUCKET_NAME = process.env.GCS_BUCKET;

const auth = new GoogleAuth({
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});

const storage = new Storage({ keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS });

// -------------------------------------------
// Upload file to Google Cloud Storage
// -------------------------------------------
async function uploadFileToCloud(filePath) {
  try {
    const fileName = path.basename(filePath);
    await storage.bucket(BUCKET_NAME).upload(filePath, {
      destination: fileName,
    });
    return `gs://${BUCKET_NAME}/${fileName}`; // ✅ Cloud reference URI
  } catch (err) {
    console.error("❌ ERROR in uploadFileToCloud:", err);
    throw new Error("Cloud upload failed.");
  }
}

// -------------------------------------------
// Ask Gemini to clean text directly from PDF in Cloud Storage
// -------------------------------------------
async function cleanPdfWithGemini(cloudUri) {
  try {
    const client = await auth.getClient();
    const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/${LOCATION}/publishers/google/models/${GEN_MODEL}:generateContent`;

    const body = {
      contents: [
        {
          role: "user",
          parts: [
            {
              fileData: {
                fileUri: cloudUri,
                mimeType: "application/pdf",
              },
            },
            { text: "Please clean and normalize this PDF text for indexing." },
          ],
        },
      ],
    };

    const res = await client.request({ url, method: "POST", data: body });
    const text = res.data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini returned no text.");
    return text;
  } catch (err) {
    console.error("❌ ERROR in cleanPdfWithGemini:", err.response?.data || err);
    throw new Error("Gemini PDF cleaning failed.");
  }
}

// -------------------------------------------
// Ask Gemini to clean text directly from CSV in Cloud Storage
// -------------------------------------------
async function cleanCsvWithGemini(cloudUri) {
  try {
    const client = await auth.getClient();
    const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/${LOCATION}/publishers/google/models/${GEN_MODEL}:generateContent`;

    const body = {
      contents: [
        {
          role: "user",
          parts: [
            {
              fileData: {
                fileUri: cloudUri,
                mimeType: "text/csv",
              },
            },
            { text: "Extract and normalize lead data (especially interests/notes) for semantic indexing." },
          ],
        },
      ],
    };

    const res = await client.request({ url, method: "POST", data: body });
    const text = res.data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini returned no text.");
    return text;
  } catch (err) {
    console.error("❌ ERROR in cleanCsvWithGemini:", err.response?.data || err);
    throw new Error("Gemini CSV cleaning failed.");
  }
}

// -------------------------------------------
// Embedding + Upsert (implement your logic here)
// -------------------------------------------
async function createEmbedding(text) {
  // TODO: call Vertex AI embedding endpoint with EMB_MODEL
}

async function upsertDatapoints(datapoints = []) {
  // TODO: call Vertex AI Vector Search index with INDEX_NAME
}
// -------------------------------------------
// Generate plain text with Gemini
// -------------------------------------------
async function generateText(prompt) {
  try {
    const client = await auth.getClient();
    const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/${LOCATION}/publishers/google/models/${GEN_MODEL}:generateContent`;

    const body = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    };

    const res = await client.request({ url, method: "POST", data: body });
    const text = res.data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini returned no text.");
    return text;
  } catch (err) {
    console.error("❌ ERROR in generateText:", err.response?.data || err);
    throw new Error("Gemini text generation failed.");
  }
}

// -------------------------------------------
// Export all functions properly
// -------------------------------------------
module.exports = {
  uploadFileToCloud,
  cleanPdfWithGemini,
  cleanCsvWithGemini,   // ✅ now available
  createEmbedding,
  upsertDatapoints,
   generateText,   // ✅ now exported
};
