# CRM Production Audit Report
**Date:** 2026-03-03
**URL:** https://crm.hp-tech.com
**Total Pages Tested:** 107

---

## EXECUTIVE SUMMARY

**27 pages have backend API errors (500/404). The root cause is 18 missing database tables/columns.**
The frontend pages load (HTTP 200) but their data doesn't because the database schema is out of sync with the code.

---

## CRITICAL: Missing Database Tables (12 tables)

These tables are referenced in backend models but were never created via `sequelize.sync()` or migration:

| # | Missing Table | Affects Page(s) | API Endpoints Broken |
|---|---|---|---|
| 1 | `goals` | `/sales/goals`, `/hr/goals` | `GET /api/goals`, `/api/goals/stats`, `/api/goals/overdue` |
| 2 | `sales_competitors` | `/sales/competitors` | `GET /api/competitors`, `/api/competitors/activity`, `/api/competitors/threat-matrix` |
| 3 | `proc_vendor_scorecards` | `/procurement/vendor-scorecard` | `GET /api/vendor-scorecard`, `/api/vendor-scorecard/benchmark`, `/api/vendor-scorecard/ranking` |
| 4 | `hr_performance_reviews` | `/hr/performance-reviews` | `GET /api/hr/performance` |
| 5 | `comm_bookings` | `/booking` | `GET /api/bookings`, `/api/bookings/pages`, `/api/bookings/analytics` |
| 6 | `comm_booking_slots` | `/booking` | `GET /api/bookings/slots` |
| 7 | `wms_warehouses` | `/warehouse` | `GET /api/warehouse`, `/api/warehouse/zones` |
| 8 | `wms_stock_transfers` | `/warehouse` | `GET /api/warehouse/transfers`, `/api/warehouse/stock`, `/api/warehouse/low-stock` |
| 9 | `as_shipments` | `/shipping` | `GET /api/shipping` |
| 10 | `as_shipping_rates` | `/shipping` | `GET /api/shipping/rates`, `/api/shipping/analytics` |
| 11 | `as_e_signatures` | `/documents/e-signatures` | `GET /api/e-signatures` |
| 12 | `mkt_social_profiles` + `mkt_social_posts` | `/marketing/social` | `GET /api/social-crm`, `/api/social-crm/posts` |

---

## CRITICAL: Missing Database Columns (6 columns)

These columns are referenced in queries but don't exist in the actual database:

| # | Missing Column | Table | Affects |
|---|---|---|---|
| 1 | `Deal.probability` | Deals | `/sales/deals`, `/sales/opportunity`, `/dashboards/executive`, `/dashboard/briefing`, `/sales/commissions`, `/sales/cpq`, `/sales/goals` |
| 2 | `client.parentCompanyId` | Clients | `/sales/clients` (page loads BLANK) |
| 3 | `Invoice.dueDate` | Invoices | `/sales/invoices` |
| 4 | `CatalogProduct.stockQuantity` | CatalogProducts | `/sales/cpq`, `/settings/products` |
| 5 | `CalendarEvent.startTime` | CalendarEvents | `/calendar`, `/dashboard/briefing` |

---

## BROKEN PAGES (500 errors) — 27 total

### SEVERITY: HIGH (page blank or completely non-functional)
| Page | Error | Root Cause |
|---|---|---|
| `/sales/clients` | 500 — page body EMPTY | `client.parentCompanyId` column missing |
| `/sales/deals` | 500 x7 errors | `Deal.probability` column missing |
| `/sales/opportunity` | 500 x4 errors | `Deal.probability` column missing (deal queries in opportunity) |
| `/sales/invoices` | 500 x12 errors | `Invoice.dueDate` column missing |
| `/warehouse` | 404 + 500 | `wms_warehouses`, `wms_stock_transfers` tables missing |
| `/shipping` | 500 x9 errors | `as_shipments`, `as_shipping_rates` tables missing |
| `/booking` | 500 x12 errors | `comm_bookings`, `comm_booking_slots` tables missing |

### SEVERITY: MEDIUM (page loads but data sections fail)
| Page | Error | Root Cause |
|---|---|---|
| `/dashboard/briefing` | 500 x4 | `CalendarEvent.startTime` + `Deal.probability` missing |
| `/dashboards/executive` | 500 x6 | `Deal.probability` missing |
| `/crm/activities` | 500 x2 | Activity log query errors |
| `/sales/subscriptions` | 500 x3 | Deal-related query failure |
| `/sales/cpq` | 500 x3 | `CatalogProduct.stockQuantity` missing |
| `/sales/commissions` | 500 x9 | `Deal.probability` + commissions tables |
| `/sales/competitors` | 500 x9 | `sales_competitors` table missing |
| `/sales/goals` | 500 x3 | `goals` table missing |
| `/calendar` | 500 x6 | `CalendarEvent.startTime` missing |
| `/procurement/vendor-scorecard` | 500 x9 | `proc_vendor_scorecards` table missing |
| `/marketing/social` | 500 x7 | `mkt_social_profiles`, `mkt_social_posts` tables missing |
| `/documents/e-signatures` | 500 x3 | `as_e_signatures` table missing |
| `/documents/editor` | 500 x6 | Depends on deals/clients/invoices (all broken) |
| `/hr/performance-reviews` | 500 x3 | `hr_performance_reviews` table missing |
| `/hr/goals` | 500 x9 | `goals` table missing |
| `/settings/products` | 500 x3 | `CatalogProduct.stockQuantity` missing |
| `/collaboration` | 404 x5 | `/api/staff` returns 404 (wrong route path) |
| `/analytics/heatmap` | TIMEOUT | Page never finishes loading (infinite loop?) |

