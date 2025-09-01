import express from 'express';
import { GoogleSheetsService } from '../services/googleSheets';

const router = express.Router();
const sheetsService = new GoogleSheetsService();

// Initialize the Google Sheet (run once)
router.post('/init', async (req, res) => {
  try {
    await sheetsService.initializeSheet();
    res.json({ success: true, message: 'Google Sheet initialized successfully' });
  } catch (error) {
    console.error('Error initializing sheet:', error);
    res.status(500).json({ error: 'Failed to initialize sheet', details: (error as Error).message });
  }
});

// Get all expenses with optional filters
router.get('/', async (req, res) => {
  try {
    const { category, month, year } = req.query;
    const filters: any = {};
    
    if (category) filters.category = category;
    if (month !== undefined) filters.month = parseInt(month as string);
    if (year !== undefined) filters.year = parseInt(year as string);
    
    const expenses = await sheetsService.getExpenses(filters);
    res.json(expenses);
  } catch (error) {
    console.error('Error getting expenses:', error);
    res.status(500).json({ error: 'Failed to get expenses', details: (error as Error).message });
  }
});

// Add new expense
router.post('/', async (req, res) => {
  try {
    const { amount, date, category, notes } = req.body;
    
    if (!amount || !date || !category) {
      return res.status(400).json({ error: 'Amount, date, and category are required' });
    }
    
    const expenseData = { amount: parseFloat(amount), date, category, notes };
    const newExpense = await sheetsService.addExpense(expenseData, req.user);
    
    res.status(201).json(newExpense);
  } catch (error) {
    console.error('Error adding expense:', error);
    res.status(500).json({ error: 'Failed to add expense', details: (error as Error).message });
  }
});

// Get categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await sheetsService.getCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ error: 'Failed to get categories', details: (error as Error).message });
  }
});

// Add new category
router.post('/categories', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Category name is required' });
    }
    
    const newCategory = await sheetsService.addCategory(name.trim());
    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error adding category:', error);
    res.status(500).json({ error: 'Failed to add category', details: (error as Error).message });
  }
});

// Get monthly report
router.get('/report/monthly', async (req, res) => {
  try {
    const { month, year } = req.query;
    
    if (month === undefined || year === undefined) {
      return res.status(400).json({ error: 'Month and year are required' });
    }
    
    const report = await sheetsService.getMonthlyReport(parseInt(month as string), parseInt(year as string));
    res.json(report);
  } catch (error) {
    console.error('Error generating monthly report:', error);
    res.status(500).json({ error: 'Failed to generate report', details: (error as Error).message });
  }
});

// Reclassify expenses
router.post('/reclassify', async (req, res) => {
  try {
    const { oldCategory, newCategory } = req.body;
    
    if (!oldCategory || !newCategory) {
      return res.status(400).json({ error: 'Old and new categories are required' });
    }
    
    const result = await sheetsService.reclassifyExpenses(oldCategory, newCategory);
    res.json(result);
  } catch (error) {
    console.error('Error reclassifying expenses:', error);
    res.status(500).json({ error: 'Failed to reclassify expenses', details: (error as Error).message });
  }
});

// Get expense summary for dashboard
router.get('/summary', async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Get current month expenses
    const currentMonthExpenses = await sheetsService.getExpenses({ 
      month: currentMonth, 
      year: currentYear 
    });
    
    // Get previous month expenses
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const prevMonthExpenses = await sheetsService.getExpenses({ 
      month: prevMonth, 
      year: prevYear 
    });
    
    // Calculate totals
    const currentTotal = currentMonthExpenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);
    const prevTotal = prevMonthExpenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);
    const change = currentTotal - prevTotal;
    const percentChange = prevTotal > 0 ? ((change / prevTotal) * 100) : 0;
    
    // Get category breakdown for current month
    const categoryTotals: { [key: string]: number } = {};
    currentMonthExpenses.forEach((expense: any) => {
      if (!categoryTotals[expense.category]) {
        categoryTotals[expense.category] = 0;
      }
      categoryTotals[expense.category] += expense.amount;
    });
    
    // Get top 5 categories by amount
    const topCategories = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));
    
    res.json({
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
    });
  } catch (error) {
    console.error('Error getting summary:', error);
    res.status(500).json({ error: 'Failed to get summary', details: (error as Error).message });
  }
});

export { router as expenseRoutes };
