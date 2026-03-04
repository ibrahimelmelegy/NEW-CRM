-- ============================================================
-- Migration 001: Add missing columns to existing tables
-- Run this against your PostgreSQL production database:
--   psql -U <DB_USER> -d <DB_NAME> -f migrations/001_add_missing_columns.sql
-- ============================================================

-- 1. Deals table: add probability column
ALTER TABLE "Deals" ADD COLUMN IF NOT EXISTS "probability" FLOAT DEFAULT 0;

-- 2. Clients table: add parentCompanyId column
ALTER TABLE "Clients" ADD COLUMN IF NOT EXISTS "parentCompanyId" UUID REFERENCES "Clients"("id") ON DELETE SET NULL;

-- 3. Invoices table: add dueDate column
ALTER TABLE "Invoices" ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP WITH TIME ZONE;

-- 4. CatalogProducts table: add stockQuantity column
ALTER TABLE "CatalogProducts" ADD COLUMN IF NOT EXISTS "stockQuantity" INTEGER DEFAULT 0;

-- 5. CalendarEvents table: add startTime column
ALTER TABLE "CalendarEvents" ADD COLUMN IF NOT EXISTS "startTime" VARCHAR(5);

-- ============================================================
-- Sync missing tables (run sequelize.sync after applying this)
-- The following tables should be auto-created by Sequelize sync:
--   goals, sales_competitors (via Competitor model), proc_vendor_scorecards,
--   hr_performance_reviews, comm_bookings, comm_booking_slots,
--   wms_warehouses, wms_stock_transfers, as_shipments, as_shipping_rates,
--   as_e_signatures, mkt_social_profiles, mkt_social_posts
-- ============================================================

-- Fix join table userId type mismatch (UUID → INTEGER)
-- WARNING: Only run these if the join tables exist and have no data
-- If they have data, migrate the data first.

DO $$
BEGIN
  -- dealUsers
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='dealUsers' AND column_name='userId' AND data_type='uuid') THEN
    ALTER TABLE "dealUsers" ALTER COLUMN "userId" TYPE INTEGER USING ("userId"::text::integer);
  END IF;

  -- leadUsers
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='leadUsers' AND column_name='userId' AND data_type='uuid') THEN
    ALTER TABLE "leadUsers" ALTER COLUMN "userId" TYPE INTEGER USING ("userId"::text::integer);
  END IF;

  -- opportunityUsers
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='opportunityUsers' AND column_name='userId' AND data_type='uuid') THEN
    ALTER TABLE "opportunityUsers" ALTER COLUMN "userId" TYPE INTEGER USING ("userId"::text::integer);
  END IF;

  -- clientUsers
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='clientUsers' AND column_name='userId' AND data_type='uuid') THEN
    ALTER TABLE "clientUsers" ALTER COLUMN "userId" TYPE INTEGER USING ("userId"::text::integer);
  END IF;

  -- userProjects
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='userProjects' AND column_name='userId' AND data_type='uuid') THEN
    ALTER TABLE "userProjects" ALTER COLUMN "userId" TYPE INTEGER USING ("userId"::text::integer);
  END IF;

  -- proposalUsers
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='proposalUsers' AND column_name='userId' AND data_type='uuid') THEN
    ALTER TABLE "proposalUsers" ALTER COLUMN "userId" TYPE INTEGER USING ("userId"::text::integer);
  END IF;
END $$;

SELECT 'Migration 001 completed successfully' AS status;
