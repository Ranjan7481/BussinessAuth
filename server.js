const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');

const ConnectDB = require('./src/config/db.js');
require('./src/config/passport.js'); // passport strategies

const authRoutes = require('./src/routes/authRoutes.js');
const adminRoutes = require('./src/routes/adminRoutes.js');

const app = express();


app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// session required if using Passport login sessions (optional)
app.use(session({
  secret: process.env.SESSION_SECRET || 'keyboard cat',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);

// Basic health route
app.get('/', (req, res) => res.json({ status: 'ok' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;

// start after DB connection
ConnectDB()
  .then(() => {
    console.log('Database connection established...');
    app.listen(PORT, () => {
      console.log(`Server running on ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err && err.message ? err.message : err);
    process.exit(1);
  });
