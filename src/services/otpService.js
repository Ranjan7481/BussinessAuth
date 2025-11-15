const crypto = require('crypto');

function createOtp() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = crypto.createHash('sha256').update(String(otp)).digest('hex');
  return { otp, otpHash };
}

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

module.exports = {
  createOtp,
  hashToken
};