// twilioService.js
const twilio = require("twilio");
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function makeCall(to, callSessionId) {
  return client.calls.create({
    to,
    from: process.env.TWILIO_PHONE_NUMBER,
    url: `${process.env.TWILIO_WEBHOOK_BASE_URL}/twilio/voice/${callSessionId}`,
    statusCallback: `${process.env.TWILIO_WEBHOOK_BASE_URL}/twilio/status`,
    statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
  });
}

module.exports = { makeCall };
