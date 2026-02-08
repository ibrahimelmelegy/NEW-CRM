# NEW-CRM (Leadify) - Full Code Analysis Report

**Date**: 2026-02-08
**Analyzed by**: Claude Code (Automated Analysis)

---

## 1. Project Overview

This is a comprehensive **CRM System (Leadify)** built as a monorepo containing:

| Component | Technology |
|-----------|------------|
| **Backend** | Node.js + Express + TypeScript + Sequelize ORM |
| **Frontend** | Nuxt 4 + Vue 3 + Element Plus + Pinia |
| **Database** | PostgreSQL |
| **Cache** | Redis |
| **Real-time** | Socket.io |
| **AI** | OpenAI SDK |

---

## 2. Project Structure

```
/NEW-CRM/
├── leadify-backend-main/      # Backend (Express + TypeScript)
├── leadify-frontend-main/     # Frontend (Nuxt 4 + Vue 3)
├── React proposal/            # Alternative React proposal
├── tests/                     # E2E tests
└── scripts/                   # Utility scripts
```

---

## 3. Backend Analysis

### Architecture: MVC Pattern
```
src/
├── user/           # User management & authentication
├── lead/           # Lead management
├── deal/           # Deal management
├── opportunity/    # Opportunity management
├── client/         # Client management
├── project/        # Project management
├── proposal/       # Proposal management
├── vendor/         # Vendor management
├── procurement/    # Procurement
├── ai/             # AI integration
├── middleware/     # Auth, Validation middleware
├── config/         # Database configuration
├── utils/          # Utilities & helpers
└── cron/           # Scheduled tasks
```

### Database Models: 80+ Models
- **User Management**: User, Role, Session, ResetToken, LoginFailure, PasswordResetLog
- **Core CRM**: Lead, Client, Opportunity, Deal, Project, Proposal
- **Operations**: Manpower, Vehicle, Asset, Material, AdditionalMaterial, Service
- **Financial**: Invoice, ProposalFinanceTable, ProposalFinanceTableItem, PurchaseOrder, RFQ
- **Activity Logging**: LeadActivity, DealActivity, OpportunityActivity, ProjectActivity, ClientActivity, VendorActivity, PurchaseOrderActivity
- **Relationships**: ProposalUsers, LeadUsers, DealUsers, OpportunityUsers, ClientUsers, UserProjects

### API Routes: 30+ Route Modules
- `/api/auth` - Authentication (login, logout, forgot-password, reset-password)
- `/api/lead`, `/api/client`, `/api/deal`, `/api/opportunity` - CRM core
- `/api/proposal`, `/api/project` - Projects & proposals
- `/api/vendor`, `/api/procurement`, `/api/rfq` - Procurement
- `/api/ai` - AI services
- `/api/notification` - Notifications
- `/api/activity-logs` - Activity tracking
- `/api/settings`, `/api/integration` - Configuration
- `/api-docs` - Swagger documentation

### Key Backend Dependencies
- **Core**: express, typescript, sequelize-typescript
- **Auth**: jsonwebtoken, bcryptjs
- **Database**: pg (PostgreSQL driver), redis
- **Email**: nodemailer, @sendinblue/client
- **AI**: openai@^6.18.0
- **Cloud**: @azure/msal-node, microsoft-graph-client, googleapis
- **Utilities**: exceljs, xlsx, jspdf, date-fns
- **Validation**: class-validator, class-transformer
- **Real-time**: socket.io
- **Crons**: node-cron
- **API Docs**: swagger-jsdoc, swagger-ui-express

---

## 4. Frontend Analysis

### Pages: 78 Vue Files
- **Authentication**: login, forget-password, reset-password, reset-complete
- **Sales**: leads, opportunities, deals, reports
- **Operations**: daily-task, vehicle, manpower, assets, additional-material
- **Projects & Proposals**: projects, proposals with create/edit views
- **Admin**: staff, roles, settings, notifications

### Components: 100+ Components
- `global/` - Reusable UI components (Icon, AppBtn, Breadcramp, Editor, AIChatbot)
- `leads/`, `deal/`, `client/`, `opportunity/` - Domain-specific components
- `DocumentEditor.vue` - Advanced document editor (80KB+)
- `AIChatbot.vue` - AI chatbot integration
- `AISummarizer.vue` - AI text summarization

### Composables (Custom Hooks): 28 Hooks
- `useApiFetch` - API requests with token management
- `useApiCache` - API response caching
- `useLeads`, `useDeals`, `useProposals`, `useOpportunity` - CRUD operations
- `useSocket` - WebSocket management
- `usePermissions` - Permission checking
- `useSpotlight` - Search/spotlight feature
- `useTableFilter` - Table filtering
- `queryParams` - URL query parameter helpers
- `format`, `charts`, `utils` - Utility functions

### State Management: Pinia (5 Stores)
- `auth.ts` - Authentication, token, permissions, locale
- `common.ts` - Global app state, file upload, navigation
- `theme.ts` - Light/dark theme toggle
- `proposal.ts` + `proposalStore.ts` - Proposal state

