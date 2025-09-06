import { google } from 'googleapis';

export class GoogleSheetsService {
  private sheets: any;
  private sheetId: string;
  private auth: any;

  constructor() {
    this.sheets = google.sheets({ version: 'v4' });
    this.sheetId = process.env.GOOGLE_SHEETS_ID!;
    
    // Initialize auth with optimized private key handling
    this.auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: this.getPrivateKey(),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
  }

  private getPrivateKey(): string {
    // Handle different private key formats
    const privateKey = process.env.GOOGLE_PRIVATE_KEY || '';
    
    // If it's a compact format, restore it
    if (privateKey.includes('-----BEGINPRIVATEKEY-----')) {
      return privateKey
        .replace('-----BEGINPRIVATEKEY-----', '-----BEGIN PRIVATE KEY-----')
        .replace('-----ENDPRIVATEKEY-----', '-----END PRIVATE KEY-----')
        .replace(/(.{64})/g, '$1\n')
        .replace(/\n$/, '');
    }
    
    // If it's already formatted correctly, return as is
    if (privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      return privateKey.replace(/\\n/g, '\n');
    }
    
    // If it's a base64 encoded key, decode it
    if (process.env.GOOGLE_PRIVATE_KEY_B64) {
      return Buffer.from(process.env.GOOGLE_PRIVATE_KEY_B64, 'base64').toString('utf-8');
    }
    
    // Fallback to original method
    return privateKey.replace(/\\n/g, '\n');
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
        'ID', 'Date', 'Amount', 'Category', 'Notes', 
        'AddedBy', 'AddedByName', 'AddedAt', 'LastModified'
      ];

      // Create headers for categories sheet
      const categoryHeaders = ['Category', 'IsDefault', 'CreatedAt'];

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
  async addExpense(expenseData: any, user: any) {
    try {
      const auth = await this.getAuthClient();
      const now = new Date().toISOString();
      const expenseId = Date.now().toString();
      
      const expense = [
        expenseId, expenseData.date, expenseData.amount, expenseData.category,
        expenseData.notes || '', user.id, user.name, now, now
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

  // Get all expenses with filters
  async getExpenses(filters: any = {}) {
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

      let expenses = response.data.values.map((row: any[]) => ({
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
        expenses = expenses.filter((exp: any) => exp.category === filters.category);
      }
      
      if (filters.month !== undefined) {
        expenses = expenses.filter((exp: any) => {
          const expenseDate = new Date(exp.date);
          return expenseDate.getMonth() === filters.month && 
                 expenseDate.getFullYear() === filters.year;
        });
      }

      if (filters.year) {
        expenses = expenses.filter((exp: any) => {
          const expenseDate = new Date(exp.date);
          return expenseDate.getFullYear() === filters.year;
        });
      }

      return expenses.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('❌ Error getting expenses:', error);
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

      return response.data.values.map((row: any[]) => ({
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
  async addCategory(categoryName: string) {
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
}
