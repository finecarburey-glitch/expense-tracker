# Family Expense Tracker 💰

A simple, user-friendly web application for tracking and categorizing family expenses. Built with Node.js, Express, React, and Google Sheets for data storage.

## ✨ Features

### 🔐 User Authentication
- **Google OAuth Login**: Secure authentication using Google accounts
- **Family Member Support**: Multiple family members can log in and track expenses
- **User Differentiation**: Each expense is tagged with the user who added it

### 💸 Expense Management
- **Easy Expense Entry**: Simple form with large, clear inputs
- **Category System**: Pre-built categories (Food, Fuel, Medicine, etc.) + custom categories
- **Notes Support**: Optional notes for each expense
- **Date Tracking**: Automatic date selection with manual override option

### 📊 Reports & Analysis
- **Monthly Reports**: Comprehensive spending analysis by month
- **Category Breakdown**: Visual charts (bar and pie) showing spending patterns
- **Month-over-Month Comparison**: Track spending trends and changes
- **Top Categories**: Identify biggest spending areas

### 🗂️ Data Management
- **Google Sheets Integration**: All data stored in Google Sheets for easy access
- **Expense Reclassification**: Move expenses between categories
- **Category Management**: Add, edit, and manage expense categories
- **Data Export**: Access all data directly in Google Sheets

### 🎨 User Experience
- **Senior-Friendly Design**: Large buttons, clear labels, minimal clicks
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Clean Interface**: Modern, intuitive design with clear navigation
- **Accessibility**: High contrast, readable fonts, logical flow

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Google Cloud Platform account
- Google Sheets API enabled

### 1. Clone and Install
```bash
git clone <repository-url>
cd family-expense-tracker
npm run install:all
```

### 2. Google Cloud Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Sheets API
4. Create OAuth 2.0 credentials for web application
5. Create a service account for Google Sheets access
6. Download the service account JSON key

### 3. Google Sheets Setup
1. Create a new Google Sheet
2. Share it with your service account email
3. Note the Sheet ID from the URL

### 4. Environment Configuration
Copy `env.example` to `.env` and fill in your credentials:
```bash
cp env.example .env
```

Update the `.env` file with your Google credentials:
```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_SHEETS_ID=your_google_sheets_id_here
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----"
SESSION_SECRET=your_session_secret_here
```

### 5. Initialize the Application
```bash
# Start the server
npm run dev

# In another terminal, initialize the Google Sheet
curl -X POST http://localhost:3000/api/expenses/init
```

### 6. Access the Application
Open [http://localhost:3000](http://localhost:3000) in your browser

## 🏗️ Architecture

### Backend (Node.js + Express)
- **Server**: `server.js` - Main Express server with middleware
- **Authentication**: Google OAuth with Passport.js
- **Routes**: RESTful API endpoints for expenses and categories
- **Services**: Google Sheets integration service
- **Security**: Helmet, CORS, session management

### Frontend (React)
- **Components**: Modular React components with Tailwind CSS
- **Context**: Authentication context for user management
- **Routing**: React Router for navigation
- **Charts**: Recharts for data visualization
- **Responsive**: Mobile-first design approach

### Data Storage (Google Sheets)
- **Expenses Sheet**: All expense records with metadata
- **Categories Sheet**: Category definitions and metadata
- **Real-time Sync**: Immediate updates across all users

## 📱 Pages & Features

### Dashboard
- Monthly spending overview
- Recent expenses
- Quick action buttons
- Spending trends

### Add Expense
- Large, clear input fields
- Quick category selection
- Date picker
- Notes field

### All Expenses
- Filterable expense list
- Search functionality
- Edit/delete capabilities
- Category and date filters

### Reports
- Monthly spending analysis
- Interactive charts
- Category breakdowns
- Month-over-month comparison

### Categories
- Manage expense categories
- Add custom categories
- Reclassify expenses
- Default category protection

## 🔧 Configuration

### Google OAuth Setup
1. Configure authorized redirect URIs in Google Cloud Console
2. Add your domain to authorized origins
3. Set up OAuth consent screen

### Google Sheets Permissions
1. Share your sheet with service account email
2. Grant editor permissions
3. Ensure API quotas are sufficient

### Environment Variables
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `CLIENT_URL`: Frontend URL for CORS

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables
Set production environment variables:
- `NODE_ENV=production`
- `SESSION_SECRET`: Strong random string
- `CLIENT_URL`: Your production domain

### Hosting Options
- **Heroku**: Easy deployment with Git integration
- **Vercel**: Frontend hosting with serverless functions
- **DigitalOcean**: VPS hosting for full control
- **AWS/GCP**: Cloud hosting for scalability

## 🛡️ Security Features

- **HTTPS Only**: Secure connections in production
- **Session Management**: Secure session handling
- **Input Validation**: Server-side validation
- **CORS Protection**: Controlled cross-origin access
- **Helmet Security**: Security headers and protection

## 📊 Data Structure

### Expense Record
```json
{
  "id": "unique_id",
  "date": "2024-01-15",
  "amount": 1500,
  "category": "Food",
  "notes": "Weekly groceries",
  "addedBy": "user_id",
  "addedByName": "John Doe",
  "addedAt": "2024-01-15T10:30:00Z",
  "lastModified": "2024-01-15T10:30:00Z"
}
```

### Category Record
```json
{
  "name": "Food",
  "isDefault": true,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

## 🔄 API Endpoints

### Authentication
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/logout` - User logout
- `GET /api/auth/user` - Current user info

### Expenses
- `GET /api/expenses` - List expenses with filters
- `POST /api/expenses` - Add new expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/expenses/summary` - Dashboard summary
- `GET /api/expenses/report/monthly` - Monthly report

### Categories
- `GET /api/expenses/categories` - List categories
- `POST /api/expenses/categories` - Add category
- `POST /api/expenses/reclassify` - Reclassify expenses

## 🎯 Use Cases

### For Families
- Track daily household expenses
- Monitor spending patterns
- Budget planning and analysis
- Shared financial transparency

### For Seniors
- Simple, intuitive interface
- Large, readable text and buttons
- Minimal learning curve
- Clear visual feedback

### For Multiple Users
- Family member identification
- Collaborative expense tracking
- Shared category management
- Unified reporting

## 🚧 Development

### Local Development
```bash
npm run dev          # Start server with nodemon
npm run start        # Start production server
npm run build        # Build React app
```

### Code Structure
```
├── server.js              # Main server file
├── services/              # Business logic
│   └── googleSheets.js   # Google Sheets integration
├── routes/                # API routes
│   ├── auth.js           # Authentication routes
│   └── expenses.js       # Expense management routes
├── client/                # React frontend
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── contexts/     # React contexts
│   │   └── App.js        # Main app component
│   └── public/            # Static assets
└── package.json           # Dependencies and scripts
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
1. Check the documentation
2. Review existing issues
3. Create a new issue with details
4. Contact the development team

## 🔮 Future Enhancements

- **Budget Tracking**: Set and monitor spending limits
- **Receipt Upload**: Photo receipt storage
- **Export Options**: PDF reports and CSV exports
- **Mobile App**: Native mobile applications
- **Notifications**: Spending alerts and reminders
- **Multi-Currency**: Support for different currencies
- **Backup Options**: Multiple storage backends

---

**Built with ❤️ for families who want to track expenses together**
