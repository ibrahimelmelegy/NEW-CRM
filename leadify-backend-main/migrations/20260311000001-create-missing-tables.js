'use strict';

/**
 * Creates 15 missing tables that block ~27 pages.
 * Uses raw SQL with IF NOT EXISTS so it's safe to re-run.
 */
module.exports = {
  async up(queryInterface) {
    // 1. goals
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "goals" (
        "id" SERIAL PRIMARY KEY,
        "title" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "level" VARCHAR(20) NOT NULL DEFAULT 'PERSONAL',
        "status" VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED',
        "progress" INTEGER NOT NULL DEFAULT 0,
        "owner" VARCHAR(100),
        "dueDate" DATE,
        "keyResults" JSONB,
        "parentGoalId" INTEGER,
        "tenantId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // 2. sales_competitors
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "sales_competitors" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(200) NOT NULL,
        "website" VARCHAR(255),
        "industry" VARCHAR(255),
        "size" VARCHAR(20),
        "strengths" TEXT,
        "weaknesses" TEXT,
        "notes" TEXT,
        "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        "threatLevel" VARCHAR(20),
        "products" JSONB,
        "marketShare" FLOAT,
        "rating" INTEGER,
        "dealsWon" INTEGER DEFAULT 0,
        "dealsLost" INTEGER DEFAULT 0,
        "pricingModel" VARCHAR(50),
        "basePrice" DECIMAL(12,2),
        "enterprisePrice" DECIMAL(12,2),
        "pricingNotes" TEXT,
        "tenantId" VARCHAR(255),
        "createdBy" INTEGER REFERENCES "Users"("id") ON DELETE SET NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // 3. proc_vendor_scorecards
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "proc_vendor_scorecards" (
        "id" SERIAL PRIMARY KEY,
        "vendorId" INTEGER NOT NULL REFERENCES "Vendors"("id") ON DELETE CASCADE,
        "period" VARCHAR(50) NOT NULL,
        "qualityScore" DECIMAL(3,1),
        "deliveryScore" DECIMAL(3,1),
        "priceScore" DECIMAL(3,1),
        "communicationScore" DECIMAL(3,1),
        "overallScore" DECIMAL(3,1),
        "notes" TEXT,
        "tenantId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // 4. hr_performance_reviews
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "hr_performance_reviews" (
        "id" SERIAL PRIMARY KEY,
        "employeeId" UUID NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
        "reviewerId" INTEGER NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
        "period" VARCHAR(50) NOT NULL,
        "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
        "overallRating" DECIMAL(3,1),
        "ratings" JSONB,
        "goals" JSONB,
        "comments" TEXT,
        "employeeFeedback" TEXT,
        "reviewDate" DATE,
        "tenantId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // 5. comm_booking_slots
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "comm_booking_slots" (
        "id" SERIAL PRIMARY KEY,
        "staffId" INTEGER NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
        "dayOfWeek" INTEGER NOT NULL,
        "startTime" VARCHAR(5) NOT NULL,
        "endTime" VARCHAR(5) NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "timezone" VARCHAR(50) NOT NULL DEFAULT 'UTC',
        "tenantId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // 6. comm_bookings (depends on comm_booking_slots)
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "comm_bookings" (
        "id" SERIAL PRIMARY KEY,
        "slotId" INTEGER REFERENCES "comm_booking_slots"("id") ON DELETE SET NULL,
        "staffId" INTEGER NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
        "clientId" UUID REFERENCES "clients"("id") ON DELETE SET NULL,
        "clientName" VARCHAR(100),
        "clientEmail" VARCHAR(100),
        "date" DATE NOT NULL,
        "startTime" VARCHAR(5) NOT NULL,
        "endTime" VARCHAR(5) NOT NULL,
        "timezone" VARCHAR(50) NOT NULL DEFAULT 'UTC',
        "status" VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED',
        "type" VARCHAR(50),
        "notes" TEXT,
        "location" VARCHAR(200),
        "reminderSent" BOOLEAN NOT NULL DEFAULT false,
        "confirmationSent" BOOLEAN NOT NULL DEFAULT false,
        "tenantId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // 7. comm_booking_pages
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "comm_booking_pages" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(200) NOT NULL,
        "description" TEXT,
        "duration" INTEGER NOT NULL DEFAULT 30,
        "type" VARCHAR(50) NOT NULL DEFAULT 'ONE_ON_ONE',
        "bufferTime" INTEGER NOT NULL DEFAULT 0,
        "maxBookingsPerDay" INTEGER,
        "workingHours" JSONB,
        "blackoutDates" JSONB,
        "customFields" JSONB,
        "branding" JSONB,
        "slug" VARCHAR(255),
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "bookingCount" INTEGER NOT NULL DEFAULT 0,
        "tenantId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // 8. wms_warehouses
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "wms_warehouses" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(200) NOT NULL,
        "location" VARCHAR(255),
        "address" VARCHAR(255),
        "manager" VARCHAR(255),
        "capacity" INTEGER,
        "currentOccupancy" INTEGER DEFAULT 0,
        "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        "tenantId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // 9. wms_warehouse_zones (depends on wms_warehouses)
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "wms_warehouse_zones" (
        "id" SERIAL PRIMARY KEY,
        "warehouseId" INTEGER NOT NULL REFERENCES "wms_warehouses"("id") ON DELETE CASCADE,
        "name" VARCHAR(100) NOT NULL,
        "type" VARCHAR(50) NOT NULL DEFAULT 'STORAGE',
        "capacity" INTEGER,
        "tenantId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // 10. wms_stock_transfers
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "wms_stock_transfers" (
        "id" SERIAL PRIMARY KEY,
        "transferNumber" VARCHAR(30) NOT NULL,
        "fromWarehouseId" INTEGER NOT NULL REFERENCES "wms_warehouses"("id") ON DELETE CASCADE,
        "toWarehouseId" INTEGER NOT NULL REFERENCES "wms_warehouses"("id") ON DELETE CASCADE,
        "items" JSONB NOT NULL,
        "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        "notes" TEXT,
        "shippedDate" DATE,
        "receivedDate" DATE,
        "tenantId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // 11. as_shipments
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "as_shipments" (
        "id" SERIAL PRIMARY KEY,
        "shipmentNumber" VARCHAR(50) NOT NULL,
        "orderId" VARCHAR(255),
        "carrier" VARCHAR(100),
        "trackingNumber" VARCHAR(255),
        "status" VARCHAR(20) NOT NULL DEFAULT 'PREPARING',
        "origin" VARCHAR(255),
        "destination" VARCHAR(255),
        "recipientName" VARCHAR(255),
        "weight" DECIMAL(8,2),
        "shippingCost" DECIMAL(12,2),
        "estimatedDelivery" TIMESTAMP WITH TIME ZONE,
        "actualDelivery" TIMESTAMP WITH TIME ZONE,
        "notes" TEXT,
        "tenantId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // 12. as_shipping_rates
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "as_shipping_rates" (
        "id" SERIAL PRIMARY KEY,
        "carrier" VARCHAR(100) NOT NULL,
        "zone" VARCHAR(50),
        "weightMin" DECIMAL(8,2) NOT NULL DEFAULT 0,
        "weightMax" DECIMAL(8,2) NOT NULL DEFAULT 999,
        "rate" DECIMAL(12,2) NOT NULL,
        "currency" VARCHAR(3) NOT NULL DEFAULT 'SAR',
        "estimatedDays" INTEGER,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "tenantId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // 13. as_e_signatures
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "as_e_signatures" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "documentId" VARCHAR(255),
        "title" VARCHAR(300) NOT NULL,
        "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        "recipients" JSONB,
        "sentAt" TIMESTAMP WITH TIME ZONE,
        "expiresAt" TIMESTAMP WITH TIME ZONE,
        "signedDocumentUrl" VARCHAR(255),
        "message" TEXT,
        "tenantId" VARCHAR(255),
        "createdBy" INTEGER REFERENCES "Users"("id") ON DELETE SET NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // 14. mkt_social_profiles
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "mkt_social_profiles" (
        "id" SERIAL PRIMARY KEY,
        "clientId" UUID REFERENCES "clients"("id") ON DELETE SET NULL,
        "platform" VARCHAR(50) NOT NULL,
        "handle" VARCHAR(100) NOT NULL,
        "profileUrl" VARCHAR(255),
        "followers" INTEGER DEFAULT 0,
        "engagement" INTEGER DEFAULT 0,
        "sentiment" VARCHAR(20),
        "lastActivity" TIMESTAMP WITH TIME ZONE,
        "notes" TEXT,
        "tenantId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // 15. mkt_social_posts
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "mkt_social_posts" (
        "id" SERIAL PRIMARY KEY,
        "content" TEXT NOT NULL,
        "platforms" JSONB NOT NULL DEFAULT '[]',
        "scheduledDate" DATE,
        "scheduledTime" VARCHAR(10),
        "status" VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
        "tenantId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    console.log('All 15 missing tables created successfully');
  },

  async down(queryInterface) {
    // Drop in reverse order (respecting FK dependencies)
    const tables = [
      'mkt_social_posts',
      'mkt_social_profiles',
      'as_e_signatures',
      'as_shipping_rates',
      'as_shipments',
      'wms_stock_transfers',
      'wms_warehouse_zones',
      'wms_warehouses',
      'comm_booking_pages',
      'comm_bookings',
      'comm_booking_slots',
      'hr_performance_reviews',
      'proc_vendor_scorecards',
      'sales_competitors',
      'goals'
    ];

    for (const table of tables) {
      await queryInterface.sequelize.query(`DROP TABLE IF EXISTS "${table}" CASCADE;`);
    }
  }
};
