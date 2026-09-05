const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Path to store Google Sheets credentials
const credentialsPath = path.join(process.cwd(), 'data', 'sheets-credentials.json');

/**
 * Initialize Google Sheets API client
 * @param {string} apiKey - Google API key (optional if using credentials file)
 * @returns {Object} - Google Sheets API client
 */
const initSheetsClient = (apiKey = null) => {
  try {
    let auth;
    
    // Use API key if provided
    if (apiKey) {
      auth = apiKey;
    } 
    // Otherwise try to use credentials file
    else if (fs.existsSync(credentialsPath)) {
      const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
      auth = credentials.apiKey || process.env.GOOGLE_SHEETS_API_KEY;
    } else {
      // Fall back to environment variable
      auth = process.env.GOOGLE_SHEETS_API_KEY;
    }
    
    if (!auth) {
      throw new Error('No Google Sheets API key found');
    }
    
    // Initialize the Sheets API client
    const sheets = google.sheets({ version: 'v4', auth });
    return sheets;
  } catch (error) {
    console.error('Error initializing Google Sheets client:', error);
    throw error;
  }
};

/**
 * Save Google Sheets credentials to file
 * @param {Object} credentials - Credentials object with apiKey and sheetId
 * @returns {Object} - Result object with success status
 */
const saveCredentials = (credentials) => {
  try {
    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Save credentials to file
    fs.writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2));
    return { success: true, message: 'Credentials saved successfully' };
  } catch (error) {
    console.error('Error saving Google Sheets credentials:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get saved Google Sheets credentials
 * @returns {Object} - Credentials object or null if not found
 */
const getCredentials = () => {
  try {
    if (fs.existsSync(credentialsPath)) {
      return JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    }
    return null;
  } catch (error) {
    console.error('Error reading Google Sheets credentials:', error);
    return null;
  }
};

/**
 * Read data from a Google Sheet
 * @param {string} spreadsheetId - ID of the spreadsheet
 * @param {string} range - Range to read (e.g., 'Sheet1!A1:D10')
 * @param {string} apiKey - Google API key (optional)
 * @returns {Promise<Array>} - Promise that resolves with the sheet data
 */
const readSheet = async (spreadsheetId, range, apiKey = null) => {
  try {
    // Use provided spreadsheet ID or fall back to saved/environment variable
    const sheetId = spreadsheetId || process.env.GOOGLE_SHEETS_ID;
    
    if (!sheetId) {
      throw new Error('No spreadsheet ID provided');
    }
    
    // Initialize the Sheets client
    const sheets = initSheetsClient(apiKey);
    
    // Get the data from the sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: range,
    });
    
    const rows = response.data.values;
    
    if (!rows || rows.length === 0) {
      return [];
    }
    
    return rows;
  } catch (error) {
    console.error('Error reading Google Sheet:', error);
    throw error;
  }
};

/**
 * Write data to a Google Sheet
 * @param {string} spreadsheetId - ID of the spreadsheet
 * @param {string} range - Range to write to (e.g., 'Sheet1!A1:D10')
 * @param {Array} values - 2D array of values to write
 * @param {string} apiKey - Google API key (optional)
 * @returns {Promise<Object>} - Promise that resolves with the update result
 */
const writeSheet = async (spreadsheetId, range, values, apiKey = null) => {
  try {
    // Use provided spreadsheet ID or fall back to saved/environment variable
    const sheetId = spreadsheetId || process.env.GOOGLE_SHEETS_ID;
    
    if (!sheetId) {
      throw new Error('No spreadsheet ID provided');
    }
    
    // Initialize the Sheets client
    const sheets = initSheetsClient(apiKey);
    
    // Write the data to the sheet
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: range,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: values
      }
    });
    
    return {
      success: true,
      updatedCells: response.data.updatedCells,
      updatedRows: response.data.updatedRows,
      updatedColumns: response.data.updatedColumns
    };
  } catch (error) {
    console.error('Error writing to Google Sheet:', error);
    throw error;
  }
};

/**
 * Append data to a Google Sheet
 * @param {string} spreadsheetId - ID of the spreadsheet
 * @param {string} range - Range to append to (e.g., 'Sheet1!A:D')
 * @param {Array} values - 2D array of values to append
 * @param {string} apiKey - Google API key (optional)
 * @returns {Promise<Object>} - Promise that resolves with the append result
 */
const appendSheet = async (spreadsheetId, range, values, apiKey = null) => {
  try {
    // Use provided spreadsheet ID or fall back to saved/environment variable
    const sheetId = spreadsheetId || process.env.GOOGLE_SHEETS_ID;
    
    if (!sheetId) {
      throw new Error('No spreadsheet ID provided');
    }
    
    // Initialize the Sheets client
    const sheets = initSheetsClient(apiKey);
    
    // Append the data to the sheet
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: range,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: values
      }
    });
    
    return {
      success: true,
      updatedCells: response.data.updates.updatedCells,
      updatedRows: response.data.updates.updatedRows,
      updatedColumns: response.data.updates.updatedColumns
    };
  } catch (error) {
    console.error('Error appending to Google Sheet:', error);
    throw error;
  }
};

/**
 * Get sheet names from a spreadsheet
 * @param {string} spreadsheetId - ID of the spreadsheet
 * @param {string} apiKey - Google API key (optional)
 * @returns {Promise<Array>} - Promise that resolves with an array of sheet names
 */
const getSheetNames = async (spreadsheetId, apiKey = null) => {
  try {
    // Use provided spreadsheet ID or fall back to saved/environment variable
    const sheetId = spreadsheetId || process.env.GOOGLE_SHEETS_ID;
    
    if (!sheetId) {
      throw new Error('No spreadsheet ID provided');
    }
    
    // Initialize the Sheets client
    const sheets = initSheetsClient(apiKey);
    
    // Get spreadsheet information
    const response = await sheets.spreadsheets.get({
      spreadsheetId: sheetId
    });
    
    // Extract sheet names
    const sheetNames = response.data.sheets.map(sheet => sheet.properties.title);
    
    return sheetNames;
  } catch (error) {
    console.error('Error getting sheet names:', error);
    throw error;
  }
};

/**
 * Test the Google Sheets connection
 * @param {string} spreadsheetId - ID of the spreadsheet to test
 * @param {string} apiKey - Google API key to test
 * @returns {Promise<Object>} - Promise that resolves with test result
 */
const testConnection = async (spreadsheetId, apiKey) => {
  try {
    // Try to get sheet names as a connection test
    const sheetNames = await getSheetNames(spreadsheetId, apiKey);
    
    return {
      success: true,
      message: 'Connection successful',
      sheets: sheetNames
    };
  } catch (error) {
    console.error('Google Sheets connection test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  initSheetsClient,
  saveCredentials,
  getCredentials,
  readSheet,
  writeSheet,
  appendSheet,
  getSheetNames,
  testConnection
};