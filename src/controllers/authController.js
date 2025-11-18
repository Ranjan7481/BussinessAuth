const crypto = require('crypto');
const validator = require('validator');
const User = require('../models/user.js');
const { hashPassword, comparePassword } = require('../utils/passwordUtils.js');
const { createOtp, hashToken } = require('../services/otpService.js');
const { sendOtpEmail, sendResetEmail } = require('../services/emailService.js');
const { generateToken } = require('../utils/generateToken.js');

// Config
const OTP_EXP_MIN = Number(process.env.OTP_EXPIRY_MINUTES || 10);
const RESET_EXP_MIN = Number(process.env.RESET_TOKEN_EXPIRY_MINUTES || 30);
const OTP_RESEND_MAX = Number(process.env.OTP_RESEND_MAX_PER_HOUR || 3);

/**
 * /auth/signup
 * - validate email, password, isBusiness
 * - create user with hashed password
 * - create OTP (store hashed), send plain OTP via email
 */
const signup = async (req, res, next) => {
  try {
    const { email, password, isBusiness } = req.body;

 
    if (!isBusiness) {
      return res.status(400).json({ success: false, message: 'You must sign up as a Business.' });
    }
    const strong = password && password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);
    if (!strong) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long and include uppercase, number and special character.' });
    }

    const existing = await User.findOne({email:email});
    // if (existing) return res.status(409).json({ success: false, message: 'Email already registered.' });
    if (existing) {
  if (!existing.isVerified) {
    // Delete old unverified account
    await User.deleteOne({ email });
  } else {
    return res.status(409).json({ success: false, message: 'Email already registered.' });
  }
}

    const hashed = await hashPassword(password);
    const { otp, otpHash } = createOtp();
    const otpExpiresAt = new Date(Date.now() + OTP_EXP_MIN * 60 * 1000);

    const user = await User.create({
      email,
      password: hashed,
      role: 'business',
      isVerified: false,
      otpHash,
      otpExpiresAt,
      otpResendCount: 0,
      otpResendWindowStart: new Date()
    });

    await sendOtpEmail(email, otp);

    return res.json({ success: true, message: 'OTP sent to your email for verification.', data: { userId: user._id } });
  } catch (err) {
    next(err);
  }
};

/**
 * /auth/verify-otp
 */
const verifyOtp = async (req, res, next) => {
  try {
    const { userId, otp } = req.body;
    if (!/^[0-9]{6}$/.test(String(otp))) return res.status(400).json({ success: false, message: 'Incorrect OTP.' });

    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    if (user.isVerified) return res.status(409).json({ success: false, message: 'User already verified.' });
    if (!user.otpHash || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return res.status(410).json({ success: false, message: 'OTP has expired. Please resend.' });
    }

    const otpHash = crypto.createHash('sha256').update(String(otp)).digest('hex');
    if (otpHash !== user.otpHash) return res.status(400).json({ success: false, message: 'Incorrect OTP.' });

    user.isVerified = true;
    user.otpHash = null;
    user.otpExpiresAt = null;
    user.otpResendCount = 0;
    user.otpResendWindowStart = null;
    await user.save();

    const token = generateToken({ id:user._id, role: user.role });
    return res.json({ success: true, message: 'Email verified successfully.', token });
  } catch (err) {
    next(err);
  }
};

/**
 * /auth/resend-otp
 */
const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required.' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: 'Email not found.' });
    if (user.isVerified) return res.status(400).json({ success: false, message: 'Email already verified.' });

    // reset window if more than 1 hour passed
    const now = new Date();
    if (!user.otpResendWindowStart || (now - user.otpResendWindowStart) > 60 * 60 * 1000) {
      user.otpResendCount = 0;
      user.otpResendWindowStart = now;
    }

    if ((user.otpResendCount || 0) >= OTP_RESEND_MAX) {
      return res.status(429).json({ success: false, message: 'Too many OTP requests. Try again later.' });
    }

    const { otp, otpHash } = createOtp();
    user.otpHash = otpHash;
    user.otpExpiresAt = new Date(Date.now() + OTP_EXP_MIN * 60 * 1000);
    user.otpResendCount = (user.otpResendCount || 0) + 1;
    await user.save();

    await sendOtpEmail(email, otp);
    return res.json({ success: true, message: 'New OTP sent to your email.' });
  } catch (err) {
    next(err);
  }
};

