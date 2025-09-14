// Working Google Sheets integration - NO FALLBACK

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

// Create Google Sheets service
const auth = new google.auth.GoogleAuth({
  credentials: credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4' });
const sheetId = '1ZTiHEj_CO2rjZULvlj6BvpC2NPW1eDFwsKmpAhRr6ro';

// Default user since authentication is removed
const defaultUser = {
  id: '1',
  name: 'Family User',
  email: 'family@example.com'
};

// Google Sheets helper functions - NO FALLBACK
async function getCategories() {
  const authClient = await auth.getClient();
  const response = await sheets.spreadsheets.values.get({
    auth: authClient,
    spreadsheetId: sheetId,
    range: 'Categories!A2:C',
  });
  
  if (!response.data.values) {
    return [];
  }
  
  return response.data.values.map((row) => ({
    name: row[0],
    isDefault: row[1] === 'true',
    createdAt: row[2]
  }));
}

async function addCategory(categoryName) {
  const authClient = await auth.getClient();
  const now = new Date().toISOString();
  const category = [categoryName, false, now];
  
  await sheets.spreadsheets.values.append({
    auth: authClient,
    spreadsheetId: sheetId,
    range: 'Categories!A:C',
    valueInputOption: 'RAW',
    resource: { values: [category] }
  });
  
  return { name: categoryName, isDefault: false, createdAt: now };
}

async function addExpense(expenseData, user) {
  const authClient = await auth.getClient();
  const now = new Date().toISOString();
  const expenseId = Date.now().toString();
  
  const expense = [
    expenseId,
    expenseData.date,
    expenseData.amount,
    expenseData.category,
    expenseData.notes || '',
    user.id,
    user.name,
    now,
    now
  ];
  
  await sheets.spreadsheets.values.append({
    auth: authClient,
    spreadsheetId: sheetId,
    range: 'Expenses!A:I',
    valueInputOption: 'RAW',
    resource: { values: [expense] }
  });
  
  return { id: expenseId, ...expenseData, addedBy: user.name, addedAt: now };
}

async function getExpenses(filters = {}) {
  const authClient = await auth.getClient();
  const response = await sheets.spreadsheets.values.get({
    auth: authClient,
    spreadsheetId: sheetId,
    range: 'Expenses!A2:I',
  });
  
  if (!response.data.values) {
    return [];
  }
  
  let expenses = response.data.values.map((row) => ({
    id: row[0],
    date: row[1],
    amount: parseFloat(row[2]),
    category: row[3],
    notes: row[4],
    addedBy: row[5],
    addedByName: row[6],
    addedAt: row[7],
    lastModified: row[8]
  }));
  
  // Apply filters
  if (filters.category) {
    expenses = expenses.filter((exp) => exp.category === filters.category);
  }
  if (filters.month !== undefined) {
    expenses = expenses.filter((exp) => {
      const expenseDate = new Date(exp.date);
      return expenseDate.getMonth() === filters.month &&
             expenseDate.getFullYear() === filters.year;
    });
  }
  if (filters.year) {
    expenses = expenses.filter((exp) => {
      const expenseDate = new Date(exp.date);
      return expenseDate.getFullYear() === filters.year;
    });
  }
  
  return expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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

  const { httpMethod, path, body, queryStringParameters } = event;
  
  // Extract the endpoint from the path
  const pathParts = path.split('/').filter(Boolean);
  const endpoint = pathParts[pathParts.length - 1];
  const isCategories = endpoint === 'categories';
  const isHealth = endpoint === 'health';
  const isSummary = endpoint === 'summary';

  try {
    // Parse request body
    let requestBody = {};
    if (body) {
      try {
        requestBody = JSON.parse(body);
      } catch (e) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid JSON body' })
        };
      }
    }

    // Route handling
    if (isHealth) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          status: 'OK', 
          timestamp: new Date().toISOString(),
          googleSheets: 'configured - WORKING SHEETS FUNCTION'
        })
      };
    }

    if (isCategories) {
      if (httpMethod === 'GET') {
        const categories = await getCategories();
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(categories)
        };
      } else if (httpMethod === 'POST') {
        const { name } = requestBody;
        if (!name || name.trim() === '') {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Category name is required' })
          };
        }
        
        const newCategory = await addCategory(name.trim());
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(newCategory)
        };
      }
    }

    if (isSummary) {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      const currentMonthExpenses = await getExpenses({ 
        month: currentMonth, 
        year: currentYear 
      });
      
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const prevMonthExpenses = await getExpenses({ 
        month: prevMonth, 
        year: prevYear 
      });
      
      const currentTotal = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const prevTotal = prevMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const change = currentTotal - prevTotal;
      const percentChange = prevTotal > 0 ? ((change / prevTotal) * 100) : 0;
      
      const categoryTotals = {};
      currentMonthExpenses.forEach(expense => {
        if (!categoryTotals[expense.category]) {
          categoryTotals[expense.category] = 0;
        }
        categoryTotals[expense.category] += expense.amount;
      });
      
      const topCategories = Object.entries(categoryTotals)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([category, amount]) => ({ category, amount }));
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          currentMonth: {
            total: currentTotal,
            count: currentMonthExpenses.length,
            categoryTotals,
            topCategories
          },
          previousMonth: {
            total: prevTotal,
            count: prevMonthExpenses.length
          },
          change,
          percentChange
        })
      };
    }

    // Handle expenses endpoints
    if (httpMethod === 'GET') {
      const filters = {};
      if (queryStringParameters) {
        if (queryStringParameters.category) filters.category = queryStringParameters.category;
        if (queryStringParameters.month !== undefined) filters.month = parseInt(queryStringParameters.month);
        if (queryStringParameters.year !== undefined) filters.year = parseInt(queryStringParameters.year);
      }
      
      const expenses = await getExpenses(filters);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(expenses)
      };
    } else if (httpMethod === 'POST') {
      const { amount, date, category, notes } = requestBody;
      if (!amount || !date || !category) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Amount, date, and category are required' })
        };
      }
      
      const expenseData = { amount: parseFloat(amount), date, category, notes };
      const newExpense = await addExpense(expenseData, defaultUser);
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(newExpense)
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  } catch (error) {
    console.error('Error in API function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Google Sheets error - NO FALLBACK', 
        details: error.message,
        stack: error.stack
      })
    };
  }
};
