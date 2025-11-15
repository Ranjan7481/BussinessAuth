const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Gmail STARTTLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // MUST be a Gmail App Password
  },
});

// Send OTP email
const sendOtpEmail = async (to, otp) => {
  await transporter.sendMail({
    from: `"Business Auth" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your verification OTP",
    text: `Your OTP is ${otp}. It expires in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.`,
  });
};

// Send reset password email
const sendResetEmail = async (to, resetUrl) => {
  await transporter.sendMail({
    from: `"Business Auth" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Password reset link",
    text: `Reset your password using this link:\n\n${resetUrl}\n\nThis link expires in ${process.env.RESET_TOKEN_EXPIRY_MINUTES || 30} minutes.`,
  });
};

module.exports = { sendOtpEmail, sendResetEmail };
