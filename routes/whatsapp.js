const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('./auth');
const isAuthenticated = auth.isAuthenticated;
const { sendTextMessage, sendImageMessage, getChats, viewStatus } = require('../services/whatsapp');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Apply authentication middleware to all WhatsApp routes
router.use(isAuthenticated);

// Send message page
router.get('/send', (req, res) => {
  // Check if phone number is provided in query params
  const phoneNumber = req.query.number || '';
  res.render('whatsapp/send', { phoneNumber });
});

// Send message to specific number (direct link)
router.get('/send/:number', (req, res) => {
  const phoneNumber = req.params.number;
  res.render('whatsapp/send', { phoneNumber });
});

// Send text message
router.post('/send/text', async (req, res) => {
  try {
    const { to, message } = req.body;
    
    if (!to || !message) {
      req.flash('error', 'Phone number and message are required');
      return res.redirect('/whatsapp/send');
    }
    
    // Send the message
    await sendTextMessage(to, message);
    
    req.flash('success', 'Message sent successfully');
    res.redirect('/whatsapp/send');
  } catch (error) {
    console.error('Error sending text message:', error);
    req.flash('error', `Error sending message: ${error.message}`);
    res.redirect('/whatsapp/send');
  }
});

// Send image message
router.post('/send/image', upload.single('image'), async (req, res) => {
  try {
    const { to, caption } = req.body;
    
    if (!to || !req.file) {
      req.flash('error', 'Phone number and image are required');
      return res.redirect('/whatsapp/send');
    }
    
    // Send the image message
    await sendImageMessage(to, req.file.path, caption);
    
    req.flash('success', 'Image message sent successfully');
    res.redirect('/whatsapp/send');
  } catch (error) {
    console.error('Error sending image message:', error);
    req.flash('error', `Error sending image message: ${error.message}`);
    res.redirect('/whatsapp/send');
  }
});

// Chats page
router.get('/chats', async (req, res) => {
  try {
    // Get all chats
    const chats = await getChats();
    
    res.render('whatsapp/chats', { chats });
  } catch (error) {
    console.error('Error getting chats:', error);
    req.flash('error', `Error getting chats: ${error.message}`);
    res.redirect('/admin/dashboard');
  }
});

// View status
router.post('/status/view', async (req, res) => {
  try {
    const { contactId } = req.body;
    
    if (!contactId) {
      return res.status(400).json({
        success: false,
        message: 'Contact ID is required'
      });
    }
    
    // View the status
    const result = await viewStatus(contactId);
    
    res.json({
      success: true,
      message: 'Status view requested',
      result
    });
  } catch (error) {
    console.error('Error viewing status:', error);
    res.status(500).json({
      success: false,
      message: `Error viewing status: ${error.message}`
    });
  }
});

module.exports = router;