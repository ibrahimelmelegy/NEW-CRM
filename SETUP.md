# HP Tech CRM - Setup Guide

Complete guide to setting up the HP Tech CRM development environment from scratch.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Manual Setup](#manual-setup)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

1. **Node.js** (v18.0.0 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

2. **npm** (v8.0.0 or higher)
   - Usually comes with Node.js
   - Verify installation: `npm --version`

3. **Docker Desktop** (for database and Redis)
   - Download from [docker.com](https://www.docker.com/products/docker-desktop)
   - Verify installation: `docker --version`

### Optional but Recommended

- **Git** - For version control
- **VSCode** - Recommended IDE with extensions:
  - ESLint
  - Prettier
  - Volar (Vue)
  - TypeScript Vue Plugin

## Quick Start

The fastest way to get started (Windows):

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd NEW-CRM

# Run the automated setup script
scripts\setup.bat
```

For Linux/Mac:

```bash
# Make the script executable
chmod +x scripts/setup.sh

# Run the setup script
./scripts/setup.sh
```

The setup script will:

1. ✅ Check all prerequisites
2. ✅ Install all dependencies
3. ✅ Validate environment variables
4. ✅ Guide you through next steps

## Manual Setup

If you prefer to set up manually or the automated script fails:

### Step 1: Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd leadify-backend-main
npm install
cd ..

# Install frontend dependencies
cd leadify-frontend-main
npm install --legacy-peer-deps
cd ..
```

### Step 2: Configure Environment Variables

#### Backend Environment

1. Copy the example file:

```bash
cd leadify-backend-main
copy .env.example .env  # Windows
# OR
cp .env.example .env    # Linux/Mac
```

2. Edit `.env` and update the following:

**Required Variables:**

```bash
# Application
PORT=5000
NODE_ENV=development

# Database (for local Docker)
DB_HOST=localhost
DB_PORT=5433
DB_USER=leadify
DB_PASSWORD=YourSecurePassword123!
DB_NAME=leadify

# Docker PostgreSQL
POSTGRES_USER=leadify
POSTGRES_PASSWORD=YourSecurePassword123!
POSTGRES_DB=leadify

# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
SECRET_KEY=<64-character-hex-string>
ENCRYPTION_KEY=<64-character-hex-string>

# JWT
JWT_EXPIRATION_TIME=7d

# CORS (add your frontend URL)
CORS_ORIGINS=http://localhost:3000,http://localhost:3060

# Base URL
BASE_URL=http://localhost:5000/
```

**Optional Variables:**

```bash
# Email (configure if using email features)
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_app_password

# Or use SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key

# Admin credentials for seeding (use strong passwords!)
ADMIN_EMAIL=your_admin@example.com
ADMIN_PASSWORD=YourStrongPassword123!

# Security
ALLOW_SUPER_ADMIN_CREATION=false
SESSION_EXPIRATION_TIME=7
LOGIN_LOCK_TIME_MS=900000
LOGIN_MAX_ATTEMPTS=5
```

#### Frontend Environment

1. Copy the example file:

```bash
cd leadify-frontend-main
copy .env.example .env  # Windows
# OR
cp .env.example .env    # Linux/Mac
```

2. Edit `.env`:

```bash
# API Configuration
API_BASE_URL=http://localhost:5000/api/
BASE_URL=http://localhost:3060/
BUCKET_URL=http://localhost:5000/assets/

# Environment
NODE_ENV=development

# Features
ENABLE_DEBUG_MODE=true
```

### Step 3: Generate Security Keys

Generate strong random keys for SECRET_KEY and ENCRYPTION_KEY:

```bash
# Run this command twice to get two different keys
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and paste into your `.env` files.

### Step 4: Validate Configuration

```bash
# Return to root directory
cd ..

# Validate all environment variables
npm run validate:env
```

Fix any issues reported before proceeding.

## Database Setup

### Using Docker (Recommended)

1. **Start Docker containers** (PostgreSQL + Redis):

```bash
npm run docker:up
```

This starts:

- PostgreSQL on port `5433` (mapped to container's 5432)
- Redis on port `6379`

2. **Verify containers are running**:

```bash
docker ps
```

You should see:

- `leadify-db` (PostgreSQL)
- `leadify-redis` (Redis)

3. **Seed the database** with initial data:

```bash
npm run seed
```

This creates:

- Admin user with the email/password from your `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars
- Sample data for testing

### Manual PostgreSQL Setup (Alternative)

If not using Docker:

1. Install PostgreSQL 15
2. Create a database named `leadify`
3. Update `.env` variables:

```bash
DB_HOST=localhost
DB_PORT=5432  # Default PostgreSQL port
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=leadify
```

## Running the Application

### Development Mode

**Option 1: Run both frontend and backend together**

```bash
npm run dev:all
```

**Option 2: Run separately in different terminals**

Terminal 1 (Backend):

```bash
npm run dev:backend
```

Terminal 2 (Frontend):

```bash
npm run dev:frontend
```

### Access the Application

- **Frontend**: http://localhost:3060
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api-docs

### Default Login

Use the credentials configured in your `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables during seeding.

## Available Scripts

From the root directory:

```bash
# Installation
npm run install:all       # Install all dependencies

# Development
npm run dev:all           # Start both backend and frontend
npm run dev:backend       # Start backend only
npm run dev:frontend      # Start frontend only

# Building
npm run build:all         # Build both projects
npm run build:backend     # Build backend only
npm run build:frontend    # Build frontend only

# Testing
npm run test:all          # Run all tests
npm run test:backend      # Run backend tests
npm run test:frontend     # Run frontend tests

# Linting
npm run lint:all          # Lint all code
npm run lint:backend      # Lint backend
npm run lint:frontend     # Lint frontend

# Database
npm run seed              # Seed database with initial data

# Docker
npm run docker:up         # Start Docker containers
npm run docker:down       # Stop Docker containers
npm run docker:logs       # View Docker logs

# Validation
npm run validate:env      # Validate environment variables
```

## Project Structure

```
NEW-CRM/
├── leadify-backend-main/     # Node.js/Express backend
│   ├── src/
│   ├── .env                  # Backend environment variables
│   └── package.json
├── leadify-frontend-main/    # Nuxt 4 frontend
│   ├── pages/
│   ├── components/
│   ├── .env                  # Frontend environment variables
│   └── package.json
├── scripts/                  # Automation scripts
│   ├── setup.bat            # Windows setup script
│   ├── setup.sh             # Linux/Mac setup script
│   └── validate-env.js      # Environment validation
├── .env.example             # Example environment file
├── docker-compose.yml       # Docker configuration
└── package.json             # Root package.json
```

## Troubleshooting

### Common Issues

#### 1. "Cannot find module 'xxx'"

**Solution:**

```bash
# Clear all node_modules and reinstall
rm -rf node_modules leadify-backend-main/node_modules leadify-frontend-main/node_modules
npm run install:all
```

#### 2. "Port already in use"

**Solution:**

```bash
# Kill processes on ports
npx kill-port 3000 3060 5000 5433 6379

# Or manually find and kill
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:5000 | xargs kill
```

#### 3. "Database connection failed"

**Solutions:**

- Check Docker is running: `docker ps`
- Verify DB_PORT is `5433` in `.env`
- Restart containers: `npm run docker:down && npm run docker:up`
- Check database logs: `npm run docker:logs`

#### 4. "CORS Error"

**Solutions:**

- Ensure CORS_ORIGINS includes your frontend URL
- Backend `.env`: `CORS_ORIGINS=http://localhost:3000,http://localhost:3060`
- Restart backend after changing `.env`

#### 5. "Environment validation failed"

**Solution:**

```bash
# Run validation to see what's missing
npm run validate:env

# Fix reported issues in .env files
# Then validate again
```

#### 6. Frontend won't start / build errors

**Solution:**

```bash
cd leadify-frontend-main

# Clear Nuxt cache
rm -rf .nuxt .output node_modules/.cache

# Reinstall with legacy peer deps
npm install --legacy-peer-deps

# Try again
npm run dev
```

#### 7. "SECRET_KEY or ENCRYPTION_KEY missing"

**Solution:**

```bash
# Generate new keys
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Add to leadify-backend-main/.env
SECRET_KEY=<generated-key-1>
ENCRYPTION_KEY=<generated-key-2>
```

## Next Steps

After successful setup:

1. **Explore the API**: Visit http://localhost:5000/api-docs
2. **Run Tests**: `npm run test:all`
3. **Read Documentation**:
   - [README.md](README.md) - Project overview
   - [CONTRIBUTING.md](CONTRIBUTING.md) - Development guidelines
   - [SECURITY.md](SECURITY.md) - Security information

## Getting Help

- Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for more solutions
- Review the plan: `.claude/plans/compiled-conjuring-fern.md`
- Create an issue on GitHub
- Contact the development team

---

**Last Updated:** 2026-02-08
**Version:** 1.0.0
