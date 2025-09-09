#!/bin/bash

echo "🚀 Starting LingoToday Progressive Web App..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the pwa-app directory"
    echo "   cd pwa-app && ./start-pwa.sh"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Start the development server
echo "🌐 Starting PWA development server on port 3001..."
echo ""
echo "📱 Open on your phone:"
echo "   http://localhost:3001"
echo "   http://your-computer-ip:3001"
echo ""
echo "💡 To find your IP address:"
echo "   - Windows: ipconfig"
echo "   - Mac/Linux: ifconfig"
echo ""
echo "🔧 Make sure your main backend is running on port 5000"
echo ""

npm run dev