### Key Frontend Dependencies
- **Framework**: nuxt@^4.3.0, vue@latest
- **UI**: element-plus@^2.13.2, tailwindcss
- **State**: pinia@^3.0.4, pinia-plugin-persistedstate
- **Validation**: vee-validate@^4.15.1, yup@^1.7.1
- **Rich Text**: @tiptap/* (complete editing suite)
- **Charts**: echarts@^6.0.0, vue-echarts
- **PDF**: jspdf@^4.1.0, pdf-lib, html2pdf.js
- **i18n**: @nuxtjs/i18n@^10.2.1 (English/Arabic with RTL)
- **Phone**: libphonenumber-js, vue-tel-input
- **Real-time**: socket.io-client@^4.8.3

---

## 5. Authentication System

### Login Flow
1. User submits email/password
2. Backend validates credentials with bcrypt
3. Checks login failure history (5 attempts max in 1 minute = lockout)
4. Creates JWT token + Session record in DB
5. Returns token to frontend
6. Frontend stores token in localStorage/cookie
7. All requests include Authorization header

### Password Reset
1. User requests reset via forgot-password endpoint
2. Backend creates ResetToken with 24hr expiry
3. Sends email with reset link (Outlook SMTP)
4. User validates token and sets new password
5. Token deleted and action logged

### Session Management
- Sessions stored in database (7 day default expiry)
- Expired sessions auto-cleaned on login
- Logout deletes session from DB

---

## 6. Key Features

- Full Lead, Client, Opportunity, Deal, Project management
- Proposal creation and tracking with finance tables
- Procurement management (RFQ, Purchase Orders, Vendors)
- Operations management (Manpower, Vehicles, Assets, Materials)
- Daily task management
- Reporting & analytics with ECharts
- AI integration (OpenAI) - chatbot + summarization
- Real-time notifications (Socket.io)
- Bilingual support (English/Arabic) with RTL
- PDF generation for proposals and invoices
- File upload and document management
- Role-based access control with permissions

---

## 7. Security Issues Identified

### CRITICAL Severity

| # | Issue | Location | Risk |
|---|-------|----------|------|
| 1 | **Hardcoded credentials in source** | `docker-compose.yml`, `README.md` | Full DB access compromise |
| 2 | **Admin permission bypass hardcoded** | `auth.global.ts:65` - bypasses all checks for `admin@hp-tech.com` | Complete authorization bypass |
| 3 | **CORS open to all origins** | `server.ts:15` - `origin: '*'` | CSRF attacks, unwanted API access |
| 4 | **Default JWT secret key** | `authController.ts:17` - fallback to `'your_secret_key'` | Token forgery if env var missing |
| 5 | **Permission checks disabled** | `auth.global.ts:74` - commented out with "RADICAL FIX" | Frontend doesn't enforce permissions |

### HIGH Severity

| # | Issue | Details |
|---|-------|---------|
| 6 | **Weak brute force protection** | 5 attempts with only 1-minute lockout |
| 7 | **No rate limiting** | No protection against request flooding |
| 8 | **Default seed passwords** | `'123456'` as default password in seed data |
| 9 | **No HTTPS enforcement** | No redirect or HSTS headers |
| 10 | **Verbose debug logging** | All requests logged including sensitive URLs |

### MEDIUM Severity

| # | Issue |
|---|-------|
| 11 | SQL query logging enabled in production config |
| 12 | API keys stored as plain text in database |
| 13 | No file upload size/type validation |
| 14 | Inconsistent Bearer token handling |
| 15 | CORS middleware called twice (redundant) |

---

## 8. Missing Security Features

1. **No 2FA/MFA** - Two-factor authentication
2. **No CSRF Protection** - Cross-Site Request Forgery prevention
3. **No Input Sanitization** - HTML/SQL sanitization
4. **No Security Headers** - CSP, X-Frame-Options, X-Content-Type-Options
5. **No Secrets Management** - No vault integration
6. **No Data Encryption** - Sensitive data stored as plain text
7. **No Session Idle Timeout** - Sessions never expire on inactivity
8. **No API Rate Limiting** - No throttling per IP/user

---

## 9. Good Practices Found

- Password hashing with bcryptjs (10 rounds)
- Server-side session validation
- Custom error handling (BaseError class)
- Internationalization support (i18n)
- Activity logging for all major operations
- Role-based access control system
- Real-time updates with Socket.io
- API documentation with Swagger
- TypeScript for type safety
- Sequelize ORM for database abstraction

---

## 10. Project Metrics

| Metric | Count |
|--------|-------|
| Backend Dependencies | 36 direct |
| Frontend Dependencies | 52 direct |
| API Route Modules | 30+ |
| Database Models | 80+ |
| Vue Pages | 78 |
| Components | 100+ |
| Custom Composables | 28 |
| Pinia Stores | 5 |
| Security Issues | 15 |
| Estimated Lines of Code | ~130,000+ |

---

## 11. Urgent Recommendations

### Priority 1 - Immediate Action
1. **Remove all hardcoded credentials** from source code and use environment variables
2. **Remove admin bypass** logic (`admin@hp-tech.com` hardcoded check)
3. **Restrict CORS** to specific allowed domains only
4. **Add rate limiting** using `express-rate-limit`
5. **Re-enable permission checks** disabled in frontend middleware

### Priority 2 - Short Term
6. **Remove debug logging** from production configuration
7. **Add security headers** using `helmet` middleware
8. **Enforce HTTPS** in production environment
9. **Encrypt API keys** stored in database
10. **Add file upload validation** (size limits, type restrictions)

### Priority 3 - Medium Term
11. **Implement 2FA/MFA** for user authentication
12. **Add CSRF protection** tokens
13. **Implement input sanitization** across all endpoints
14. **Add session idle timeout** mechanism
15. **Set up secrets management** (HashiCorp Vault or similar)

---

*Report generated automatically by Claude Code analysis.*
