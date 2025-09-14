// Debug function to test Google Sheets integration

let sheetsService = null;

// Try to initialize Google Sheets service with detailed logging
try {
  const { google } = require('googleapis');
  
  // Get environment variables
  const sheetId = process.env.GOOGLE_SHEETS_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  
  console.log('Environment variables check:');
  console.log('GOOGLE_SHEETS_ID:', sheetId ? 'SET' : 'NOT_SET');
  console.log('GOOGLE_SERVICE_ACCOUNT_EMAIL:', clientEmail ? 'SET' : 'NOT_SET');
  console.log('GOOGLE_PRIVATE_KEY:', privateKey ? 'SET' : 'NOT_SET');
  
  if (sheetId && clientEmail && privateKey) {
    // Fix private key formatting - handle multiple possible formats
    privateKey = privateKey
      .replace(/\\n/g, '\n')  // Replace literal \n with actual newlines
      .replace(/\\\\/g, '\\') // Fix double backslashes
      .trim();
    
    console.log('Private key starts with:', privateKey.substring(0, 50));
    console.log('Private key ends with:', privateKey.substring(privateKey.length - 50));
    
    // Create Google Sheets service
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    
    const sheets = google.sheets({ version: 'v4' });
    
    sheetsService = {
      auth,
      sheets,
      sheetId,
      
      async testConnection() {
        try {
          const authClient = await this.auth.getClient();
          console.log('Auth client created successfully');
          
          // Try to read from the sheet
          const response = await this.sheets.spreadsheets.get({
            auth: authClient,
            spreadsheetId: this.sheetId,
          });
          
          console.log('Sheet access successful:', response.data.properties.title);
          return { success: true, title: response.data.properties.title };
        } catch (error) {
          console.error('Sheet access failed:', error.message);
          return { success: false, error: error.message };
        }
      }
    };
    
    console.log('✅ Google Sheets service initialized successfully');
  } else {
    console.log('❌ Missing required environment variables for Google Sheets');
  }
} catch (error) {
  console.log('❌ Google Sheets service initialization failed:', error.message);
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
    let testResult = null;
    if (sheetsService) {
      testResult = await sheetsService.testConnection();
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'Debug Information',
        timestamp: new Date().toISOString(),
        environmentVariables: {
          GOOGLE_SHEETS_ID: process.env.GOOGLE_SHEETS_ID ? 'SET' : 'NOT_SET',
          GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'SET' : 'NOT_SET',
          GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY ? 'SET' : 'NOT_SET'
        },
        sheetsServiceAvailable: sheetsService ? 'YES' : 'NO',
        testResult: testResult
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Debug failed',
        details: error.message
      })
    };
  }
};