/**
 * /auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required.' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    if (!user.isVerified) return res.status(403).json({ success: false, message: 'Please verify your email first.' });

    const match = await comparePassword(password, user.password);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    const token = generateToken({ id: user._id, role: user.role });
    return res.json({ success: true, message: 'Login successful.', token, role: user.role });
  } catch (err) {
    next(err);
  }
};

/**
 * /auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(200).json({ success: true, message: 'If account exists, password reset link has been sent.' });

    const user = await User.findOne({ email });
    if (!user) return res.status(200).json({ success: true, message: 'If account exists, password reset link has been sent.' });

    // create reset token (send raw token via email, store hashed)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetHash = hashToken(resetToken);
    user.resetTokenHash = resetHash;
    user.resetTokenExpiresAt = new Date(Date.now() + RESET_EXP_MIN * 60 * 1000);
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL || process.env.SERVER_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    await sendResetEmail(email, resetUrl);

    return res.json({ success: true, message: 'Password reset link sent to your email.' });
  } catch (err) {
    next(err);
  }
};

/**
 * /auth/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Invalid or expired token.' });

    const hashed = hashToken(token);
    const user = await User.findOne({ resetTokenHash: hashed, resetTokenExpiresAt: { $gt: new Date() } });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired token.' });

    const strong = newPassword && newPassword.length >= 8 && /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword);
    if (!strong) return res.status(400).json({ success: false, message: 'Password does not meet requirements.' });

    user.password = await hashPassword(newPassword);
    user.resetTokenHash = null;
    user.resetTokenExpiresAt = null;
    await user.save();

    return res.json({ success: true, message: 'Password reset successful. Please login again.' });
  } catch (err) {
    next(err);
  }
};

/**
 * /auth/change-password (PUT) - auth required
 */
const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized.' });

    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized.' });

    const match = await comparePassword(oldPassword, user.password);
    if (!match) return res.status(401).json({ success: false, message: 'Incorrect old password.' });
    if (oldPassword === newPassword) return res.status(400).json({ success: false, message: 'New password must be different.' });

    const strong = newPassword && newPassword.length >= 8 && /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword);
    if (!strong) return res.status(400).json({ success: false, message: 'Password does not meet requirements.' });

    user.password = await hashPassword(newPassword);
    await user.save();

    return res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    next(err);
  }
};

/**
 * /auth/me (GET)
 */
const me = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized.' });

    const user = await User.findById(userId).select('email role isVerified createdAt updatedAt');
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * Google OAuth callback route handler
 * - Redirect to frontend with token param
 */
const googleCallback = async (req, res, next) => {
  try {
    // passport attaches user
    const user = req.user;
    if (!user) return res.redirect(`${process.env.CLIENT_URL || '/'}?error=oauth_failed`);

    const token = generateToken({ id: user._id, role: user.role });
    // redirect to client with token
    const redirectUrl = `${process.env.CLIENT_URL || process.env.SERVER_URL}/oauth-success?token=${token}`;
    return res.redirect(redirectUrl);
  } catch (err) {
    next(err);
  }
};

/**
 * /auth/logout (POST) - auth required
 * - Clear user session/token
 */
const logout = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized.' });

    // If using sessions, destroy session
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destroy error:', err);
        }
      });
    }

    // If using tokens, client should discard token on their end
    // Server-side, you could blacklist the token if needed (optional, requires token storage)
    return res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  signup,
  verifyOtp,
  resendOtp,
  login,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  me,
  googleCallback
};
