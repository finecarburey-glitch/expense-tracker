import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import express from 'express';
import serverless from 'serverless-http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

// Import services and routes
import { GoogleSheetsService } from '../services/googleSheets';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Compression middleware
app.use(compression());

// CORS configuration
app.use(cors({
  origin: true,
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration (simplified for Netlify)
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: "/api/auth/google/callback"
}, async (accessToken: any, refreshToken: any, profile: any, done: any) => {
  try {
    const user = {
      id: profile.id,
      email: profile.emails?.[0]?.value,
      name: profile.displayName,
      picture: profile.photos?.[0]?.value
    };
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

passport.serializeUser((user: any, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});

// Authentication middleware
const isAuthenticated = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
};

// Initialize services
const sheetsService = new GoogleSheetsService();

// Auth routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/login',
    failureMessage: true
  }),
  (req, res) => {
    res.redirect('/');
  }
);

app.get('/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error during logout' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

app.get('/auth/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      isAuthenticated: true,
      user: {
        id: (req.user as any).id,
        name: (req.user as any).name,
        email: (req.user as any).email,
        picture: (req.user as any).picture
      }
    });
  } else {
    res.json({
      isAuthenticated: false,
      user: null
    });
  }
});

// Expense routes
app.post('/expenses/init', async (req, res) => {
  try {
    await sheetsService.initializeSheet();
    res.json({ success: true, message: 'Google Sheet initialized successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to initialize sheet', details: (error as Error).message });
  }
});

app.get('/expenses', isAuthenticated, async (req, res) => {
  try {
    const { category, month, year } = req.query;
    const filters: any = {};
    
    if (category) filters.category = category;
    if (month !== undefined) filters.month = parseInt(month as string);
    if (year !== undefined) filters.year = parseInt(year as string);
    
    const expenses = await sheetsService.getExpenses(filters);
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get expenses', details: (error as Error).message });
  }
});

app.post('/expenses', isAuthenticated, async (req, res) => {
  try {
    const { amount, date, category, notes } = req.body;
    
    if (!amount || !date || !category) {
      return res.status(400).json({ error: 'Amount, date, and category are required' });
    }
    
    const expenseData = { amount: parseFloat(amount), date, category, notes };
    const newExpense = await sheetsService.addExpense(expenseData, req.user);
    
    res.status(201).json(newExpense);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add expense', details: (error as Error).message });
  }
});

app.get('/expenses/categories', isAuthenticated, async (req, res) => {
  try {
    const categories = await sheetsService.getCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get categories', details: (error as Error).message });
  }
});

app.post('/expenses/categories', isAuthenticated, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Category name is required' });
    }
    
    const newCategory = await sheetsService.addCategory(name.trim());
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add category', details: (error as Error).message });
  }
});

app.get('/expenses/summary', isAuthenticated, async (req, res) => {
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
    
    const currentTotal = currentMonthExpenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);
    const prevTotal = prevMonthExpenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);
    const change = currentTotal - prevTotal;
    const percentChange = prevTotal > 0 ? ((change / prevTotal) * 100) : 0;
    
    const categoryTotals: { [key: string]: number } = {};
    currentMonthExpenses.forEach((expense: any) => {
      if (!categoryTotals[expense.category]) {
        categoryTotals[expense.category] = 0;
      }
      categoryTotals[expense.category] += expense.amount;
    });
    
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
    res.status(500).json({ error: 'Failed to get summary', details: (error as Error).message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Export handler for Netlify
export const handler = serverless(app);
