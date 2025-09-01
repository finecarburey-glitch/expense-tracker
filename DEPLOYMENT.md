# 🚀 Deployment Guide - Family Expense Tracker

This guide will help you deploy the Family Expense Tracker to **Firebase Hosting** and **Netlify** for free.

## 🔧 Prerequisites

### Required Accounts
1. **Google Cloud Platform** account (free tier)
2. **Firebase** account (free Spark plan)
3. **Netlify** account (free tier)
4. **GitHub** account (for code repository)

### Required Setup
1. **Node.js 18+** installed locally
2. **Firebase CLI** installed: `npm install -g firebase-tools`
3. **Netlify CLI** installed: `npm install -g netlify-cli`
4. **Git** installed and configured

---

## 🔥 Option 1: Firebase Hosting + Cloud Functions

### Step 1: Google Cloud Setup

1. **Create Google Cloud Project**
   ```bash
   # Go to https://console.cloud.google.com/
   # Create a new project or select existing
   ```

2. **Enable APIs**
   - Google Sheets API
   - Google+ API (for OAuth)

3. **Create OAuth 2.0 Credentials**
   - Go to APIs & Services > Credentials
   - Create OAuth 2.0 Client ID
   - Application type: Web application
   - Authorized redirect URIs: `https://your-project.web.app/api/auth/google/callback`

4. **Create Service Account**
   - Go to APIs & Services > Credentials
   - Create Service Account
   - Download JSON key file
   - Extract `client_email` and `private_key`

### Step 2: Google Sheets Setup

1. **Create Google Sheet**
   ```bash
   # Go to https://sheets.google.com/
   # Create a new blank spreadsheet
   # Copy the Sheet ID from URL (between /d/ and /edit)
   ```

2. **Share with Service Account**
   - Click "Share" in Google Sheets
   - Add your service account email
   - Give "Editor" permissions

### Step 3: Firebase Project Setup

1. **Initialize Firebase Project**
   ```bash
   # Login to Firebase
   firebase login
   
   # Initialize project in your app directory
   cd /path/to/family-expense-tracker
   firebase init
   
   # Select:
   # - Functions (TypeScript)
   # - Hosting
   # - Use existing project or create new one
   ```

2. **Install Dependencies**
   ```bash
   npm run install:firebase
   ```

### Step 4: Configure Environment Variables

1. **Set Firebase Config**
   ```bash
   # Set Google OAuth credentials
   firebase functions:config:set google.client_id="your_client_id"
   firebase functions:config:set google.client_secret="your_client_secret"
   
   # Set Google Sheets credentials
   firebase functions:config:set google.sheets_id="your_sheet_id"
   firebase functions:config:set google.service_account_email="your_service_account@project.iam.gserviceaccount.com"
   firebase functions:config:set google.private_key="-----BEGIN PRIVATE KEY-----\nYour private key\n-----END PRIVATE KEY-----"
   
   # Set session secret
   firebase functions:config:set app.session_secret="your_random_session_secret"
   ```

### Step 5: Deploy to Firebase

1. **Build and Deploy**
   ```bash
   # Build the application
   npm run build:firebase
   
   # Deploy to Firebase
   firebase deploy
   ```

2. **Initialize Google Sheets**
   ```bash
   # After deployment, initialize the sheets
   curl -X POST https://your-project.web.app/api/expenses/init
   ```

### Step 6: Update OAuth Redirect URLs

1. Go to Google Cloud Console > APIs & Services > Credentials
2. Edit your OAuth 2.0 Client ID
3. Add your Firebase hosting URL to authorized redirect URIs:
   - `https://your-project.web.app/api/auth/google/callback`

---

## 🌐 Option 2: Netlify with Serverless Functions

### Step 1: Netlify Account Setup

1. **Sign up for Netlify**
   - Go to https://netlify.com
   - Sign up with GitHub account

### Step 2: Repository Setup

1. **Push to GitHub**
   ```bash
   # Initialize git repository
   git init
   git add .
   git commit -m "Initial commit"
   
   # Create GitHub repository and push
   git remote add origin https://github.com/yourusername/family-expense-tracker.git
   git push -u origin main
   ```

### Step 3: Netlify Site Creation

1. **Connect Repository**
   - Go to Netlify dashboard
   - Click "New site from Git"
   - Choose GitHub and select your repository
   - Build settings:
     - Build command: `npm run build:netlify`
     - Publish directory: `client/build`
     - Functions directory: `netlify/functions`

### Step 4: Environment Variables

1. **Set Environment Variables in Netlify**
   - Go to Site settings > Environment variables
   - Add the following variables:

   ```
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_SHEETS_ID=your_google_sheet_id
   GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account@project.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYour private key\n-----END PRIVATE KEY-----
   SESSION_SECRET=your_random_session_secret
   NODE_VERSION=18
   ```

### Step 5: Deploy to Netlify

1. **Trigger Deployment**
   ```bash
   # Push changes to trigger auto-deploy
   git add .
   git commit -m "Configure for Netlify"
   git push origin main
   ```

2. **Manual Deploy (Alternative)**
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli
   
   # Login to Netlify
   netlify login
   
   # Deploy
   netlify deploy --prod
   ```

### Step 6: Update OAuth Redirect URLs

1. Go to Google Cloud Console > APIs & Services > Credentials
2. Edit your OAuth 2.0 Client ID
3. Add your Netlify URL to authorized redirect URIs:
   - `https://your-site-name.netlify.app/api/auth/google/callback`

---

