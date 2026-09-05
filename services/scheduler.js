const schedule = require('node-schedule');
const { sendTextMessage, sendImageMessage } = require('./whatsapp');
const fs = require('fs');
const path = require('path');

// Store all scheduled jobs
let scheduledJobs = {};

// Path to store scheduled messages data
const scheduledMessagesPath = path.join(process.cwd(), 'data', 'scheduled-messages.json');

/**
 * Initialize the scheduler service
 */
const initScheduler = () => {
  console.log('Initializing scheduler service...');
  
  // Create data directory if it doesn't exist
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Create scheduled messages file if it doesn't exist
  if (!fs.existsSync(scheduledMessagesPath)) {
    fs.writeFileSync(scheduledMessagesPath, JSON.stringify([], null, 2));
  }
  
  // Load and schedule all saved messages
  loadScheduledMessages();
};

/**
 * Load scheduled messages from storage and schedule them
 */
const loadScheduledMessages = () => {
  try {
    const data = fs.readFileSync(scheduledMessagesPath, 'utf8');
    const messages = JSON.parse(data);
    
    // Schedule each message
    messages.forEach(message => {
      // Only schedule messages that are in the future
      const scheduledTime = new Date(message.scheduledTime);
      if (scheduledTime > new Date()) {
        scheduleMessage(message);
      }
    });
    
    console.log(`Loaded ${messages.length} scheduled messages`);
  } catch (error) {
    console.error('Error loading scheduled messages:', error);
  }
};

/**
 * Save scheduled messages to storage
 * @param {Array} messages - Array of scheduled message objects
 */
const saveScheduledMessages = (messages) => {
  try {
    fs.writeFileSync(scheduledMessagesPath, JSON.stringify(messages, null, 2));
  } catch (error) {
    console.error('Error saving scheduled messages:', error);
  }
};

/**
 * Get all scheduled messages
 * @returns {Array} - Array of scheduled message objects
 */
const getScheduledMessages = () => {
  try {
    const data = fs.readFileSync(scheduledMessagesPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading scheduled messages:', error);
    return [];
  }
};

/**
 * Schedule a new message
 * @param {Object} messageData - Message data object
 * @param {string} messageData.id - Unique ID for the message
 * @param {string} messageData.to - Recipient phone number
 * @param {string} messageData.message - Message text
 * @param {string} messageData.scheduledTime - ISO string of scheduled time
 * @param {string} messageData.type - Message type (text, image)
 * @param {string} messageData.mediaPath - Path to media file (for image messages)
 * @param {string} messageData.caption - Caption for media messages
 * @returns {Object} - Result object with success status
 */
const scheduleMessage = (messageData) => {
  try {
    const { id, to, message, scheduledTime, type, mediaPath, caption } = messageData;
    const scheduledDate = new Date(scheduledTime);
    
    // Cancel existing job with the same ID if it exists
    if (scheduledJobs[id]) {
      scheduledJobs[id].cancel();
    }
    
    // Schedule the job
    scheduledJobs[id] = schedule.scheduleJob(scheduledDate, async () => {
      try {
        console.log(`Executing scheduled message: ${id}`);
        
        // Send the message based on type
        if (type === 'image' && mediaPath) {
          await sendImageMessage(to, mediaPath, caption || message);
        } else {
          await sendTextMessage(to, message);
        }
        
        // Remove the job from scheduled jobs after execution
        delete scheduledJobs[id];
        
        // Remove the message from storage
        removeScheduledMessage(id);
        
        console.log(`Successfully sent scheduled message: ${id}`);
      } catch (error) {
        console.error(`Error sending scheduled message ${id}:`, error);
      }
    });
    
    console.log(`Scheduled new message: ${id} for ${scheduledDate}`);
    return { success: true, id, scheduledTime: scheduledDate };
  } catch (error) {
    console.error('Error scheduling message:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Add a new scheduled message
 * @param {Object} messageData - Message data object
 * @returns {Object} - Result object with success status
 */
const addScheduledMessage = (messageData) => {
  try {
    // Generate a unique ID if not provided
    if (!messageData.id) {
      messageData.id = `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }
    
    // Schedule the message
    const result = scheduleMessage(messageData);
    
    if (result.success) {
      // Add to storage
      const messages = getScheduledMessages();
      messages.push(messageData);
      saveScheduledMessages(messages);
    }
    
    return result;
  } catch (error) {
    console.error('Error adding scheduled message:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Cancel a scheduled message
 * @param {string} id - ID of the message to cancel
 * @returns {Object} - Result object with success status
 */
const cancelScheduledMessage = (id) => {
  try {
    // Cancel the job
    if (scheduledJobs[id]) {
      scheduledJobs[id].cancel();
      delete scheduledJobs[id];
    }
    
    // Remove from storage
    removeScheduledMessage(id);
    
    return { success: true, id };
  } catch (error) {
    console.error('Error canceling scheduled message:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Remove a scheduled message from storage
 * @param {string} id - ID of the message to remove
 */
const removeScheduledMessage = (id) => {
  try {
    const messages = getScheduledMessages();
    const filteredMessages = messages.filter(msg => msg.id !== id);
    saveScheduledMessages(filteredMessages);
  } catch (error) {
    console.error('Error removing scheduled message:', error);
  }
};

/**
 * Update a scheduled message
 * @param {string} id - ID of the message to update
 * @param {Object} updatedData - Updated message data
 * @returns {Object} - Result object with success status
 */
const updateScheduledMessage = (id, updatedData) => {
  try {
    // Get current messages
    const messages = getScheduledMessages();
    const messageIndex = messages.findIndex(msg => msg.id === id);
    
    if (messageIndex === -1) {
      return { success: false, error: 'Message not found' };
    }
    
    // Update the message data
    const updatedMessage = { ...messages[messageIndex], ...updatedData, id };
    messages[messageIndex] = updatedMessage;
    
    // Save updated messages
    saveScheduledMessages(messages);
    
    // Reschedule the message
    scheduleMessage(updatedMessage);
    
    return { success: true, id, message: updatedMessage };
  } catch (error) {
    console.error('Error updating scheduled message:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  initScheduler,
  getScheduledMessages,
  addScheduledMessage,
  cancelScheduledMessage,
  updateScheduledMessage
};