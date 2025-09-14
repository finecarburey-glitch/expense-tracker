// Simple test function to check Google Sheets connection

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { google } = require('googleapis');
    
    // Get environment variables
    const sheetId = process.env.GOOGLE_SHEETS_ID;
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;
    
    console.log('Testing Google Sheets connection...');
    console.log('Sheet ID:', sheetId);
    console.log('Client Email:', clientEmail);
    console.log('Private Key exists:', !!privateKey);
    
    if (!sheetId || !clientEmail || !privateKey) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          error: 'Missing environment variables',
          sheetId: !!sheetId,
          clientEmail: !!clientEmail,
          privateKey: !!privateKey
        })
      };
    }
    
    // Fix private key formatting
    privateKey = privateKey.replace(/\\n/g, '\n').trim();
    
    // Create auth
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    
    const sheets = google.sheets({ version: 'v4' });
    
    // Test connection
    const authClient = await auth.getClient();
    console.log('Auth client created successfully');
    
    // Try to read the sheet
    const response = await sheets.spreadsheets.get({
      auth: authClient,
      spreadsheetId: sheetId,
    });
    
    console.log('Sheet accessed successfully:', response.data.properties.title);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        sheetTitle: response.data.properties.title,
        message: 'Google Sheets connection successful!'
      })
    };
    
  } catch (error) {
    console.error('Google Sheets test failed:', error);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        details: error.toString()
      })
    };
  }
};
