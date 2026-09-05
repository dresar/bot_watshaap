const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('./auth');
const apiAuth = auth.apiAuth;
const { sendTextMessage, sendImageMessage, getStatus, getChats } = require('../services/whatsapp');
const { getScheduledMessages, addScheduledMessage, cancelScheduledMessage, updateScheduledMessage } = require('../services/scheduler');
const { readSheet, writeSheet, appendSheet, getSheetNames } = require('../services/sheets');
const { generateResponse, processMessage } = require('../services/ai');

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

// Apply API authentication middleware to all API routes
router.use(apiAuth);

// Get WhatsApp status
router.get('/whatsapp/status', (req, res) => {
  const status = getStatus();
  res.json(status);
});

// Send text message
router.post('/whatsapp/send/text', async (req, res) => {
  try {
    const { to, message } = req.body;
    
    if (!to || !message) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and message are required'
      });
    }
    
    // Send the message
    const result = await sendTextMessage(to, message);
    
    res.json({
      success: true,
      message: 'Message sent successfully',
      result
    });
  } catch (error) {
    console.error('Error sending text message:', error);
    res.status(500).json({
      success: false,
      message: `Error sending message: ${error.message}`
    });
  }
});

// Send image message
router.post('/whatsapp/send/image', upload.single('image'), async (req, res) => {
  try {
    const { to, caption } = req.body;
    
    if (!to || !req.file) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and image are required'
      });
    }
    
    // Send the image message
    const result = await sendImageMessage(to, req.file.path, caption);
    
    res.json({
      success: true,
      message: 'Image message sent successfully',
      result
    });
  } catch (error) {
    console.error('Error sending image message:', error);
    res.status(500).json({
      success: false,
      message: `Error sending image message: ${error.message}`
    });
  }
});

// Get all chats
router.get('/whatsapp/chats', async (req, res) => {
  try {
    // Get all chats
    const chats = await getChats();
    
    res.json({
      success: true,
      chats
    });
  } catch (error) {
    console.error('Error getting chats:', error);
    res.status(500).json({
      success: false,
      message: `Error getting chats: ${error.message}`
    });
  }
});

// Get all scheduled messages
router.get('/scheduled', (req, res) => {
  try {
    const messages = getScheduledMessages();
    
    res.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Error getting scheduled messages:', error);
    res.status(500).json({
      success: false,
      message: `Error getting scheduled messages: ${error.message}`
    });
  }
});

// Add scheduled message
router.post('/scheduled/add', upload.single('media'), (req, res) => {
  try {
    const { to, message, scheduledTime, type, caption } = req.body;
    
    if (!to || !message || !scheduledTime) {
      return res.status(400).json({
        success: false,
        message: 'Phone number, message, and scheduled time are required'
      });
    }
    
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
    
    res.json(result);
  } catch (error) {
    console.error('Error adding scheduled message:', error);
    res.status(500).json({
      success: false,
      message: `Error adding scheduled message: ${error.message}`
    });
  }
});

// Cancel scheduled message
router.delete('/scheduled/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Message ID is required'
      });
    }
    
    // Cancel scheduled message
    const result = cancelScheduledMessage(id);
    
    res.json(result);
  } catch (error) {
    console.error('Error cancelling scheduled message:', error);
    res.status(500).json({
      success: false,
      message: `Error cancelling scheduled message: ${error.message}`
    });
  }
});

// Update scheduled message
router.put('/scheduled/:id', upload.single('media'), (req, res) => {
  try {
    const { id } = req.params;
    const { to, message, scheduledTime, type, caption } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Message ID is required'
      });
    }
    
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
    
    res.json(result);
  } catch (error) {
    console.error('Error updating scheduled message:', error);
    res.status(500).json({
      success: false,
      message: `Error updating scheduled message: ${error.message}`
    });
  }
});

// Read from Google Sheets
router.get('/sheets/read', async (req, res) => {
  try {
    const { spreadsheetId, range } = req.query;
    
    if (!range) {
      return res.status(400).json({
        success: false,
        message: 'Range is required'
      });
    }
    
    // Read from sheet
    const data = await readSheet(spreadsheetId, range);
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error reading from Google Sheets:', error);
    res.status(500).json({
      success: false,
      message: `Error reading from Google Sheets: ${error.message}`
    });
  }
});

// Write to Google Sheets
router.post('/sheets/write', async (req, res) => {
  try {
    const { spreadsheetId, range, values } = req.body;
    
    if (!range || !values) {
      return res.status(400).json({
        success: false,
        message: 'Range and values are required'
      });
    }
    
    // Write to sheet
    const result = await writeSheet(spreadsheetId, range, values);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error writing to Google Sheets:', error);
    res.status(500).json({
      success: false,
      message: `Error writing to Google Sheets: ${error.message}`
    });
  }
});

// Append to Google Sheets
router.post('/sheets/append', async (req, res) => {
  try {
    const { spreadsheetId, range, values } = req.body;
    
    if (!range || !values) {
      return res.status(400).json({
        success: false,
        message: 'Range and values are required'
      });
    }
    
    // Append to sheet
    const result = await appendSheet(spreadsheetId, range, values);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error appending to Google Sheets:', error);
    res.status(500).json({
      success: false,
      message: `Error appending to Google Sheets: ${error.message}`
    });
  }
});

// Get sheet names
router.get('/sheets/names', async (req, res) => {
  try {
    const { spreadsheetId } = req.query;
    
    // Get sheet names
    const names = await getSheetNames(spreadsheetId);
    
    res.json({
      success: true,
      names
    });
  } catch (error) {
    console.error('Error getting sheet names:', error);
    res.status(500).json({
      success: false,
      message: `Error getting sheet names: ${error.message}`
    });
  }
});

// Generate AI response
router.post('/ai/generate', async (req, res) => {
  try {
    const { prompt, options } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required'
      });
    }
    
    // Generate response
    const response = await generateResponse(prompt, options);
    
    res.json({
      success: true,
      response
    });
  } catch (error) {
    console.error('Error generating AI response:', error);
    res.status(500).json({
      success: false,
      message: `Error generating AI response: ${error.message}`
    });
  }
});

module.exports = router;