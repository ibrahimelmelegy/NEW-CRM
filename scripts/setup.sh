#!/bin/bash
# ================================================================
#   HP Tech CRM - Automated Setup Script (Linux/Mac)
# ================================================================
#   This script will set up the entire development environment
# ================================================================

set -e  # Exit on error

echo ""
echo "================================================================"
echo "   HP Tech CRM - Automated Setup"
echo "================================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo "[1/7] Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}[ERROR] Node.js is not installed!${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}[OK] Node.js is installed${NC}"
node --version

# Check npm
echo ""
echo "[2/7] Checking npm installation..."
if ! command -v npm &> /dev/null; then
    echo -e "${RED}[ERROR] npm is not installed!${NC}"
    exit 1
fi
echo -e "${GREEN}[OK] npm is installed${NC}"
npm --version

# Check Docker
echo ""
echo "[3/7] Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}[WARNING] Docker is not installed or not running!${NC}"
    echo "You can install Docker from https://www.docker.com/get-docker"
    echo "Continuing without Docker..."
else
    echo -e "${GREEN}[OK] Docker is installed${NC}"
    docker --version
fi

# Install root dependencies
echo ""
echo "[4/7] Installing root dependencies..."
npm install
echo -e "${GREEN}[OK] Root dependencies installed${NC}"

# Install backend dependencies
echo ""
echo "[5/7] Installing backend dependencies..."
cd leadify-backend-main
npm install
cd ..
echo -e "${GREEN}[OK] Backend dependencies installed${NC}"

# Install frontend dependencies
echo ""
echo "[6/7] Installing frontend dependencies..."
cd leadify-frontend-main
npm install --legacy-peer-deps
cd ..
echo -e "${GREEN}[OK] Frontend dependencies installed${NC}"

# Validate environment variables
echo ""
echo "[7/7] Validating environment variables..."
if ! node scripts/validate-env.js; then
    echo ""
    echo -e "${YELLOW}[WARNING] Environment validation failed!${NC}"
    echo "Please review and fix the issues above."
    echo ""
else
    echo -e "${GREEN}[OK] Environment variables validated${NC}"
fi

echo ""
echo "================================================================"
echo "   Setup Complete!"
echo "================================================================"
echo ""
echo "Next steps:"
echo "  1. Review environment variables in:"
echo "     - leadify-backend-main/.env"
echo "     - leadify-frontend-main/.env"
echo ""
echo "  2. Start Docker containers:"
echo "     npm run docker:up"
echo ""
echo "  3. Seed the database:"
echo "     npm run seed"
echo ""
echo "  4. Start development servers:"
echo "     npm run dev:all"
echo ""
echo "================================================================"
echo ""
