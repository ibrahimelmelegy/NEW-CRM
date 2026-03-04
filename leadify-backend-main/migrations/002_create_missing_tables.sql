-- ============================================================
-- Migration 002: Create missing tables + add missing columns
-- Run: psql -h localhost -p 5433 -U <user> -d <db> -f this_file.sql
-- All statements use IF NOT EXISTS / IF EXISTS for idempotency
-- ============================================================

-- ─────────────────────────────────────────────
-- PART 1: ADD MISSING COLUMNS TO EXISTING TABLES
-- ─────────────────────────────────────────────

-- deals.probability (FLOAT, nullable, default 0)
ALTER TABLE deals ADD COLUMN IF NOT EXISTS probability FLOAT DEFAULT 0;

-- clients.parentCompanyId (UUID, self-referential FK)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS "parentCompanyId" UUID REFERENCES clients(id) ON DELETE SET NULL;

-- invoices.dueDate (TIMESTAMP, nullable)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP;

-- calendar_events.startTime (VARCHAR(5), nullable  e.g. "09:00")
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS "startTime" VARCHAR(5);

-- ─────────────────────────────────────────────
-- PART 2: BOOKING MODULE TABLES
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS comm_booking_slots (
  id            SERIAL PRIMARY KEY,
  "staffId"     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "dayOfWeek"   INTEGER NOT NULL,
  "startTime"   VARCHAR(5) NOT NULL,
  "endTime"     VARCHAR(5) NOT NULL,
  "isActive"    BOOLEAN NOT NULL DEFAULT TRUE,
  timezone      VARCHAR(50) NOT NULL DEFAULT 'UTC',
  "tenantId"    VARCHAR,
  "createdAt"   TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comm_booking_pages (
  id                  SERIAL PRIMARY KEY,
  name                VARCHAR(200) NOT NULL,
  description         TEXT,
  duration            INTEGER NOT NULL DEFAULT 30,
  type                VARCHAR(50) NOT NULL DEFAULT 'ONE_ON_ONE',
  "bufferTime"        INTEGER NOT NULL DEFAULT 0,
  "maxBookingsPerDay" INTEGER,
  "workingHours"      JSONB,
  "blackoutDates"     JSONB,
  "customFields"      JSONB,
  branding            JSONB,
  slug                VARCHAR,
  "isActive"          BOOLEAN NOT NULL DEFAULT TRUE,
  "bookingCount"      INTEGER NOT NULL DEFAULT 0,
  "tenantId"          VARCHAR,
  "createdAt"         TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"         TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comm_bookings (
  id                    SERIAL PRIMARY KEY,
  "slotId"              INTEGER REFERENCES comm_booking_slots(id) ON DELETE SET NULL,
  "staffId"             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "clientId"            UUID REFERENCES clients(id) ON DELETE SET NULL,
  "clientName"          VARCHAR(100),
  "clientEmail"         VARCHAR(100),
  date                  DATE NOT NULL,
  "startTime"           VARCHAR(5) NOT NULL,
  "endTime"             VARCHAR(5) NOT NULL,
  timezone              VARCHAR(50) NOT NULL DEFAULT 'UTC',
  status                VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED',
  type                  VARCHAR(50),
  notes                 TEXT,
  location              VARCHAR(200),
  "reminderSent"        BOOLEAN NOT NULL DEFAULT FALSE,
  "confirmationSent"    BOOLEAN NOT NULL DEFAULT FALSE,
  "tenantId"            VARCHAR,
  "createdAt"           TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"           TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- PART 3: WAREHOUSE MODULE TABLES
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS wms_warehouses (
  id                  SERIAL PRIMARY KEY,
  name                VARCHAR(200) NOT NULL,
  location            VARCHAR,
  address             VARCHAR,
  manager             VARCHAR,
  capacity            INTEGER,
  "currentOccupancy"  INTEGER DEFAULT 0,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  "tenantId"          VARCHAR,
  "createdAt"         TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"         TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wms_warehouse_zones (
  id            SERIAL PRIMARY KEY,
  "warehouseId" INTEGER NOT NULL REFERENCES wms_warehouses(id) ON DELETE CASCADE,
  name          VARCHAR(100) NOT NULL,
  type          VARCHAR(50) NOT NULL DEFAULT 'STORAGE',
  capacity      INTEGER,
  "tenantId"    VARCHAR,
  "createdAt"   TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wms_stock_transfers (
  id               SERIAL PRIMARY KEY,
  "transferNumber" VARCHAR(30) NOT NULL,
  "fromWarehouseId" INTEGER NOT NULL REFERENCES wms_warehouses(id) ON DELETE RESTRICT,
  "toWarehouseId"  INTEGER NOT NULL REFERENCES wms_warehouses(id) ON DELETE RESTRICT,
  items            JSONB NOT NULL DEFAULT '[]',
  status           VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  notes            TEXT,
  "shippedDate"    DATE,
  "receivedDate"   DATE,
  "tenantId"       VARCHAR,
  "createdAt"      TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- PART 4: SHIPPING MODULE TABLES
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS as_shipments (
  id                  SERIAL PRIMARY KEY,
  "shipmentNumber"    VARCHAR(50) NOT NULL,
  "orderId"           VARCHAR,
  carrier             VARCHAR(100),
  "trackingNumber"    VARCHAR,
  status              VARCHAR(20) NOT NULL DEFAULT 'PREPARING',
  origin              VARCHAR,
  destination         VARCHAR,
  "recipientName"     VARCHAR,
  weight              DECIMAL(8,2),
  "shippingCost"      DECIMAL(12,2),
  "estimatedDelivery" TIMESTAMP,
  "actualDelivery"    TIMESTAMP,
  notes               TEXT,
  "tenantId"          VARCHAR,
  "createdAt"         TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"         TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS as_shipping_rates (
  id              SERIAL PRIMARY KEY,
  carrier         VARCHAR(100) NOT NULL,
  zone            VARCHAR(50),
  "weightMin"     DECIMAL(8,2) NOT NULL DEFAULT 0,
  "weightMax"     DECIMAL(8,2) NOT NULL DEFAULT 999,
  rate            DECIMAL(12,2) NOT NULL,
  currency        VARCHAR(3) NOT NULL DEFAULT 'SAR',
  "estimatedDays" INTEGER,
  "isActive"      BOOLEAN NOT NULL DEFAULT TRUE,
  "tenantId"      VARCHAR,
  "createdAt"     TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- PART 5: E-SIGNATURES TABLE
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS as_e_signatures (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "documentId"        VARCHAR,
  title               VARCHAR(300) NOT NULL,
  status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  recipients          JSONB,
  "sentAt"            TIMESTAMP,
  "expiresAt"         TIMESTAMP,
  "signedDocumentUrl" VARCHAR,
  message             TEXT,
  "tenantId"          VARCHAR,
  "createdBy"         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  "createdAt"         TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"         TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- PART 6: SOCIAL CRM TABLES
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS mkt_social_profiles (
  id            SERIAL PRIMARY KEY,
  "clientId"    UUID REFERENCES clients(id) ON DELETE SET NULL,
  platform      VARCHAR(50) NOT NULL,
  handle        VARCHAR(100) NOT NULL,
  "profileUrl"  VARCHAR,
  followers     INTEGER DEFAULT 0,
  engagement    INTEGER DEFAULT 0,
  sentiment     VARCHAR(20),
  "lastActivity" TIMESTAMP,
  notes         TEXT,
  "tenantId"    VARCHAR,
  "createdAt"   TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mkt_social_posts (
  id              SERIAL PRIMARY KEY,
  content         TEXT NOT NULL,
  platforms       JSONB NOT NULL DEFAULT '[]',
  "scheduledDate" DATE,
  "scheduledTime" VARCHAR(10),
  status          VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
  "tenantId"      VARCHAR,
  "createdAt"     TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- PART 7: LIVE CHAT TABLES
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS comm_chat_conversations (
  id            SERIAL PRIMARY KEY,
  "clientId"    UUID REFERENCES clients(id) ON DELETE SET NULL,
  "staffId"     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'OPEN',
  channel       VARCHAR(20) NOT NULL DEFAULT 'WEB',
  subject       VARCHAR,
  "visitorName"  VARCHAR,
  "visitorEmail" VARCHAR,
  "visitorId"   VARCHAR,
  "departmentId" INTEGER,
  metadata      JSONB,
  priority      VARCHAR(10) NOT NULL DEFAULT 'NORMAL',
  "tenantId"    VARCHAR,
  "createdAt"   TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comm_chat_messages (
  id               SERIAL PRIMARY KEY,
  "conversationId" INTEGER NOT NULL REFERENCES comm_chat_conversations(id) ON DELETE CASCADE,
  "senderId"       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  "senderType"     VARCHAR(20) NOT NULL DEFAULT 'STAFF',
  content          TEXT NOT NULL,
  type             VARCHAR(20) NOT NULL DEFAULT 'TEXT',
  metadata         JSONB,
  "isRead"         BOOLEAN NOT NULL DEFAULT FALSE,
  "tenantId"       VARCHAR,
  "createdAt"      TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- PART 8: USEFUL INDEXES
-- ─────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_comm_bookings_staff    ON comm_bookings("staffId");
CREATE INDEX IF NOT EXISTS idx_comm_bookings_date     ON comm_bookings(date);
CREATE INDEX IF NOT EXISTS idx_comm_bookings_status   ON comm_bookings(status);
CREATE INDEX IF NOT EXISTS idx_wms_warehouses_tenant  ON wms_warehouses("tenantId");
CREATE INDEX IF NOT EXISTS idx_as_shipments_status    ON as_shipments(status);
CREATE INDEX IF NOT EXISTS idx_as_shipments_tenant    ON as_shipments("tenantId");
CREATE INDEX IF NOT EXISTS idx_mkt_social_tenant      ON mkt_social_profiles("tenantId");
CREATE INDEX IF NOT EXISTS idx_chat_conv_status       ON comm_chat_conversations(status);
CREATE INDEX IF NOT EXISTS idx_chat_msg_conv          ON comm_chat_messages("conversationId");

-- ─────────────────────────────────────────────
-- DONE
-- ─────────────────────────────────────────────
SELECT 'Migration 002 completed successfully' AS result;
