// Debug version to see what's happening with Google Sheets

let sheetsService = null;
let initError = null;

// Initialize Google Sheets service with error tracking
try {
  const { google } = require('googleapis');
  
  // Use the exact credentials from your JSON file
  const credentials = {
    type: 'service_account',
    project_id: 'family-expense-tracker-471312',
    private_key_id: '2704712fb98b1c9f13afca39f626920327a2e71f',
    private_key: `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCUExNQhXvz/Wky
f48OgKnBtJLUBbr/LaGACSrHKnKh2tA5DJ7iHsqirV4SqSFid7cSdiyC5+cWdRJg
tmf48+z1xEEMNfBhQlfYi6OPkbFHWujSEda1DZ7Rj0VdmuiI9Xj28OGwejXlWLfN
lZjt0jjwoOu8ur8UfVSQ1Qge7DATEqcF5bDoPHz+BmxH2gSt6rQIfNwS6DhJxCj2
fx2cJxjvSbcXpkLcqnoAxSx/j5ekL8JmawBsIPlGSSd9jA13gyliiVUHr2/0/Y4s
nixh2Y6HmGBk2xVnV5DUf4vz0KavAST095RSEteoLrraIiniyQtOWsY3DSos6WZB
4JlIX8GRAgMBAAECggEABSLKvhWdLKOu3wel3XvIt41k9NnsiB6L7hoTS+Rs5LCH
XZ0ykxb8kgsnmsfXPrg2hztGVLWIskKWBDj7bvr97nHTzEHAME1p6NrCDfAgmSAd
+HBSNUYvSqc4oZQmid6SxyTofROmFCoBOQ4d52zN2QnJ12pWR5aHxPzAmvr3+WdU
D4Ni+NFyW44qplKxs5hBBsS+6BH7PeisDNiOF3AbM5FKpqLIwXp5hv3n1TjNKEHS
U2UTy1Ho3A7MceP4pR8sj3gzs6l6TRkNxOGZnHNxmtUJ9ZTRqCCBsDXG9qeV7M6u
s1uEmMVrtXXfctgFFuIoIG0wYkLc4ropy3EwLO1cCQKBgQDPYAWv0QwjWmNsjmBZ
I/ROE2HuM4lDx1zvZAo/AOJym3uM6ZPaiDD9AJj1UQZ0baLxqcKWg4bSry6Po6GJ
6wKLi5/ZJOJSKPrY3kONxzoDVyZPiHGpcQsgfUDRLeMIGJtZ4tF0JlLNadBswQ29
KaIk+VbtSrqiiAMK8aKt691O6QKBgQC2y3QzPWeK3j0f9pbg0Wk3EAh0Lcugb8Y1
7Ip4ts9Iny1f7A45gbU399xGXwSG1U4IyIzbVCx+ooRbfl1+xB1vEmNj4o5HRl/x
1SzatZbvoSmMPK9VBZUdIdpSuD1C3szlbwIFncMcdZI/Uf+yLbp8zCjvU3uiQS7h
tsGkyrDEaQKBgHDwLqiuBRpL49H/SGHDvw22aKM91gffz7FgnmPpq2oXW5ZGr4tY
mLVxWdxgoE9QVmmetqcaQpcDaSw5RYTDRMOS6x9rgwaT4umxQsE4O1QOZoLyIFTT
h+fNzzsc7oQ+Qn0VllTXekj809Im4cCfp/rTAJCDHlneESoopxxpVEHhAoGARrj4
wEploSjS5Wb2gQ0EdDVTz/9X5T7ZpUtbV9EC6coMOCyQZFd20ayoIOHqUnB8vJE7
TjCG9ofSRcPiUIV4Dd1DbwXcnl7wCBS+QfA38YadGJDyFScPxjGu0opNyW2CQNJu
KdYcAwrKBo2nLDzdBiPHQrE+CEzH4rRev29cbOECgYApyBssFSC2Mrt6y1AKwXR4
4T1Wb3he9u0JBYBecSKLRt9JLmEgG4qjuQ0pTqj4+Y9jPcnE1IzaN0cnoA4legXl
rrmsEWgfRzilXyidCSjAMNcoA6NskWt6z7FZi51HM5M+MzhszLRv2QV1Jf9q3CB1
Nm3XKiBak3XHO2GnwVVSHg==
-----END PRIVATE KEY-----`,
    client_email: 'family-expense-tracker-service@family-expense-tracker-471312.iam.gserviceaccount.com',
    client_id: '113309710158885419213',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/family-expense-tracker-service%40family-expense-tracker-471312.iam.gserviceaccount.com',
    universe_domain: 'googleapis.com'
  };
  
  console.log('Initializing Google Sheets service...');
  
  // Create Google Sheets service
  const auth = new google.auth.GoogleAuth({
    credentials: credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  
  const sheets = google.sheets({ version: 'v4' });
  
  sheetsService = {
    auth,
    sheets,
    sheetId: '1ZTiHEj_CO2rjZULvlj6BvpC2NPW1eDFwsKmpAhRr6ro',
    
    async getAuthClient() {
      return await this.auth.getClient();
    },
    
    async testConnection() {
      try {
        const auth = await this.getAuthClient();
        const response = await this.sheets.spreadsheets.get({
          auth,
          spreadsheetId: this.sheetId,
        });
        return { success: true, title: response.data.properties.title };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  };
  
  console.log('✅ Google Sheets service initialized successfully');
} catch (error) {
  console.log('❌ Google Sheets service initialization failed:', error.message);
  initError = error.message;
}

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
        sheetsServiceAvailable: sheetsService ? 'YES' : 'NO',
        initError: initError,
        testResult: testResult
      })
    };
  } catch (error) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        error: 'Debug failed',
        details: error.message,
        initError: initError
      })
    };
  }
};
