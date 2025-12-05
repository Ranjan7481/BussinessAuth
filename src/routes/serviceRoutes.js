const express = require("express");
const { createService } = require("../controllers/serviceController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");

const router = express.Router();

// "file" must match the key name in Postman form-data
router.post("/create", authMiddleware, upload.single("file"), createService);

module.exports = router;
