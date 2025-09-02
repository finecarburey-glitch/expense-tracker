"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleSheetsService = void 0;
const googleapis_1 = require("googleapis");
class GoogleSheetsService {
    constructor() {
        this.sheets = googleapis_1.google.sheets({ version: 'v4' });
        this.sheetId = process.env.GOOGLE_SHEETS_ID;
        // Initialize auth
        this.auth = new googleapis_1.google.auth.GoogleAuth({
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
        }
        catch (error) {
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
        }
        catch (error) {
            console.error('❌ Error adding expense:', error);
            throw error;
        }
    }
    // Get all expenses with filters
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
        }
        catch (error) {
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
            return response.data.values.map((row) => ({
                name: row[0],
                isDefault: row[1] === 'true',
                createdAt: row[2]
            }));
        }
        catch (error) {
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
        }
        catch (error) {
            console.error('❌ Error adding category:', error);
            throw error;
        }
    }
}
exports.GoogleSheetsService = GoogleSheetsService;
