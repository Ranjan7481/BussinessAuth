const express = require("express");
const { createService } = require("../controllers/serviceController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const { uploadPdf } = require("../middlewares/uploadMiddleware");

const router = express.Router();

router.post("/create", authMiddleware, uploadPdf.single("pdf"), createService);

module.exports = router;
