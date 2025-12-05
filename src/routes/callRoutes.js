const express = require("express");
const { callAllLeads } = require("../controllers/callController");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/start", authMiddleware, callAllLeads);

module.exports = router;
