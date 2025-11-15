const express = require('express');
const passport = require('passport');
// ensure passport strategies are registered when this routes file is loaded
require('../config/passport.js');

const {
  signup, verifyOtp, resendOtp, login,
  forgotPassword, resetPassword, changePassword,
  me, logout, googleCallback
} = require('../controllers/authController.js');
const { authMiddleware } = require('../middlewares/authMiddleware.js');
const { loginLimiter, otpRequestLimiter, forgotLimiter } = require('../middlewares/rateLimiter.js');

const router = express.Router();

router.post('/signup', otpRequestLimiter, signup);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', otpRequestLimiter, resendOtp);

router.post('/login', loginLimiter, login);
router.post('/logout', authMiddleware, logout);
router.post('/forgot-password', forgotLimiter, forgotPassword);
router.post('/reset-password', resetPassword);
router.put('/change-password', authMiddleware, changePassword);
router.get('/me', authMiddleware, me);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false }), googleCallback);

module.exports = router;
