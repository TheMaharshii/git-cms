#!/bin/bash

# Setup script for local development
# This script helps you test the app locally before deploying to GitHub Pages

echo "🎉 Personal CMS - Local Development Setup"
echo "=========================================="
echo ""

# Check if we're in the project directory
if [ ! -f "index.html" ]; then
    echo "❌ Error: index.html not found. Please run this script from the project root."
    exit 1
fi

echo "✅ Project files detected."
echo ""

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    PYTHON="python3"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    PYTHON="python3"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    PYTHON="python"
fi

echo "Starting local development server..."
echo ""

# Try Python 3 first
if command -v $PYTHON &> /dev/null; then
    echo "Using Python: $($PYTHON --version)"
    echo ""
    echo "Server running at: http://localhost:8000"
    echo ""
    echo "📂 Test URLs:"
    echo "   Frontend:  http://localhost:8000/index.html"
    echo "   Admin:     http://localhost:8000/admin.html"
    echo ""
    echo "⚠️  For admin panel to work locally:"
    echo "   - You still need valid GitHub credentials"
    echo "   - Create Personal Access Token at: https://github.com/settings/tokens"
    echo "   - Use that token in the admin panel"
    echo ""
    echo "Press Ctrl+C to stop the server..."
    echo ""
    
    $PYTHON -m http.server 8000
    exit 0
fi

# Try Node.js if Python not available
if command -v npx &> /dev/null; then
    echo "Python not found, trying Node.js..."
    echo ""
    echo "Server running at: http://localhost:8000"
    echo "Press Ctrl+C to stop the server..."
    echo ""
    
    npx http-server
    exit 0
fi

# Fallback instructions
echo "❌ No development server found."
echo ""
echo "Please install one of the following:"
echo "  1. Python 3 (https://www.python.org)"
echo "  2. Node.js (https://nodejs.org)"
echo ""
echo "Or start a manual server and visit:"
echo "  http://localhost:your-port/index.html"