---

## WORKING PAGES (no errors) — 80 pages

### Dashboards
- `/` (Home Dashboard)
- `/dashboard/war-room`
- `/dashboard/builder`
- `/views/kanban`

### CRM
- `/crm/customer-360`
- `/notifications`

### Sales
- `/sales/leads`
- `/sales/quotes`
- `/sales/sales-orders`
- `/sales/delivery-notes`
- `/sales/contracts`
- `/sales/proposals`
- `/sales/playbook`
- `/sales/documents`

### Operations (ALL WORKING)
- `/operations/projects`
- `/operations/daily-task`
- `/tasks`
- `/tasks/kanban`
- `/planner`
- `/operations/vehicle`
- `/operations/manpower`
- `/operations/additional-material`
- `/operations/services`
- `/operations/assets`
- `/operations/time-tracking`
- `/operations/field-tracking`
- `/operations/gantt`
- `/operations/resource-planner`

### Procurement
- `/procurement/vendors`
- `/procurement/distributors`
- `/procurement/local-suppliers`
- `/procurement/showrooms`
- `/procurement/purchase-orders`
- `/procurement/rfq`
- `/procurement/statistics`

### Supply Chain
- `/inventory`
- `/manufacturing`

### Communication (ALL WORKING)
- `/messaging`
- `/communications`
- `/ai-assistant`
- `/virtual-office`

### Marketing
- `/marketing/campaigns`
- `/marketing/sequences`
- `/marketing/ab-testing`
- `/marketing/form-builder`
- `/marketing/surveys`
- `/marketing/loyalty`

### Documents
- `/documents`
- `/automations`

### Reports & Analytics
- `/reports`
- `/reports/builder`
- `/reports/forecasting`
- `/analytics/relationship-graph`
- `/analytics/simulator`
- `/gamification/leaderboard`
- `/gamification/achievements`

### Finance (ALL WORKING)
- `/finance/accounting/credit-notes`
- `/finance/expenses`
- `/finance/budgets`
- `/finance/payments`
- `/finance/accounting/chart-of-accounts`
- `/finance/accounting/journal-entries`
- `/finance/accounting/reports/trial-balance`
- `/finance/accounting/reports/profit-loss`
- `/finance/accounting/reports/balance-sheet`
- `/finance/zatca`
- `/finance/zakaat`

### HR
- `/hr/employees`
- `/hr/org-chart`
- `/hr/departments`
- `/hr/attendance`
- `/hr/leave-requests`
- `/hr/payroll`
- `/hr/payroll/salary-structures`
- `/hr/payroll/end-of-service`
- `/hr/recruitment`
- `/hr/training`

### Support (ALL WORKING)
- `/support/tickets`
- `/support/tickets/kanban`
- `/support/dashboard`
- `/support/canned-responses`
- `/support/knowledge-base`
- `/support/live-chat`
- `/customer-success`

### Settings
- `/settings/theme-studio`
- `/settings/integrations`
- `/settings/security`
- `/settings/custom-fields`
- `/settings/pipeline`
- `/staff`
- `/roles`

---

## FIX PLAN (Priority Order)

### Fix 1: Add missing columns to existing tables (fixes 15+ pages)
```sql
ALTER TABLE "Deals" ADD COLUMN IF NOT EXISTS "probability" INTEGER DEFAULT 0;
ALTER TABLE "Clients" ADD COLUMN IF NOT EXISTS "parentCompanyId" INTEGER;
ALTER TABLE "Invoices" ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "CatalogProducts" ADD COLUMN IF NOT EXISTS "stockQuantity" INTEGER DEFAULT 0;
ALTER TABLE "CalendarEvents" ADD COLUMN IF NOT EXISTS "startTime" TIMESTAMP WITH TIME ZONE;
```

### Fix 2: Run sequelize.sync({ alter: true }) to create missing tables
This will create all 12 missing tables:
- `goals`, `sales_competitors`, `proc_vendor_scorecards`
- `hr_performance_reviews`, `comm_bookings`, `comm_booking_slots`
- `wms_warehouses`, `wms_stock_transfers`
- `as_shipments`, `as_shipping_rates`, `as_e_signatures`
- `mkt_social_profiles`, `mkt_social_posts`

### Fix 3: Fix `/api/staff` route (404)
The `/collaboration` page calls `GET /api/staff` but the backend registers staff routes at a different path. Need to verify and fix the route.

### Fix 4: Fix `/analytics/heatmap` timeout
Page enters infinite loading state. Need to investigate the component for infinite loops or missing data guards.

---

## SUMMARY
- **107 pages tested**
- **80 pages working** (75%)
- **27 pages broken** (25%)
- **Root cause: 12 missing DB tables + 5 missing DB columns**
- **Estimated fix: Run `sequelize.sync({ alter: true })` + 5 ALTER TABLE statements**
