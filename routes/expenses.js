const express = require('express');
const router = express.Router();
const { GoogleSheetsService } = require('../services/googleSheets');

const sheetsService = new GoogleSheetsService();

// Initialize the Google Sheet (run once)
router.post('/init', async (req, res) => {
  try {
    await sheetsService.initializeSheet();
    res.json({ success: true, message: 'Google Sheet initialized successfully' });
  } catch (error) {
    console.error('Error initializing sheet:', error);
    res.status(500).json({ error: 'Failed to initialize sheet', details: error.message });
  }
});

// Get all expenses with optional filters
router.get('/', async (req, res) => {
  try {
    const { category, month, year } = req.query;
    const filters = {};
    
    if (category) filters.category = category;
    if (month !== undefined) filters.month = parseInt(month);
    if (year !== undefined) filters.year = parseInt(year);
    
    const expenses = await sheetsService.getExpenses(filters);
    res.json(expenses);
  } catch (error) {
    console.error('Error getting expenses:', error);
    res.status(500).json({ error: 'Failed to get expenses', details: error.message });
  }
});

// Add new expense
router.post('/', async (req, res) => {
  try {
    const { amount, date, category, notes } = req.body;
    
    if (!amount || !date || !category) {
      return res.status(400).json({ error: 'Amount, date, and category are required' });
    }
    
    // Use default user since authentication is removed
    const defaultUser = {
      id: '1',
      name: 'Family User',
      email: 'family@example.com'
    };
    
    const expenseData = { amount: parseFloat(amount), date, category, notes };
    const newExpense = await sheetsService.addExpense(expenseData, defaultUser);
    
    res.status(201).json(newExpense);
  } catch (error) {
    console.error('Error adding expense:', error);
    res.status(500).json({ error: 'Failed to add expense', details: error.message });
  }
});

// Update expense
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Only allow updating amount, category, and notes
    const allowedUpdates = {};
    if (updates.amount !== undefined) allowedUpdates.amount = parseFloat(updates.amount);
    if (updates.category !== undefined) allowedUpdates.category = updates.category;
    if (updates.notes !== undefined) allowedUpdates.notes = updates.notes;
    
    if (Object.keys(allowedUpdates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    // Use default user since authentication is removed
    const defaultUser = {
      id: '1',
      name: 'Family User',
      email: 'family@example.com'
    };
    
    const result = await sheetsService.updateExpense(id, allowedUpdates, defaultUser);
    res.json(result);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update expense', details: error.message });
  }
});

// Delete expense
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await sheetsService.deleteExpense(id);
    res.json(result);
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense', details: error.message });
  }
});

// Get categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await sheetsService.getCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ error: 'Failed to get categories', details: error.message });
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
    res.status(500).json({ error: 'Failed to add category', details: error.message });
  }
});

// Get monthly report
router.get('/report/monthly', async (req, res) => {
  try {
    const { month, year } = req.query;
    
    if (month === undefined || year === undefined) {
      return res.status(400).json({ error: 'Month and year are required' });
    }
    
    const report = await sheetsService.getMonthlyReport(parseInt(month), parseInt(year));
    res.json(report);
  } catch (error) {
    console.error('Error generating monthly report:', error);
    res.status(500).json({ error: 'Failed to generate report', details: error.message });
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
    res.status(500).json({ error: 'Failed to reclassify expenses', details: error.message });
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
    const currentTotal = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const prevTotal = prevMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const change = currentTotal - prevTotal;
    const percentChange = prevTotal > 0 ? ((change / prevTotal) * 100) : 0;
    
    // Get category breakdown for current month
    const categoryTotals = {};
    currentMonthExpenses.forEach(expense => {
      if (!categoryTotals[expense.category]) {
        categoryTotals[expense.category] = 0;
      }
      categoryTotals[expense.category] += expense.amount;
    });
    
    // Get top 5 categories by amount
    const topCategories = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)
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
    res.status(500).json({ error: 'Failed to get summary', details: error.message });
  }
});

module.exports = router;
