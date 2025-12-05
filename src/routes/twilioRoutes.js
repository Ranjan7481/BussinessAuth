const express = require("express");
const router = express.Router();
const twilioController = require("../controllers/twilioWebhookController"); // or twilioWebhookController if split

router.post("/voice/:callSessionId", twilioController.voiceTwiml);
router.post("/status", (req, res) => {
  console.log("Twilio status callback:", req.body);
  res.sendStatus(200);
});

module.exports = router;
