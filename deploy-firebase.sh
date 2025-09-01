#!/bin/bash

echo "🔥 Firebase Deployment Script for Family Expense Tracker"
echo "======================================================="
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed"
    echo "Please install it with: npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "🔐 Please log in to Firebase"
    firebase login
fi

echo "📦 Installing dependencies..."
npm run install:firebase

echo ""
echo "🔧 Setting up Firebase configuration..."
echo "Please provide the following information:"

read -p "Google Client ID: " GOOGLE_CLIENT_ID
read -p "Google Client Secret: " GOOGLE_CLIENT_SECRET
read -p "Google Sheets ID: " GOOGLE_SHEETS_ID
read -p "Google Service Account Email: " GOOGLE_SERVICE_ACCOUNT_EMAIL
echo "Please paste your Google Private Key (press Enter twice when done):"
GOOGLE_PRIVATE_KEY=""
while IFS= read -r line; do
    [[ -z $line ]] && break
    GOOGLE_PRIVATE_KEY+="$line\n"
done

read -p "Session Secret (random string): " SESSION_SECRET

echo ""
echo "🔧 Configuring Firebase Functions..."

firebase functions:config:set google.client_id="$GOOGLE_CLIENT_ID"
firebase functions:config:set google.client_secret="$GOOGLE_CLIENT_SECRET"
firebase functions:config:set google.sheets_id="$GOOGLE_SHEETS_ID"
firebase functions:config:set google.service_account_email="$GOOGLE_SERVICE_ACCOUNT_EMAIL"
firebase functions:config:set google.private_key="$GOOGLE_PRIVATE_KEY"
firebase functions:config:set app.session_secret="$SESSION_SECRET"

echo ""
echo "🏗️ Building application..."
npm run build:firebase

echo ""
echo "🚀 Deploying to Firebase..."
firebase deploy

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Visit your Firebase Hosting URL"
echo "2. Initialize Google Sheets: curl -X POST https://your-project.web.app/api/expenses/init"
echo "3. Update OAuth redirect URIs in Google Cloud Console"
echo ""
echo "For detailed instructions, see DEPLOYMENT.md"
