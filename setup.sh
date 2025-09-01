#!/bin/bash

echo "🚀 Family Expense Tracker Setup Script"
echo "======================================"
echo ""

# Check if Node.js is installed
if command -v node &> /dev/null; then
    echo "✅ Node.js is already installed: $(node --version)"
else
    echo "❌ Node.js is not installed"
    echo ""
    echo "Please install Node.js using one of these methods:"
    echo ""
    echo "1. Download from https://nodejs.org/ (Recommended)"
    echo "2. Using Homebrew (if available): brew install node"
    echo "3. Using nvm: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    echo ""
    echo "After installing Node.js, run this script again."
    exit 1
fi

# Check if npm is installed
if command -v npm &> /dev/null; then
    echo "✅ npm is already installed: $(npm --version)"
else
    echo "❌ npm is not installed"
    echo "Please install npm along with Node.js"
    exit 1
fi

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔧 Setting up client dependencies..."
cd client
npm install
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Copy env.example to .env and configure your Google credentials"
echo "2. Run: npm run dev"
echo "3. Initialize the Google Sheet: curl -X POST http://localhost:3000/api/expenses/init"
echo "4. Open http://localhost:3000 in your browser"
echo ""
echo "For detailed setup instructions, see README.md"
