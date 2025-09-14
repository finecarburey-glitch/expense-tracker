// Working API with Google Sheets integration

const { google } = require('googleapis');

// Use environment variables for credentials (secure approach)
const credentials = {
  type: 'service_account',
  project_id: process.env.GOOGLE_PROJECT_ID || 'family-expense-tracker-471312',
  private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID || '2704712fb98b1c9f13afca39f626920327a2e71f',
  private_key: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : '',
  client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'family-expense-tracker-service@family-expense-tracker-471312.iam.gserviceaccount.com',
  client_id: process.env.GOOGLE_CLIENT_ID || '113309710158885419213',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'family-expense-tracker-service@family-expense-tracker-471312.iam.gserviceaccount.com')}`,
  universe_domain: 'googleapis.com'
};

// Create Google Sheets service
const auth = new google.auth.GoogleAuth({
  credentials: credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4' });
const sheetId = process.env.GOOGLE_SHEETS_ID || '1ZTiHEj_CO2rjZULvlj6BvpC2NPW1eDFwsKmpAhRr6ro';

// Default user since authentication is removed
const defaultUser = {
  id: '1',
  name: 'Family User',
  email: 'family@example.com'
};

// Helper function to get month sheet name (e.g., "2025-01" for January 2025)
function getMonthSheetName(date) {
  const expenseDate = new Date(date);
  const year = expenseDate.getFullYear();
  const month = String(expenseDate.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Helper function to ensure a month sheet exists
async function ensureMonthSheetExists(monthSheetName) {
  const authClient = await auth.getClient();
  
  try {
    // Check if sheet exists by trying to get its properties
    await sheets.spreadsheets.get({
      auth: authClient,
      spreadsheetId: sheetId,
      ranges: [`${monthSheetName}!A1`]
    });
  } catch (error) {
    // Sheet doesn't exist, create it
    console.log(`Creating new sheet: ${monthSheetName}`);
    
    await sheets.spreadsheets.batchUpdate({
      auth: authClient,
      spreadsheetId: sheetId,
      resource: {
        requests: [{
          addSheet: {
            properties: {
              title: monthSheetName,
              gridProperties: {
                rowCount: 1000,
                columnCount: 10
              }
            }
          }
        }]
      }
    });
    
    // Add headers to the new sheet
    await sheets.spreadsheets.values.update({
      auth: authClient,
      spreadsheetId: sheetId,
      range: `${monthSheetName}!A1:I1`,
      valueInputOption: 'RAW',
      resource: {
        values: [['ID', 'Date', 'Amount', 'Category', 'Notes', 'Added By ID', 'Added By Name', 'Added At', 'Last Modified']]
      }
    });
    
    console.log(`Created sheet ${monthSheetName} with headers`);
  }
}

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
  
  // First, check if category already exists
  const existingCategories = await getCategories();
  const categoryExists = existingCategories.some(cat => 
    cat.name.toLowerCase() === categoryName.toLowerCase()
  );
  
  if (categoryExists) {
    throw new Error(`Category "${categoryName}" already exists. Please choose a different name.`);
  }
  
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

async function updateCategory(oldName, newName) {
  const authClient = await auth.getClient();
  
  // First, check if new category name already exists (excluding the current one)
  const existingCategories = await getCategories();
  const categoryExists = existingCategories.some(cat => 
    cat.name.toLowerCase() === newName.toLowerCase() && 
    cat.name.toLowerCase() !== oldName.toLowerCase()
  );
  
  if (categoryExists) {
    throw new Error(`Category "${newName}" already exists. Please choose a different name.`);
  }
  
  // Find the row number of the category to update
  const response = await sheets.spreadsheets.values.get({
    auth: authClient,
    spreadsheetId: sheetId,
    range: 'Categories!A:C',
  });
  
  if (!response.data.values) {
    throw new Error('Category not found');
  }
  
  const rowIndex = response.data.values.findIndex(row => row[0] === oldName);
  if (rowIndex === -1) {
    throw new Error('Category not found');
  }
  
  const rowNumber = rowIndex + 1; // +1 because sheets are 1-indexed
  const now = new Date().toISOString();
  
  // Update the category name
  await sheets.spreadsheets.values.update({
    auth: authClient,
    spreadsheetId: sheetId,
    range: `Categories!A${rowNumber}:C${rowNumber}`,
    valueInputOption: 'RAW',
    resource: { values: [[newName, false, now]] }
  });
  
  return { name: newName, isDefault: false, createdAt: now };
}

async function deleteCategory(categoryName) {
  const authClient = await auth.getClient();
  
  // Check if category is used in any expenses
  const expenses = await getExpenses();
  const categoryInUse = expenses.some(exp => exp.category === categoryName);
  
  if (categoryInUse) {
    throw new Error(`Cannot delete category "${categoryName}" because it is being used by existing expenses.`);
  }
  
  // Find the row number of the category to delete
  const response = await sheets.spreadsheets.values.get({
    auth: authClient,
    spreadsheetId: sheetId,
    range: 'Categories!A:C',
  });
  
  if (!response.data.values) {
    throw new Error('Category not found');
  }
  
  const rowIndex = response.data.values.findIndex(row => row[0] === categoryName);
  if (rowIndex === -1) {
    throw new Error('Category not found');
  }
  
  const rowNumber = rowIndex + 1; // +1 because sheets are 1-indexed
  
  // Delete the row
  await sheets.spreadsheets.batchUpdate({
    auth: authClient,
    spreadsheetId: sheetId,
    resource: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId: 0, // Categories sheet
            dimension: 'ROWS',
            startIndex: rowNumber - 1,
            endIndex: rowNumber
          }
        }
      }]
    }
  });
  
  return { message: `Category "${categoryName}" deleted successfully` };
}

async function addExpense(expenseData, user) {
  const authClient = await auth.getClient();
  const now = new Date().toISOString();
  const expenseId = Date.now().toString();
  
  // Get the month sheet name based on expense date
  const monthSheetName = getMonthSheetName(expenseData.date);
  
  // Ensure the month sheet exists
  await ensureMonthSheetExists(monthSheetName);
  
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
  
  // Add expense to the specific month sheet
  await sheets.spreadsheets.values.append({
    auth: authClient,
    spreadsheetId: sheetId,
    range: `${monthSheetName}!A:I`,
    valueInputOption: 'RAW',
    resource: { values: [expense] }
  });
  
  return { id: expenseId, ...expenseData, addedBy: user.name, addedAt: now, monthSheet: monthSheetName };
}

async function getExpenses(filters = {}) {
  const authClient = await auth.getClient();
  let allExpenses = [];
  
  try {
    // Get all sheet names
    const spreadsheet = await sheets.spreadsheets.get({
      auth: authClient,
      spreadsheetId: sheetId,
    });
    
    const sheetNames = spreadsheet.data.sheets.map(sheet => sheet.properties.title);
    
    // Read from all month sheets (format: YYYY-MM)
    const monthSheets = sheetNames.filter(name => /^\d{4}-\d{2}$/.test(name));
    
    // If no month sheets exist, try the old Expenses sheet as fallback
    if (monthSheets.length === 0 && sheetNames.includes('Expenses')) {
      monthSheets.push('Expenses');
    }
    
    // Read expenses from each month sheet
    for (const sheetName of monthSheets) {
      try {
        const response = await sheets.spreadsheets.values.get({
          auth: authClient,
          spreadsheetId: sheetId,
          range: `${sheetName}!A2:I`,
        });
        
        if (response.data.values) {
          const sheetExpenses = response.data.values.map((row) => ({
            id: row[0],
            date: row[1],
            amount: parseFloat(row[2]),
            category: row[3],
            notes: row[4],
            addedBy: row[5],
            addedByName: row[6],
            addedAt: row[7],
            lastModified: row[8],
            monthSheet: sheetName
          }));
          allExpenses = allExpenses.concat(sheetExpenses);
        }
      } catch (error) {
        console.log(`Error reading sheet ${sheetName}:`, error.message);
        // Continue with other sheets
      }
    }
    
  } catch (error) {
    console.error('Error getting expenses:', error);
    return [];
  }
  
  // Apply filters
  if (filters.category) {
    allExpenses = allExpenses.filter((exp) => exp.category === filters.category);
  }
  if (filters.month !== undefined) {
    allExpenses = allExpenses.filter((exp) => {
      const expenseDate = new Date(exp.date);
      return expenseDate.getMonth() === filters.month &&
             expenseDate.getFullYear() === filters.year;
    });
  }
  if (filters.year) {
    allExpenses = allExpenses.filter((exp) => {
      const expenseDate = new Date(exp.date);
      return expenseDate.getFullYear() === filters.year;
    });
  }
  
  return allExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
          googleSheets: 'configured - WORKING API'
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
        
        try {
          const newCategory = await addCategory(name.trim());
          return {
            statusCode: 201,
            headers,
            body: JSON.stringify(newCategory)
          };
        } catch (error) {
          return {
            statusCode: 409, // Conflict status code for duplicate
            headers,
            body: JSON.stringify({ 
              error: error.message,
              duplicate: true
            })
          };
        }
      } else if (httpMethod === 'PUT') {
        const { oldName, newName } = requestBody;
        if (!oldName || !newName || newName.trim() === '') {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Old name and new name are required' })
          };
        }
        
        try {
          const updatedCategory = await updateCategory(oldName.trim(), newName.trim());
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(updatedCategory)
          };
        } catch (error) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ 
              error: error.message
            })
          };
        }
      } else if (httpMethod === 'DELETE') {
        const { name } = requestBody;
        if (!name || name.trim() === '') {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Category name is required' })
          };
        }
        
        try {
          const result = await deleteCategory(name.trim());
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(result)
          };
        } catch (error) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ 
              error: error.message
            })
          };
        }
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
