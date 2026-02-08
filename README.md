# HP Tech CRM System

نظام إدارة علاقات العملاء (CRM) متكامل لشركة HP Tech.

A comprehensive Customer Relationship Management (CRM) system for HP Tech with support for leads, clients, opportunities, deals, projects, and proposals.

## 📋 Prerequisites / المتطلبات

- **Node.js** v18.0.0 or higher
- **Docker Desktop** (for PostgreSQL & Redis)
- **npm** v8.0.0 or higher

## 🚀 Quick Start / التشغيل السريع

### Automated Setup (Recommended)

**Windows:**

```bash
# From root directory
scripts\setup.bat
```

**Linux/Mac:**

```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

This will automatically:

1. ✅ Check prerequisites
2. ✅ Install all dependencies
3. ✅ Validate environment variables
4. ✅ Guide you through next steps

### Manual Setup

**For detailed setup instructions, see [SETUP.md](SETUP.md)**

Quick manual start:

```bash
# 1. Install all dependencies
npm run install:all

# 2. Start Docker containers (PostgreSQL + Redis)
npm run docker:up

# 3. Seed database with initial data
npm run seed

# 4. Start development servers
npm run dev:all
```

## 🔐 Default Login Credentials / بيانات الدخول

After running `npm run seed`, use these credentials:

```
Email: admin@hptech.com
Password: Heroo@1502
```

> **⚠️ SECURITY WARNING**: Change the default admin password immediately after first login, especially in production environments!

## 🌐 الروابط

| Service               | URL                            |
| --------------------- | ------------------------------ |
| **Frontend**          | http://localhost:3060          |
| **Backend API**       | http://localhost:5000          |
| **API Documentation** | http://localhost:5000/api-docs |

## 📁 هيكل المشروع

```
HP-Tech-CRM/
├── leadify-backend-main/     # Backend (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── user/             # User & Auth modules
│   │   ├── role/             # Roles & Permissions
│   │   ├── lead/             # Leads management
│   │   ├── client/           # Clients management
│   │   ├── project/          # Projects management
│   │   └── ...
│   ├── docker-compose.yml    # Database configuration
│   └── .env                  # Environment variables
│
├── leadify-frontend-main/    # Frontend (Nuxt 3 + Vue 3)
│   ├── pages/                # Application pages
│   ├── components/           # Vue components
│   ├── composables/          # Composition API utilities
│   └── .env                  # Frontend environment variables
│
├── start-all.bat             # سكريبت تشغيل كل الخدمات
└── diagnose.bat              # سكريبت تشخيص المشاكل
```

## 🛠️ Available Commands / الأوامر المتاحة

**From root directory:**

```bash
# Development
npm run dev:all           # Start both backend and frontend
npm run dev:backend       # Start backend only
npm run dev:frontend      # Start frontend only

# Building
npm run build:all         # Build both projects
npm run build:backend     # Build backend
npm run build:frontend    # Build frontend

# Testing
npm run test:all          # Run all tests
npm run test:backend      # Backend tests (97.38% coverage)
npm run test:frontend     # Frontend tests

# Linting
npm run lint:all          # Lint all code
npm run lint:backend      # Lint backend
npm run lint:frontend     # Lint frontend

# Database
npm run seed              # Seed database with initial data

# Docker
npm run docker:up         # Start PostgreSQL & Redis
npm run docker:down       # Stop containers
npm run docker:logs       # View container logs

# Utilities
npm run validate:env      # Validate environment variables
npm run install:all       # Install all dependencies
```

## 🔧 Troubleshooting / استكشاف الأخطاء

### Common Issues:

1. **"Cannot find module 'xxx'"**

   ```bash
   # Reinstall all dependencies
   npm run install:all
   ```

2. **"Port already in use"**

   ```bash
   # Kill processes on ports
   npx kill-port 3000 3060 5000 5433 6379
   ```

3. **"Database connection failed"**

   ```bash
   # Restart Docker containers
   npm run docker:down
   npm run docker:up
   ```

4. **"User not found" at login**

   ```bash
   # Re-seed the database
   npm run seed
   ```

5. **"Environment validation failed"**
   ```bash
   # Check what's missing
   npm run validate:env
   ```

**For more solutions, see [SETUP.md](SETUP.md#troubleshooting)**

## 📱 Key Features / الميزات الرئيسية

- ✅ Lead Management / إدارة العملاء المحتملين
- ✅ Client Management / إدارة العملاء
- ✅ Opportunity Tracking / إدارة الفرص
- ✅ Deal Management / إدارة الصفقات
- ✅ Project Management / إدارة المشاريع
- ✅ Proposal System / إدارة العروض
- ✅ User & Role Management / إدارة الموظفين والصلاحيات
- ✅ Statistical Dashboard / لوحة تحكم إحصائية
- ✅ Reports & Data Export / تقارير وتصدير البيانات
- ✅ Real-time Notifications / إشعارات فورية
- ✅ Multi-language Support (Arabic/English) / دعم اللغتين
- ✅ Advanced Permissions System / نظام صلاحيات متقدم
- ✅ Activity Logging / تسجيل الأنشطة

## 📚 Documentation

- **[SETUP.md](SETUP.md)** - Complete setup guide with troubleshooting
- **[SECURITY.md](SECURITY.md)** - Security information and known vulnerabilities
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Development guidelines _(coming soon)_
- **API Docs** - http://localhost:5000/api-docs (when running)

## 🧪 Testing

- **Backend Coverage**: 97.38% ✅ (Excellent)
- **Frontend Coverage**: In progress 🚧
- **E2E Tests**: Playwright

```bash
# Run all tests
npm run test:all

# Run backend tests with coverage
cd leadify-backend-main && npm test

# Run E2E tests
npx playwright test
```

## 🏗️ Tech Stack

**Backend:**

- Node.js + Express + TypeScript
- PostgreSQL 15 + Sequelize ORM
- Redis for caching
- Socket.io for real-time features
- JWT authentication + 2FA support
- Jest for testing (97.38% coverage)

**Frontend:**

- Nuxt 4 + Vue 3 + TypeScript
- Element Plus UI library
- Pinia for state management
- TipTap rich text editor
- i18n for localization
- Vitest for testing

## 🤝 Contributing

Development follows a systematic approach with quality gates:

1. All changes require tests
2. Linting must pass
3. No hardcoded strings (use i18n)
4. Environment variables must be documented
5. PR review required

See the comprehensive development plan in `.claude/plans/compiled-conjuring-fern.md`

## 📄 License

© 2024-2026 HP Tech. All rights reserved.

---

**Last Updated:** 2026-02-08 | **Version:** 1.0.0
