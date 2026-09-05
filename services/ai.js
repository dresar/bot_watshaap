const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI with API key
let genAI = null;
let model = null;

/**
 * Initialize the Gemini AI service
 * @param {string} apiKey - Gemini API key (optional, defaults to env variable)
 */
const initAI = (apiKey = null) => {
  try {
    // Use provided API key or fall back to environment variable
    const key = apiKey || process.env.GEMINI_API_KEY;
    
    if (!key) {
      throw new Error('No Gemini API key found');
    }
    
    // Initialize the Gemini AI client
    genAI = new GoogleGenerativeAI(key);
    
    // Get the generative model
    model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    console.log('Gemini AI service initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing Gemini AI:', error);
    return false;
  }
};

/**
 * Generate a response using Gemini AI
 * @param {string} prompt - The prompt to send to the AI
 * @param {Object} options - Additional options for the AI request
 * @returns {Promise<string>} - Promise that resolves with the AI response
 */
const generateResponse = async (prompt, options = {}) => {
  try {
    // Initialize AI if not already initialized
    if (!model) {
      initAI();
    }
    
    if (!model) {
      throw new Error('Gemini AI model not initialized');
    }
    
    // Generate content
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    return text;
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw error;
  }
};

/**
 * Process a WhatsApp message with AI
 * @param {Object} message - WhatsApp message object
 * @param {Object} context - Additional context for the AI
 * @returns {Promise<string>} - Promise that resolves with the AI response
 */
const processMessage = async (message, context = {}) => {
  try {
    // Extract message content
    const messageContent = message.body;
    const sender = message.from;
    
    // Create a prompt with context
    const prompt = `
      You are a helpful WhatsApp assistant. Please respond to the following message:
      
      Sender: ${sender}
      Message: ${messageContent}
      
      ${context.additionalInstructions || ''}
      
      Respond in a helpful, concise, and friendly manner.
    `;
    
    // Generate response
    const response = await generateResponse(prompt);
    return response;
  } catch (error) {
    console.error('Error processing message with AI:', error);
    return 'Sorry, I encountered an error while processing your message. Please try again later.';
  }
};

/**
 * Test the Gemini AI connection
 * @param {string} apiKey - Gemini API key to test
 * @returns {Promise<Object>} - Promise that resolves with test result
 */
const testConnection = async (apiKey) => {
  try {
    // Initialize with the provided API key
    const initialized = initAI(apiKey);
    
    if (!initialized) {
      throw new Error('Failed to initialize Gemini AI');
    }
    
    // Test with a simple prompt
    const response = await generateResponse('Hello, please respond with a simple greeting.');
    
    return {
      success: true,
      message: 'Connection successful',
      response: response
    };
  } catch (error) {
    console.error('Gemini AI connection test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  initAI,
  generateResponse,
  processMessage,
  testConnection
};