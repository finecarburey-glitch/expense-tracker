// Google Sheets integration using JSON credentials directly

let sheetsService = null;

// Try to initialize Google Sheets service using JSON credentials
try {
  const { google } = require('googleapis');
  
  // Get environment variables
  const sheetId = process.env.GOOGLE_SHEETS_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  
  console.log('Environment variables check:');
  console.log('GOOGLE_SHEETS_ID:', sheetId ? 'SET' : 'NOT_SET');
  console.log('GOOGLE_SERVICE_ACCOUNT_EMAIL:', clientEmail ? 'SET' : 'NOT_SET');
  console.log('GOOGLE_PRIVATE_KEY:', privateKey ? 'SET' : 'NOT_SET');
  
  if (sheetId && clientEmail && privateKey) {
    // Create credentials object exactly as it appears in the JSON file
    const credentials = {
      type: 'service_account',
      project_id: 'family-expense-tracker-471312',
      private_key_id: '2704712fb98b1c9f13afca39f626920327a2e71f',
      private_key: privateKey,
      client_email: clientEmail,
      client_id: '113309710158885419213',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/family-expense-tracker-service%40family-expense-tracker-471312.iam.gserviceaccount.com',
      universe_domain: 'googleapis.com'
    };
    
    console.log('Using credentials object with client_email:', credentials.client_email);
    
    // Create Google Sheets service
    const auth = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    
    const sheets = google.sheets({ version: 'v4' });
    
    sheetsService = {
      auth,
      sheets,
      sheetId,
      
      async getAuthClient() {
        return await this.auth.getClient();
      },
      
      async getCategories() {
        try {
          const auth = await this.getAuthClient();
          const response = await this.sheets.spreadsheets.values.get({
            auth,
            spreadsheetId: this.sheetId,
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
        } catch (error) {
          console.error('Error getting categories:', error);
          throw error;
        }
      },
      
      async addCategory(categoryName) {
        try {
          const auth = await this.getAuthClient();
          const now = new Date().toISOString();
          const category = [categoryName, false, now];
          
          await this.sheets.spreadsheets.values.append({
            auth,
            spreadsheetId: this.sheetId,
            range: 'Categories!A:C',
            valueInputOption: 'RAW',
            resource: { values: [category] }
          });
          
          return { name: categoryName, isDefault: false, createdAt: now };
        } catch (error) {
          console.error('Error adding category:', error);
          throw error;
        }
      },
      
      async addExpense(expenseData, user) {
        try {
          const auth = await this.getAuthClient();
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
          
          await this.sheets.spreadsheets.values.append({
            auth,
            spreadsheetId: this.sheetId,
            range: 'Expenses!A:I',
            valueInputOption: 'RAW',
            resource: { values: [expense] }
          });
          
          return { id: expenseId, ...expenseData, addedBy: user.name, addedAt: now };
        } catch (error) {
          console.error('Error adding expense:', error);
          throw error;
        }
      },
      
      async getExpenses(filters = {}) {
        try {
          const auth = await this.getAuthClient();
          const response = await this.sheets.spreadsheets.values.get({
            auth,
            spreadsheetId: this.sheetId,
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
        } catch (error) {
          console.error('Error getting expenses:', error);
          throw error;
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

// Default user since authentication is removed
const defaultUser = {
  id: '1',
  name: 'Family User',
  email: 'family@example.com'
};

// Temporary storage (in-memory, will reset on function restart)
let tempCategories = [
  { name: 'Food & Dining', id: '1' },
  { name: 'Transportation', id: '2' },
  { name: 'Shopping', id: '3' },
  { name: 'Entertainment', id: '4' },
  { name: 'Bills & Utilities', id: '5' },
  { name: 'Healthcare', id: '6' },
  { name: 'Education', id: '7' },
  { name: 'Travel', id: '8' }
];

let tempExpenses = [];

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
          googleSheets: sheetsService ? 'configured' : 'not configured'
        })
      };
    }

    if (isCategories) {
      if (httpMethod === 'GET') {
        if (sheetsService) {
          try {
            const categories = await sheetsService.getCategories();
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify(categories)
            };
          } catch (error) {
            console.error('Google Sheets error, falling back to temporary storage:', error);
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify(tempCategories)
            };
          }
        } else {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(tempCategories)
          };
        }
      } else if (httpMethod === 'POST') {
        const { name } = requestBody;
        if (!name || name.trim() === '') {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Category name is required' })
          };
        }
        
        if (sheetsService) {
          try {
            const newCategory = await sheetsService.addCategory(name.trim());
            return {
              statusCode: 201,
              headers,
              body: JSON.stringify(newCategory)
            };
          } catch (error) {
            console.error('Google Sheets error, falling back to temporary storage:', error);
            const newCategory = { 
              name: name.trim(), 
              id: Date.now().toString(),
              message: 'Category added to temporary storage (Google Sheets error)'
            };
            tempCategories.push(newCategory);
            return {
              statusCode: 201,
              headers,
              body: JSON.stringify(newCategory)
            };
          }
        } else {
          const newCategory = { 
            name: name.trim(), 
            id: Date.now().toString(),
            message: 'Category added to temporary storage (Google Sheets not configured)'
          };
          tempCategories.push(newCategory);
          return {
            statusCode: 201,
            headers,
            body: JSON.stringify(newCategory)
          };
        }
      }
    }

    if (isSummary) {
      if (sheetsService) {
        try {
          const currentDate = new Date();
          const currentMonth = currentDate.getMonth();
          const currentYear = currentDate.getFullYear();
          
          const currentMonthExpenses = await sheetsService.getExpenses({ 
            month: currentMonth, 
            year: currentYear 
          });
          
          const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          const prevMonthExpenses = await sheetsService.getExpenses({ 
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
        } catch (error) {
          console.error('Google Sheets error, falling back to temporary storage:', error);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              currentMonth: {
                total: 0,
                count: 0,
                categoryTotals: {},
                topCategories: []
              },
              previousMonth: {
                total: 0,
                count: 0
              },
              change: 0,
              percentChange: 0
            })
          };
        }
      } else {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            currentMonth: {
              total: 0,
              count: 0,
              categoryTotals: {},
              topCategories: []
            },
            previousMonth: {
              total: 0,
              count: 0
            },
            change: 0,
            percentChange: 0
          })
        };
      }
    }

    // Handle expenses endpoints
    if (httpMethod === 'GET') {
      if (sheetsService) {
        try {
          const filters = {};
          if (queryStringParameters) {
            if (queryStringParameters.category) filters.category = queryStringParameters.category;
            if (queryStringParameters.month !== undefined) filters.month = parseInt(queryStringParameters.month);
            if (queryStringParameters.year !== undefined) filters.year = parseInt(queryStringParameters.year);
          }
          
          const expenses = await sheetsService.getExpenses(filters);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(expenses)
          };
        } catch (error) {
          console.error('Google Sheets error, falling back to temporary storage:', error);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(tempExpenses)
          };
        }
      } else {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(tempExpenses)
        };
      }
    } else if (httpMethod === 'POST') {
      const { amount, date, category, notes } = requestBody;
      if (!amount || !date || !category) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Amount, date, and category are required' })
        };
      }
      
      if (sheetsService) {
        try {
          const expenseData = { amount: parseFloat(amount), date, category, notes };
          const newExpense = await sheetsService.addExpense(expenseData, defaultUser);
          
          return {
            statusCode: 201,
            headers,
            body: JSON.stringify(newExpense)
          };
        } catch (error) {
          console.error('Google Sheets error, falling back to temporary storage:', error);
          const newExpense = { 
            id: Date.now().toString(),
            amount: parseFloat(amount), 
            date, 
            category, 
            notes: notes || '',
            addedBy: 'Family User',
            addedAt: new Date().toISOString(),
            message: 'Expense added to temporary storage (Google Sheets error)'
          };
          tempExpenses.push(newExpense);
          return {
            statusCode: 201,
            headers,
            body: JSON.stringify(newExpense)
          };
        }
      } else {
        const newExpense = { 
          id: Date.now().toString(),
          amount: parseFloat(amount), 
          date, 
          category, 
          notes: notes || '',
          addedBy: 'Family User',
          addedAt: new Date().toISOString(),
          message: 'Expense added to temporary storage (Google Sheets not configured)'
        };
        tempExpenses.push(newExpense);
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(newExpense)
        };
      }
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
        error: 'Internal server error', 
        details: error.message 
      })
    };
  }
};
