const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Global variables to store client and connection status
let whatsappClient = null;
let clientReady = false;
let qrCodeData = null;
let connectionStatus = 'disconnected';

// Event emitter for WhatsApp events
const EventEmitter = require('events');
const whatsappEvents = new EventEmitter();

/**
 * Initialize WhatsApp client
 */
const initWhatsApp = () => {
  // Create client with local authentication
  whatsappClient = new Client({
    authStrategy: new LocalAuth({
      dataPath: path.join(process.cwd(), '.wwebjs_auth')
    }),
    puppeteer: {
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  });

  // QR code event
  whatsappClient.on('qr', (qr) => {
    console.log('QR Code received');
    connectionStatus = 'qr_received';
    
    // Generate QR code as data URL
    qrcode.toDataURL(qr, (err, url) => {
      if (err) {
        console.error('Error generating QR code:', err);
        return;
      }
      qrCodeData = url;
      whatsappEvents.emit('qr', url);
    });
  });

  // Ready event
  whatsappClient.on('ready', () => {
    console.log('WhatsApp client is ready!');
    clientReady = true;
    connectionStatus = 'connected';
    whatsappEvents.emit('ready');
  });

  // Authenticated event
  whatsappClient.on('authenticated', () => {
    console.log('WhatsApp client authenticated');
    connectionStatus = 'authenticated';
    whatsappEvents.emit('authenticated');
  });

  // Authentication failure event
  whatsappClient.on('auth_failure', (msg) => {
    console.error('Authentication failure:', msg);
    connectionStatus = 'auth_failure';
    whatsappEvents.emit('auth_failure', msg);
  });

  // Disconnected event
  whatsappClient.on('disconnected', (reason) => {
    console.log('WhatsApp client disconnected:', reason);
    clientReady = false;
    connectionStatus = 'disconnected';
    whatsappEvents.emit('disconnected', reason);
  });

  // Message event
  whatsappClient.on('message', async (message) => {
    console.log(`Message received: ${message.body}`);
    whatsappEvents.emit('message', message);
    
    // Process message with AI or other handlers if needed
    // This will be implemented in a separate message handler service
  });

  // Initialize the client
  whatsappClient.initialize();
};

/**
 * Send a text message to a specific number
 * @param {string} to - Phone number in format: country code + phone number (e.g., 6281234567890)
 * @param {string} message - Message text to send
 * @returns {Promise} - Promise that resolves when message is sent
 */
const sendTextMessage = async (to, message) => {
  if (!clientReady) {
    throw new Error('WhatsApp client is not ready');
  }

  // Format the number to ensure it has the correct format
  const formattedNumber = formatPhoneNumber(to);
  
  try {
    // Send the message
    const response = await whatsappClient.sendMessage(`${formattedNumber}@c.us`, message);
    return response;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Send an image message to a specific number
 * @param {string} to - Phone number in format: country code + phone number
 * @param {string} imagePath - Path to the image file or URL
 * @param {string} caption - Optional caption for the image
 * @returns {Promise} - Promise that resolves when message is sent
 */
const sendImageMessage = async (to, imagePath, caption = '') => {
  if (!clientReady) {
    throw new Error('WhatsApp client is not ready');
  }

  const formattedNumber = formatPhoneNumber(to);
  
  try {
    let media;
    
    // Check if the image is a URL or a local file
    if (imagePath.startsWith('http')) {
      media = await MessageMedia.fromUrl(imagePath);
    } else {
      media = MessageMedia.fromFilePath(imagePath);
    }
    
    // Send the media message
    const response = await whatsappClient.sendMessage(
      `${formattedNumber}@c.us`, 
      media, 
      { caption }
    );
    
    return response;
  } catch (error) {
    console.error('Error sending image message:', error);
    throw error;
  }
};

/**
 * Format phone number to ensure it has the correct format
 * @param {string} phoneNumber - Phone number to format
 * @returns {string} - Formatted phone number
 */
const formatPhoneNumber = (phoneNumber) => {
  // Remove any non-digit characters
  let formatted = phoneNumber.replace(/\D/g, '');
  
  // Ensure the number starts with the country code
  if (formatted.startsWith('0')) {
    // Assuming Indonesian number (replace 0 with 62)
    formatted = '62' + formatted.substring(1);
  }
  
  return formatted;
};

/**
 * Get the current connection status
 * @returns {Object} - Status object with connection details
 */
const getStatus = () => {
  return {
    status: connectionStatus,
    ready: clientReady,
    hasQR: qrCodeData !== null
  };
};

/**
 * Get the current QR code data URL
 * @returns {string|null} - QR code data URL or null if not available
 */
const getQRCode = () => {
  return qrCodeData;
};

/**
 * Reset the QR code data
 */
const resetQRCode = () => {
  qrCodeData = null;
};

/**
 * Logout and destroy the current session
 * @returns {Promise} - Promise that resolves when logout is complete
 */
const logout = async () => {
  if (whatsappClient) {
    try {
      await whatsappClient.logout();
      clientReady = false;
      connectionStatus = 'disconnected';
      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  }
  return { success: false, message: 'No active client' };
};

/**
 * Get all chats
 * @returns {Promise<Array>} - Promise that resolves with an array of chats
 */
const getChats = async () => {
  if (!clientReady) {
    throw new Error('WhatsApp client is not ready');
  }
  
  try {
    const chats = await whatsappClient.getChats();
    return chats;
  } catch (error) {
    console.error('Error getting chats:', error);
    throw error;
  }
};

/**
 * View a contact's status/story
 * @param {string} contactId - Contact ID to view status
 * @returns {Promise} - Promise that resolves with status information
 */
const viewStatus = async (contactId) => {
  if (!clientReady) {
    throw new Error('WhatsApp client is not ready');
  }
  
  try {
    // Format the contact ID if needed
    const formattedContact = formatPhoneNumber(contactId);
    const contact = await whatsappClient.getContactById(`${formattedContact}@c.us`);
    
    // This is a simplified implementation as whatsapp-web.js doesn't directly support viewing statuses
    // In a real implementation, you would need to use additional methods or extensions
    
    return { success: true, message: 'Status view requested', contact: contact.name };
  } catch (error) {
    console.error('Error viewing status:', error);
    throw error;
  }
};

module.exports = {
  initWhatsApp,
  sendTextMessage,
  sendImageMessage,
  getStatus,
  getQRCode,
  resetQRCode,
  logout,
  getChats,
  viewStatus,
  whatsappEvents
};