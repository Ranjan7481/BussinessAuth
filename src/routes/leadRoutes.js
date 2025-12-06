// src/routes/leadRoutes.js

const express = require("express");
const { createLead } = require("../controllers/leadController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const { uploadCsv } = require("../middlewares/uploadMiddleware");

const router = express.Router();

// CSV upload ke liye (authenticated user ke liye)
router.post("/create", authMiddleware, uploadCsv.single("csv"), createLead);

module.exports = router;
