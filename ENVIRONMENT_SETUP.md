# Environment Variables Setup Guide

## For Local Development (.env file)

Create a `.env` file in your project root with these variables:

```env
# Google OAuth Configugor the ration
# Get these from Google Cloud Console > APIs & Services > Credentials
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Google Sheets Configuration
# Get the SHEETS_ID from your Google Sheets URL
GOOGLE_SHEETS_ID=your_google_sheets_id_here

# Service Account Configuration
# Create a service account in Google Cloud Console and download the JSON key
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----"

# Session Secret (any random string, at least 32 characters)
SESSION_SECRET=your_session_secret_here

# Server Configuration
PORT=3000
NODE_ENV=development

# Client URL (update this to your actual Netlify URL after deployment)
CLIENT_URL=http://localhost:3000
```

## For Netlify Deployment

Add these same variables in your Netlify dashboard:
1. Go to Site Settings > Environment Variables
2. Add each variable with your actual values

## How to Get Each Value:

### GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable Google Sheets API and Google+ API
4. Go to "APIs & Services" > "Credentials"
5. Click "Create Credentials" > "OAuth 2.0 Client ID"
6. Choose "Web application"
7. Add authorized redirect URIs:
   - For local: `http://localhost:3000/api/auth/google/callback`
   - For Netlify: `https://your-site-name.netlify.app/api/auth/google/callback`

### GOOGLE_SHEETS_ID
1. Create a new Google Sheet
2. Copy the ID from the URL: `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`

### GOOGLE_SERVICE_ACCOUNT_EMAIL & GOOGLE_PRIVATE_KEY
1. In Google Cloud Console, go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Give it a name and description
4. Click "Create and Continue"
5. Skip role assignment for now
6. Click "Done"
7. Click on the created service account
8. Go to "Keys" tab
9. Click "Add Key" > "Create new key" > "JSON"
10. Download the JSON file
11. Copy the `client_email` and `private_key` from the JSON

### SESSION_SECRET
Generate a random string (at least 32 characters):
```bash
# You can use this command to generate one:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### CLIENT_URL
- For local development: `http://localhost:3000`
- For Netlify: `https://your-site-name.netlify.app`

## Important Security Notes:

1. **Never commit .env files to Git** - they're already in .gitignore
2. **Keep your credentials secure** - don't share them
3. **Use different credentials for development and production**
4. **Regularly rotate your secrets**

## Testing Your Setup:

1. Create the `.env` file with your values
2. Run `npm run dev` to test locally
3. Check that Google login works
4. Verify that expenses can be added to Google Sheets
