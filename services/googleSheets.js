const { google } = require('googleapis');

class GoogleSheetsService {
  constructor() {
    this.sheets = google.sheets({ version: 'v4' });
    this.sheetId = process.env.GOOGLE_SHEETS_ID;
    
    // Initialize auth
    this.auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
  }

  async getAuthClient() {
    return await this.auth.getClient();
  }

  // Initialize the Google Sheet with proper structure
  async initializeSheet() {
    try {
      const auth = await this.getAuthClient();
      
      // Create headers for expenses sheet
      const expenseHeaders = [
        'ID',
        'Date',
        'Amount',
        'Category',
        'Notes',
        'AddedBy',
        'AddedByName',
        'AddedAt',
        'LastModified'
      ];

      // Create headers for categories sheet
      const categoryHeaders = [
        'Category',
        'IsDefault',
        'CreatedAt'
      ];

      // Default categories
      const defaultCategories = [
        ['Food', true, new Date().toISOString()],
        ['Fuel', true, new Date().toISOString()],
        ['Medicine', true, new Date().toISOString()],
        ['Vegetables & Provisions', true, new Date().toISOString()],
        ['Utilities', true, new Date().toISOString()],
        ['Power', true, new Date().toISOString()],
        ['Internet', true, new Date().toISOString()]
      ];

      // Set up the sheets
      await this.sheets.spreadsheets.values.update({
        auth,
        spreadsheetId: this.sheetId,
        range: 'Expenses!A1:I1',
        valueInputOption: 'RAW',
        resource: { values: [expenseHeaders] }
      });

      await this.sheets.spreadsheets.values.update({
        auth,
        spreadsheetId: this.sheetId,
        range: 'Categories!A1:C1',
        valueInputOption: 'RAW',
        resource: { values: [categoryHeaders] }
      });

      // Add default categories
      await this.sheets.spreadsheets.values.update({
        auth,
        spreadsheetId: this.sheetId,
        range: 'Categories!A2:C8',
        valueInputOption: 'RAW',
        resource: { values: defaultCategories }
      });

      console.log('✅ Google Sheet initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Google Sheet:', error);
      throw error;
    }
  }

