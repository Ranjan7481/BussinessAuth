// src/middlewares/upload.js

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const os = require("os");

// Vercel + local dono ke liye safe directory (writable):
// /tmp/uploads (Vercel) ya OS ka temp folder
const uploadRoot = path.join(os.tmpdir(), "uploads");

if (!fs.existsSync(uploadRoot)) {
  fs.mkdirSync(uploadRoot, { recursive: true });
}

// Common storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadRoot); // e.g. /tmp/uploads
  },
  filename: (req, file, cb) => {
    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Sirf PDF allow for services
const pdfFileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed!"), false);
  }
};

// CSV ke liye common mimetypes allow karo
const csvFileFilter = (req, file, cb) => {
  if (
    file.mimetype === "text/csv" ||
    file.mimetype === "application/vnd.ms-excel" ||
    file.originalname.toLowerCase().endsWith(".csv")
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only CSV files are allowed!"), false);
  }
};

const uploadPdf = multer({
  storage,
  fileFilter: pdfFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

const uploadCsv = multer({
  storage,
  fileFilter: csvFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

module.exports = { uploadPdf, uploadCsv };
