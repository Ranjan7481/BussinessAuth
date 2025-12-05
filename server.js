// server.js

const dotenv = require('dotenv');
// Environment variables ko sabse pehle load karein
dotenv.config();

console.log("CREDS PATH:", process.env.GOOGLE_APPLICATION_CREDENTIALS);

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');

// Configuration Imports
const ConnectDB = require('./src/config/db.js');
require('./src/config/passport.js'); 

// Middleware / Auth Import (मान लीजिए कि यह authMiddleware.js में है)
// आपको यह फाइल बनानी होगी या फिर इसे आपके सर्वर में मौजूद auth/user check logic से replace करना होगा।
const { authMiddleware } = require('./src/middlewares/authMiddleware'); 

// Route Imports
const authRoutes = require('./src/routes/authRoutes.js');
// const adminRoutes = require require('./src/routes/adminRoutes.js');
const serviceRoutes = require('./src/routes/serviceRoutes.js');   
const leadRoutes = require('./src/routes/leadRoutes.js');         
const callRoutes = require('./src/routes/callRoutes.js');  
const twilioRoutes = require("./src/routes/twilioRoutes.js");

const app = express();

// --- Middleware Setup ---
app.use(express.json());
app.use(cookieParser());

// CORS Configuration
app.use(cors({
  // CLIENT_URL .env se aaega
  origin:"*", 
  credentials: true
}));

// Session Setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'keyboard cat',
  resave: false,
  saveUninitialized: false
}));

// Passport/Auth Setup
app.use(passport.initialize());
app.use(passport.session());

// --- Routes Setup ---

// 1. Unauthenticated Routes (Auth, Twilio webhooks)
app.use("/twilio", twilioRoutes);
app.use('/auth', authRoutes);

// 2. Auth Guard for API Routes (यहाँ authMiddleware का उपयोग करें)
// यदि आपका authMiddleware passport पर निर्भर नहीं करता है, तो आप इसे ऐसे उपयोग कर सकते हैं।
// मान लीजिए कि authMiddleware req.user.id को सेट करता है।
// app.use('/admin', authMiddleware, adminRoutes); 

// ⭐ API Routes using authMiddleware
app.use('/service', authMiddleware, serviceRoutes); 
app.use('/lead', authMiddleware, leadRoutes);        
app.use('/call', authMiddleware, callRoutes);        

// health check route
app.get('/', (req, res) => res.json({ status: 'ok', user: req.user?.id })); // check user status

// --- Error Handling ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server error'
  });
});

const PORT = process.env.PORT || 5000;

// --- DB + Server Start ---
ConnectDB()
  .then(() => {
    console.log('Database connected ✔');
    app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });