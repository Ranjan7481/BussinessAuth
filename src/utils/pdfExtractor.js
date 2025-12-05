// utils/pdfExtractor.js
const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

exports.extractPdfText = async (filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`PDF file not found at: ${filePath}`);
  }
  
  try {
    const data = new Uint8Array(fs.readFileSync(filePath));
    const pdf = await pdfjsLib.getDocument({ data }).promise;

    let text = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map(item => item.str).join(" ");
      text += strings + "\n";
    }

    return text.trim();
  } catch (err) {
    console.error("PDF EXTRACT ERROR:", err);
    throw new Error("Unable to extract text from PDF. Check file format or pdfjs-dist installation.");
  }
};