"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const express_1 = __importDefault(require("express"));
const serverless_http_1 = __importDefault(require("serverless-http"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_session_1 = __importDefault(require("express-session"));
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
// Import services and routes
const googleSheets_1 = require("../services/googleSheets");
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)({
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
app.use((0, compression_1.default)());
// CORS configuration
app.use((0, cors_1.default)({
    origin: true,
    credentials: true
}));
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Session configuration (simplified for Netlify)
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true
    }
}));
// Passport middleware
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
// Passport configuration
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const user = {
            id: profile.id,
            email: profile.emails?.[0]?.value,
            name: profile.displayName,
            picture: profile.photos?.[0]?.value
        };
        return done(null, user);
    }
    catch (error) {
        return done(error, null);
    }
}));
passport_1.default.serializeUser((user, done) => {
    done(null, user);
});
passport_1.default.deserializeUser((user, done) => {
    done(null, user);
});
// Authentication middleware
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: 'Authentication required' });
};
// Initialize services
const sheetsService = new googleSheets_1.GoogleSheetsService();
// Auth routes
app.get('/auth/google', passport_1.default.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', passport_1.default.authenticate('google', {
    failureRedirect: '/login',
    failureMessage: true
}), (req, res) => {
    res.redirect('/');
});
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
                id: req.user.id,
                name: req.user.name,
                email: req.user.email,
                picture: req.user.picture
            }
        });
    }
    else {
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
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to initialize sheet', details: error.message });
    }
});
app.get('/expenses', isAuthenticated, async (req, res) => {
    try {
        const { category, month, year } = req.query;
        const filters = {};
        if (category)
            filters.category = category;
        if (month !== undefined)
            filters.month = parseInt(month);
        if (year !== undefined)
            filters.year = parseInt(year);
        const expenses = await sheetsService.getExpenses(filters);
        res.json(expenses);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get expenses', details: error.message });
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
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to add expense', details: error.message });
    }
});
app.get('/expenses/categories', isAuthenticated, async (req, res) => {
    try {
        const categories = await sheetsService.getCategories();
        res.json(categories);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get categories', details: error.message });
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
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to add category', details: error.message });
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
        const currentTotal = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const prevTotal = prevMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const change = currentTotal - prevTotal;
        const percentChange = prevTotal > 0 ? ((change / prevTotal) * 100) : 0;
        const categoryTotals = {};
        currentMonthExpenses.forEach((expense) => {
            if (!categoryTotals[expense.category]) {
                categoryTotals[expense.category] = 0;
            }
            categoryTotals[expense.category] += expense.amount;
        });
        const topCategories = Object.entries(categoryTotals)
            .sort(([, a], [, b]) => b - a)
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
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get summary', details: error.message });
    }
});
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});
// Export handler for Netlify
const handler = async (event, context) => {
    return await (0, serverless_http_1.default)(app)(event, context);
};
exports.handler = handler;