  // Add new expense
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
      console.error('❌ Error adding expense:', error);
      throw error;
    }
  }

  // Get all expenses
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

      let expenses = response.data.values.map(row => ({
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
        expenses = expenses.filter(exp => exp.category === filters.category);
      }
      
      if (filters.month) {
        expenses = expenses.filter(exp => {
          const expenseDate = new Date(exp.date);
          return expenseDate.getMonth() === filters.month && 
                 expenseDate.getFullYear() === filters.year;
        });
      }

      if (filters.year) {
        expenses = expenses.filter(exp => {
          const expenseDate = new Date(exp.date);
          return expenseDate.getFullYear() === filters.year;
        });
      }

      return expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
      console.error('❌ Error getting expenses:', error);
      throw error;
    }
  }

  // Update expense
  async updateExpense(expenseId, updates, user) {
    try {
      const auth = await this.getAuthClient();
      const now = new Date().toISOString();
      
      // Get current expense to find its row
      const expenses = await this.getExpenses();
      const expenseIndex = expenses.findIndex(exp => exp.id === expenseId);
      
      if (expenseIndex === -1) {
        throw new Error('Expense not found');
      }

      // Find the actual row in the sheet (add 2 for header row and 0-based index)
      const sheetRow = expenseIndex + 2;
      
      // Update only the fields that changed
      if (updates.amount !== undefined) {
        await this.sheets.spreadsheets.values.update({
          auth,
          spreadsheetId: this.sheetId,
          range: `Expenses!C${sheetRow}`,
          valueInputOption: 'RAW',
          resource: { values: [[updates.amount]] }
        });
      }

      if (updates.category !== undefined) {
        await this.sheets.spreadsheets.values.update({
          auth,
          spreadsheetId: this.sheetId,
          range: `Expenses!D${sheetRow}`,
          valueInputOption: 'RAW',
          resource: { values: [[updates.category]] }
        });
      }

      if (updates.notes !== undefined) {
        await this.sheets.spreadsheets.values.update({
          auth,
          spreadsheetId: this.sheetId,
          range: `Expenses!E${sheetRow}`,
          valueInputOption: 'RAW',
          resource: { values: [[updates.notes]] }
        });
      }

      // Update last modified timestamp
      await this.sheets.spreadsheets.values.update({
        auth,
        spreadsheetId: this.sheetId,
        range: `Expenses!I${sheetRow}`,
        valueInputOption: 'RAW',
        resource: { values: [[now]] }
      });

      return { success: true, lastModified: now };
    } catch (error) {
      console.error('❌ Error updating expense:', error);
      throw error;
    }
  }

  // Delete expense
  async deleteExpense(expenseId) {
    try {
      const auth = await this.getAuthClient();
      
      // Get current expense to find its row
      const expenses = await this.getExpenses();
      const expenseIndex = expenses.findIndex(exp => exp.id === expenseId);
      
      if (expenseIndex === -1) {
        throw new Error('Expense not found');
      }

      // Find the actual row in the sheet (add 2 for header row and 0-based index)
      const sheetRow = expenseIndex + 2;
      
      // Clear the row (Google Sheets doesn't have a direct delete method)
      await this.sheets.spreadsheets.values.clear({
        auth,
        spreadsheetId: this.sheetId,
        range: `Expenses!A${sheetRow}:I${sheetRow}`,
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting expense:', error);
      throw error;
    }
  }

  // Get categories
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

      return response.data.values.map(row => ({
        name: row[0],
        isDefault: row[1] === 'true',
        createdAt: row[2]
      }));
    } catch (error) {
      console.error('❌ Error getting categories:', error);
      throw error;
    }
  }

  // Add new category
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
      console.error('❌ Error adding category:', error);
      throw error;
    }
  }

  // Get monthly report
  async getMonthlyReport(month, year) {
    try {
      const expenses = await this.getExpenses({ month, year });
      
      // Group by category
      const categoryTotals = {};
      let totalSpent = 0;
      
      expenses.forEach(expense => {
        if (!categoryTotals[expense.category]) {
          categoryTotals[expense.category] = 0;
        }
        categoryTotals[expense.category] += expense.amount;
        totalSpent += expense.amount;
      });

      // Get previous month data for comparison
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const prevMonthExpenses = await this.getExpenses({ month: prevMonth, year: prevYear });
      
      const prevMonthTotal = prevMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const changeFromPrevMonth = totalSpent - prevMonthTotal;
      const percentChange = prevMonthTotal > 0 ? ((changeFromPrevMonth / prevMonthTotal) * 100) : 0;

      return {
        month,
        year,
        totalSpent,
        categoryTotals,
        changeFromPrevMonth,
        percentChange,
        expenseCount: expenses.length,
        prevMonthTotal
      };
    } catch (error) {
      console.error('❌ Error generating monthly report:', error);
      throw error;
    }
  }

  // Reclassify expenses
  async reclassifyExpenses(oldCategory, newCategory) {
    try {
      const auth = await this.getAuthClient();
      
      // Get all expenses with the old category
      const expenses = await this.getExpenses();
      const expensesToUpdate = expenses.filter(exp => exp.category === oldCategory);
      
      if (expensesToUpdate.length === 0) {
        return { success: true, updatedCount: 0 };
      }

      // Update each expense
      for (const expense of expensesToUpdate) {
        await this.updateExpense(expense.id, { category: newCategory }, { id: 'system', name: 'System' });
      }

      return { success: true, updatedCount: expensesToUpdate.length };
    } catch (error) {
      console.error('❌ Error reclassifying expenses:', error);
      throw error;
    }
  }
}

module.exports = { GoogleSheetsService };
