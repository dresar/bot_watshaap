const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('./auth');
const isAuthenticated = auth.isAuthenticated;
const { getStatus, getQRCode, resetQRCode, logout } = require('../services/whatsapp');
const { getScheduledMessages, addScheduledMessage, cancelScheduledMessage, updateScheduledMessage } = require('../services/scheduler');
const { saveCredentials, getCredentials, testConnection: testSheetsConnection } = require('../services/sheets');
const { testConnection: testAIConnection } = require('../services/ai');

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

// Apply authentication middleware to all admin routes
router.use(isAuthenticated);

// Dashboard
router.get('/dashboard', (req, res) => {
  const status = getStatus();
  res.render('admin/dashboard', { status });
});

// WhatsApp connection page
router.get('/whatsapp', (req, res) => {
  const status = getStatus();
  const qrCode = getQRCode();
  res.render('admin/whatsapp', { status, qrCode });
});

// Get QR code
router.get('/whatsapp/qr', (req, res) => {
  const qrCode = getQRCode();
  if (qrCode) {
    res.json({ success: true, qrCode });
  } else {
    res.json({ success: false, message: 'QR code not available' });
  }
});

// Reset WhatsApp connection
router.post('/whatsapp/reset', async (req, res) => {
  try {
    await logout();
    resetQRCode();
    req.flash('success', 'WhatsApp connection reset');
    res.redirect('/admin/whatsapp');
  } catch (error) {
    console.error('Error resetting WhatsApp connection:', error);
    req.flash('error', 'Error resetting WhatsApp connection');
    res.redirect('/admin/whatsapp');
  }
});

// Scheduled messages page
router.get('/scheduled', (req, res) => {
  const messages = getScheduledMessages();
  res.render('admin/scheduled', { messages });
});

// Add scheduled message
router.post('/scheduled/add', upload.single('media'), (req, res) => {
  try {
    const { to, message, scheduledTime, type, caption } = req.body;
    
    // Create message data object
    const messageData = {
      to,
      message,
      scheduledTime,
      type: type || 'text',
      caption
    };
    
    // Add media path if uploaded
    if (req.file) {
      messageData.mediaPath = req.file.path;
    }
    
    // Add scheduled message
    const result = addScheduledMessage(messageData);
    
    if (result.success) {
      req.flash('success', 'Message scheduled successfully');
    } else {
      req.flash('error', `Error scheduling message: ${result.error}`);
    }
    
    res.redirect('/admin/scheduled');
  } catch (error) {
    console.error('Error adding scheduled message:', error);
    req.flash('error', 'Error adding scheduled message');
    res.redirect('/admin/scheduled');
  }
});

// Cancel scheduled message
router.post('/scheduled/cancel/:id', (req, res) => {
  try {
    const { id } = req.params;
    const result = cancelScheduledMessage(id);
    
    if (result.success) {
      req.flash('success', 'Scheduled message cancelled');
    } else {
      req.flash('error', `Error cancelling message: ${result.error}`);
    }
    
    res.redirect('/admin/scheduled');
  } catch (error) {
    console.error('Error cancelling scheduled message:', error);
    req.flash('error', 'Error cancelling scheduled message');
    res.redirect('/admin/scheduled');
  }
});

// Update scheduled message
router.post('/scheduled/update/:id', upload.single('media'), (req, res) => {
  try {
    const { id } = req.params;
    const { to, message, scheduledTime, type, caption } = req.body;
    
    // Create updated data object
    const updatedData = {
      to,
      message,
      scheduledTime,
      type: type || 'text',
      caption
    };
    
    // Add media path if uploaded
    if (req.file) {
      updatedData.mediaPath = req.file.path;
    }
    
    // Update scheduled message
    const result = updateScheduledMessage(id, updatedData);
    
    if (result.success) {
      req.flash('success', 'Scheduled message updated');
    } else {
      req.flash('error', `Error updating message: ${result.error}`);
    }
    
    res.redirect('/admin/scheduled');
  } catch (error) {
    console.error('Error updating scheduled message:', error);
    req.flash('error', 'Error updating scheduled message');
    res.redirect('/admin/scheduled');
  }
});

// Settings page
router.get('/settings', (req, res) => {
  const sheetsCredentials = getCredentials();
  res.render('admin/settings', { sheetsCredentials });
});

// Save Google Sheets settings
router.post('/settings/sheets', async (req, res) => {
  try {
    const { apiKey, sheetId } = req.body;
    
    // Test connection before saving
    const testResult = await testSheetsConnection(sheetId, apiKey);
    
    if (testResult.success) {
      // Save credentials
      const saveResult = saveCredentials({ apiKey, sheetId });
      
      if (saveResult.success) {
        req.flash('success', 'Google Sheets settings saved successfully');
      } else {
        req.flash('error', `Error saving settings: ${saveResult.error}`);
      }
    } else {
      req.flash('error', `Connection test failed: ${testResult.error}`);
    }
    
    res.redirect('/admin/settings');
  } catch (error) {
    console.error('Error saving Google Sheets settings:', error);
    req.flash('error', 'Error saving Google Sheets settings');
    res.redirect('/admin/settings');
  }
});

// Test Gemini AI connection
router.post('/settings/ai/test', async (req, res) => {
  try {
    const { apiKey } = req.body;
    
    // Test connection
    const testResult = await testAIConnection(apiKey);
    
    res.json(testResult);
  } catch (error) {
    console.error('Error testing Gemini AI connection:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test Google Sheets connection
router.post('/settings/sheets/test', async (req, res) => {
  try {
    const { apiKey, sheetId } = req.body;
    
    // Test connection
    const testResult = await testSheetsConnection(sheetId, apiKey);
    
    res.json(testResult);
  } catch (error) {
    console.error('Error testing Google Sheets connection:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;