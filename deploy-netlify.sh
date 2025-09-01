#!/bin/bash

echo "🌐 Netlify Deployment Script for Family Expense Tracker"
echo "======================================================="
echo ""

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI is not installed"
    echo "Please install it with: npm install -g netlify-cli"
    exit 1
fi

# Check if user is logged in
if ! netlify status &> /dev/null; then
    echo "🔐 Please log in to Netlify"
    netlify login
fi

echo "📦 Installing dependencies..."
npm run install:netlify-all

echo ""
echo "🔧 Environment Variables Setup"
echo "Please set the following environment variables in your Netlify dashboard:"
echo "Site settings > Environment variables"
echo ""
echo "Required variables:"
echo "- GOOGLE_CLIENT_ID"
echo "- GOOGLE_CLIENT_SECRET" 
echo "- GOOGLE_SHEETS_ID"
echo "- GOOGLE_SERVICE_ACCOUNT_EMAIL"
echo "- GOOGLE_PRIVATE_KEY"
echo "- SESSION_SECRET"
echo "- NODE_VERSION=18"
echo ""

read -p "Have you set all environment variables in Netlify dashboard? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please set the environment variables first, then run this script again."
    exit 1
fi

echo ""
echo "🏗️ Building application..."
npm run build:netlify

echo ""
echo "🚀 Deploying to Netlify..."
netlify deploy --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Visit your Netlify site URL"
echo "2. Initialize Google Sheets: curl -X POST https://your-site.netlify.app/api/expenses/init"
echo "3. Update OAuth redirect URIs in Google Cloud Console"
echo ""
echo "For detailed instructions, see DEPLOYMENT.md"
