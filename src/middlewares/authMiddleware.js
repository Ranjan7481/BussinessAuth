const jwt =require( 'jsonwebtoken');
const User =  require('../models/user.js');

 const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.cookies?.token;
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) token = authHeader.split(' ')[1];
    else if (req.cookies?.token) token = req.cookies.token;

    if (!token) return res.status(401).json({ success: false, message: 'Unauthorized.' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select('-password -otpHash -resetTokenHash');
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized.' });

    req.user = { id: user._id, role: user.role, email: user.email, isVerified: user.isVerified };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

 const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Access denied.' });
  next();
};


module.exports = { authMiddleware, adminOnly };