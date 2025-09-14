// Debug API function to check environment variables and Google Sheets connection

let sheetsService = null;

// Try to initialize Google Sheets service
try {
  const { GoogleSheetsService } = require('../services/googleSheets');
  sheetsService = new GoogleSheetsService();
} catch (error) {
  console.log('Google Sheets service not available:', error.message);
}

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Check environment variables
    const envVars = {
      GOOGLE_SHEETS_ID: process.env.GOOGLE_SHEETS_ID ? 'SET' : 'NOT SET',
      GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'SET' : 'NOT SET',
      GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY ? 'SET' : 'NOT SET',
      NODE_VERSION: process.env.NODE_VERSION || 'NOT SET'
    };

    // Try to test Google Sheets connection
    let sheetsTest = 'NOT TESTED';
    if (sheetsService) {
      try {
        await sheetsService.getCategories();
        sheetsTest = 'SUCCESS';
      } catch (error) {
        sheetsTest = `ERROR: ${error.message}`;
      }
    } else {
      sheetsTest = 'SERVICE NOT INITIALIZED';
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'Debug Information',
        timestamp: new Date().toISOString(),
        environmentVariables: envVars,
        googleSheetsTest: sheetsTest,
        sheetsServiceAvailable: sheetsService ? 'YES' : 'NO'
      })
    };
  } catch (error) {
    console.error('Error in debug function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      })
    };
  }
};