## 🔧 Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID | `123456789-abc.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 Client Secret | `GOCSPX-abcdefghijklmnop` |
| `GOOGLE_SHEETS_ID` | Google Sheet ID from URL | `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms` |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service account email | `expense-tracker@project.iam.gserviceaccount.com` |
| `GOOGLE_PRIVATE_KEY` | Service account private key | `-----BEGIN PRIVATE KEY-----\n...` |
| `SESSION_SECRET` | Random session secret | `super-secret-random-string-here` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_VERSION` | Node.js version | `18` |
| `NODE_ENV` | Environment mode | `production` |

---

## 🧪 Testing Your Deployment

### 1. Health Check
```bash
curl https://your-domain.com/api/health
# Should return: {"status":"OK","timestamp":"..."}
```

### 2. Initialize Google Sheets
```bash
curl -X POST https://your-domain.com/api/expenses/init
# Should return: {"success":true,"message":"Google Sheet initialized successfully"}
```

### 3. Test Authentication
1. Visit your deployed URL
2. Click "Continue with Google"
3. Complete OAuth flow
4. Should redirect to dashboard

### 4. Test Expense Creation
1. Navigate to "Add Expense"
2. Fill out the form
3. Submit expense
4. Check Google Sheets for new entry

---

## 🚨 Troubleshooting

### Common Issues

#### 1. OAuth Redirect URI Mismatch
**Error**: `redirect_uri_mismatch`
**Solution**: 
- Update OAuth 2.0 credentials in Google Cloud Console
- Add correct redirect URI: `https://your-domain.com/api/auth/google/callback`

#### 2. Google Sheets Permission Denied
**Error**: `The caller does not have permission`
**Solution**: 
- Share Google Sheet with service account email
- Grant "Editor" permissions

#### 3. Firebase Functions Cold Start
**Issue**: First request takes 10+ seconds
**Solution**: 
- This is normal for Firebase free tier
- Consider upgrading to Blaze plan for better performance

#### 4. Netlify Function Timeout
**Error**: Function execution timed out
**Solution**: 
- Optimize Google Sheets API calls
- Consider upgrading Netlify plan for longer timeouts

#### 5. Environment Variables Not Loading
**Solution for Firebase**:
```bash
firebase functions:config:get
```

**Solution for Netlify**:
- Check Site settings > Environment variables
- Ensure no extra spaces in variable values

### Debugging Steps

1. **Check Function Logs**
   ```bash
   # Firebase
   firebase functions:log
   
   # Netlify
   netlify functions:log
   ```

2. **Test Locally**
   ```bash
   # Firebase
   firebase emulators:start
   
   # Netlify
   netlify dev
   ```

3. **Verify Google Sheets Access**
   - Check service account permissions
   - Test API calls with Google Sheets API Explorer

---

## 💰 Cost Considerations

### Firebase (Free Spark Plan)
- **Hosting**: 10 GB storage, 1 GB transfer/month
- **Functions**: 125K invocations, 40K GB-seconds/month
- **Database**: 1 GB storage, 50K reads, 20K writes/day

### Netlify (Free Tier)
- **Hosting**: 100 GB bandwidth/month
- **Functions**: 125K requests, 100 hours runtime/month
- **Build minutes**: 300 minutes/month

### Google Sheets API (Free Tier)
- **Quota**: 300 requests/minute/user
- **Daily limit**: 1,000,000 requests/day

---

## 🔒 Security Best Practices

1. **Environment Variables**
   - Never commit secrets to git
   - Use strong, random session secrets
   - Rotate credentials regularly

2. **OAuth Configuration**
   - Restrict authorized domains
   - Use HTTPS only in production
   - Implement proper CORS policies

3. **Google Sheets**
   - Share only with necessary service accounts
   - Use minimal required permissions
   - Monitor access logs regularly

4. **Function Security**
   - Implement rate limiting
   - Validate all inputs
   - Use helmet.js for security headers

---

## 📈 Scaling Considerations

### When to Upgrade

#### Firebase
- Upgrade to **Blaze plan** when:
  - > 125K function invocations/month
  - Need faster cold starts
  - Require more bandwidth

#### Netlify
- Upgrade to **Pro plan** when:
  - > 100 GB bandwidth/month
  - Need more build minutes
  - Require advanced features

### Performance Optimization

1. **Caching**
   - Implement Redis for session storage
   - Cache Google Sheets responses
   - Use CDN for static assets

2. **Database Migration**
   - Consider migrating from Google Sheets to:
     - Firebase Firestore
     - PostgreSQL (Supabase)
     - MongoDB Atlas

3. **Function Optimization**
   - Minimize cold starts
   - Optimize bundle size
   - Use connection pooling

---

## 🎯 Next Steps After Deployment

1. **Custom Domain** (Optional)
   - Configure custom domain in hosting platform
   - Update OAuth redirect URIs
   - Set up SSL certificates

2. **Monitoring**
   - Set up error tracking (Sentry)
   - Monitor function performance
   - Track user analytics

3. **Backup Strategy**
   - Export Google Sheets regularly
   - Set up automated backups
   - Test restore procedures

4. **User Onboarding**
   - Create user documentation
   - Set up family member accounts
   - Test with all intended users

---

## 🆘 Support & Resources

### Documentation Links
- [Firebase Hosting Docs](https://firebase.google.com/docs/hosting)
- [Firebase Functions Docs](https://firebase.google.com/docs/functions)
- [Netlify Functions Docs](https://docs.netlify.com/functions/overview/)
- [Google Sheets API Docs](https://developers.google.com/sheets/api)

### Community Support
- [Firebase Community](https://firebase.google.com/community)
- [Netlify Community](https://community.netlify.com/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/firebase+netlify)

---

**🎉 Congratulations! Your Family Expense Tracker is now live and ready for your family to use!**
