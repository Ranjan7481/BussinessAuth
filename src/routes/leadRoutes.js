const express = require('express');
const multer = require('multer');
const { createLead } = require('../controllers/leadController');    

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

// CSV upload ke liye
router.post('/create', upload.single('csv'), createLead);

module.exports = router;
