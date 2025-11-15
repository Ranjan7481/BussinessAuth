const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user.js');
const { comparePassword } = require('../utils/passwordUtils.js');

const router = express.Router();

/**
 * Admin login (manual admin user must exist in DB with role: 'admin')
 * Request: { email, password }
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const admin = await User.findOne({ email, role: 'admin' });
    if (!admin) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    const match = await comparePassword(password, admin.password);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    const token = jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });
    return res.json({ success: true, token, role: 'admin' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
