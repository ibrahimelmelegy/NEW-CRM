-- Calendar Sync: Add external sync columns to calendar_events and create calendar_syncs table
-- Run this migration against the PostgreSQL database

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. Add external sync columns to calendar_events
-- ══════════════════════════════════════════════════════════════════════════════

-- Create ENUM type for external provider if not exists
DO $$ BEGIN
  CREATE TYPE enum_calendar_events_externalProvider AS ENUM ('google', 'outlook');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add columns to calendar_events table
ALTER TABLE calendar_events
  ADD COLUMN IF NOT EXISTS "externalId" VARCHAR(500),
  ADD COLUMN IF NOT EXISTS "externalProvider" enum_calendar_events_externalProvider,
  ADD COLUMN IF NOT EXISTS "lastSyncedAt" TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS "reminders" JSONB DEFAULT '[]'::jsonb;

-- Index for fast external ID lookups during sync
CREATE INDEX IF NOT EXISTS idx_calendar_events_external
  ON calendar_events ("externalId", "externalProvider")
  WHERE "externalId" IS NOT NULL;

-- Index for entity lookups
CREATE INDEX IF NOT EXISTS idx_calendar_events_entity
  ON calendar_events ("relatedEntityType", "relatedEntityId")
  WHERE "relatedEntityType" IS NOT NULL;

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. Create calendar_syncs table
-- ══════════════════════════════════════════════════════════════════════════════

-- Create ENUM types
DO $$ BEGIN
  CREATE TYPE enum_calendar_syncs_provider AS ENUM ('google', 'outlook');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE enum_calendar_syncs_syncStatus AS ENUM ('connected', 'disconnected', 'error', 'syncing');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS calendar_syncs (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider enum_calendar_syncs_provider NOT NULL,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "calendarId" VARCHAR(255),
  email VARCHAR(255),
  "lastSyncAt" TIMESTAMP WITH TIME ZONE,
  "tokenExpiresAt" TIMESTAMP WITH TIME ZONE,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "autoSync" BOOLEAN NOT NULL DEFAULT false,
  "syncStatus" enum_calendar_syncs_syncStatus NOT NULL DEFAULT 'disconnected',
  "lastError" TEXT,
  "syncedEventsCount" INTEGER NOT NULL DEFAULT 0,
  "tenantId" VARCHAR(255),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE("userId", provider)
);

-- Index for fast user+provider lookups
CREATE INDEX IF NOT EXISTS idx_calendar_syncs_user_provider
  ON calendar_syncs ("userId", provider);

-- Index for auto-sync cron job
CREATE INDEX IF NOT EXISTS idx_calendar_syncs_active_auto
  ON calendar_syncs ("isActive", "autoSync")
  WHERE "isActive" = true AND "autoSync" = true;
