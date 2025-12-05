const { generateText } = require("./vertexClient");

exports.extractPhoneFromVertex = async (vertexDocId) => {
  try {
    const prompt =
      `Extract ONLY the phone number from this document:
Document ID: ${vertexDocId}
Return ONLY the number, nothing else.`;

    const result = await generateText(prompt);

    if (!result) return null;

    return result.replace(/[^0-9]/g, "").trim(); // 10-digit clean number
  } catch (err) {
    console.error("Phone extraction failed:", err);
    return null;
  }
};
