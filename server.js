// server.js
const dotenv = require('dotenv');
dotenv.config();

console.log("CREDS PATH:", process.env.GOOGLE_APPLICATION_CREDENTIALS);

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');

const ConnectDB = require('./src/config/db.js');
require('./src/config/passport.js');

const { authMiddleware } = require('./src/middlewares/authMiddleware');

const authRoutes = require('./src/routes/authRoutes.js');
const serviceRoutes = require('./src/routes/serviceRoutes.js');
const leadRoutes = require('./src/routes/leadRoutes.js');
const callRoutes = require('./src/routes/callRoutes.js');
const twilioRoutes = require("./src/routes/twilioRoutes.js");

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));


app.use(cors({
  origin: "*",
}));

app.use(session({
  secret: process.env.SESSION_SECRET || 'keyboard cat',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/twilio", twilioRoutes);
app.use("/auth", authRoutes);

app.use("/service", authMiddleware, serviceRoutes);
app.use("/lead", authMiddleware, leadRoutes);
app.use("/call", authMiddleware, callRoutes);

app.get("/", (req, res) => res.json({ status: "ok", user: req.user?.id }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Server error"
  });
});

const PORT = process.env.PORT || 5000;

ConnectDB()
  .then(() => {
    console.log("Database connected ✔");
    app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));
  })
  .catch((err) => {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  });
