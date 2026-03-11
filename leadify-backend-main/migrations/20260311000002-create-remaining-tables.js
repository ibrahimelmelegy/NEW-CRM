'use strict';

/**
 * Creates ~30 remaining missing tables for all registered models.
 * Uses raw SQL with IF NOT EXISTS for idempotent re-runs.
 * ENUM columns use VARCHAR for simplicity (Sequelize validates at app layer).
 */
module.exports = {
  async up(queryInterface) {
    // ── Account Planning ──────────────────────────────────────────────
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "account_plans" (
        "id" SERIAL PRIMARY KEY,
        "accountId" UUID NOT NULL REFERENCES "clients"("id") ON DELETE CASCADE,
        "name" VARCHAR(200) NOT NULL,
        "goals" JSONB NOT NULL DEFAULT '[]',
        "tier" VARCHAR(20) NOT NULL DEFAULT 'STANDARD',
        "healthScore" INTEGER,
        "renewalDate" TIMESTAMP WITH TIME ZONE,
        "annualRevenue" DECIMAL(14,2),
        "expansionPotential" DECIMAL(14,2),
        "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        "tenantId" VARCHAR(255),
        "ownerId" INTEGER REFERENCES "Users"("id") ON DELETE SET NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "account_stakeholders" (
        "id" SERIAL PRIMARY KEY,
        "accountPlanId" INTEGER NOT NULL REFERENCES "account_plans"("id") ON DELETE CASCADE,
        "name" VARCHAR(200) NOT NULL,
        "title" VARCHAR(200),
        "role" VARCHAR(100),
        "influence" INTEGER,
        "engagementScore" INTEGER,
        "email" VARCHAR(200),
        "phone" VARCHAR(20),
        "notes" TEXT,
        "sentiment" VARCHAR(20) NOT NULL DEFAULT 'NEUTRAL',
        "tenantId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // ── Attribution Modeling ──────────────────────────────────────────
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "attribution_touchpoints" (
        "id" SERIAL PRIMARY KEY,
        "dealId" UUID NOT NULL,
        "channel" VARCHAR(100) NOT NULL,
        "touchpointDate" TIMESTAMP WITH TIME ZONE NOT NULL,
        "campaign" VARCHAR(200),
        "creditPercent" FLOAT DEFAULT 0,
        "creditValue" DECIMAL(12,2),
        "interactionType" VARCHAR(20),
        "url" VARCHAR(500),
        "tenantId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // ── Cart Recovery ────────────────────────────────────────────────
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "abandoned_carts" (
        "id" SERIAL PRIMARY KEY,
        "customerId" UUID NOT NULL REFERENCES "clients"("id") ON DELETE CASCADE,
        "customerEmail" VARCHAR(200),
        "items" JSONB NOT NULL DEFAULT '[]',
        "totalValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
        "recoveryStatus" VARCHAR(20) NOT NULL DEFAULT 'ABANDONED',
        "lastReminder" TIMESTAMP WITH TIME ZONE,
        "reminderCount" INTEGER NOT NULL DEFAULT 0,
        "recoveredAt" TIMESTAMP WITH TIME ZONE,
        "abandonedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "tenantId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // ── CLV Analytics ────────────────────────────────────────────────
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "clv_records" (
        "id" SERIAL PRIMARY KEY,
        "customerId" UUID NOT NULL REFERENCES "clients"("id") ON DELETE CASCADE,
        "historicalRevenue" DECIMAL(14,2) NOT NULL DEFAULT 0,
        "predictedRevenue" DECIMAL(14,2) NOT NULL DEFAULT 0,
        "churnRisk" FLOAT,
        "segment" VARCHAR(50),
        "avgOrderValue" DECIMAL(14,2),
        "purchaseFrequency" INTEGER,
        "customerAge" FLOAT,
        "lastPurchaseDate" TIMESTAMP WITH TIME ZONE,
        "calculatedAt" TIMESTAMP WITH TIME ZONE,
        "tenantId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // ── Compliance Manager ───────────────────────────────────────────
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "consent_records" (
        "id" SERIAL PRIMARY KEY,
        "contactId" UUID NOT NULL,
        "contactEmail" VARCHAR(200),
        "consentTypes" JSONB NOT NULL DEFAULT '[]',
        "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        "consentDate" TIMESTAMP WITH TIME ZONE NOT NULL,
        "expiryDate" TIMESTAMP WITH TIME ZONE,
        "withdrawnAt" TIMESTAMP WITH TIME ZONE,
        "source" VARCHAR(100),
        "regulation" VARCHAR(50),
        "notes" TEXT,
        "tenantId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "data_requests" (
        "id" SERIAL PRIMARY KEY,
        "requesterId" UUID NOT NULL,
        "requesterEmail" VARCHAR(200),
        "type" VARCHAR(30) NOT NULL,
        "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        "deadline" TIMESTAMP WITH TIME ZONE NOT NULL,
        "completedAt" TIMESTAMP WITH TIME ZONE,
        "description" TEXT,
        "resolution" TEXT,
        "regulation" VARCHAR(50),
        "tenantId" VARCHAR(255),
        "assignedTo" INTEGER REFERENCES "Users"("id") ON DELETE SET NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // ── Demand Forecasting ───────────────────────────────────────────
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "demand_forecasts" (
        "id" SERIAL PRIMARY KEY,
        "product" VARCHAR(200) NOT NULL,
        "period" VARCHAR(50) NOT NULL,
        "predictedDemand" FLOAT NOT NULL,
        "actualDemand" FLOAT,
        "confidence" FLOAT,
        "method" VARCHAR(20) NOT NULL DEFAULT 'MOVING_AVG',
        "windowSize" INTEGER DEFAULT 3,
        "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        "historicalData" JSONB,
        "tenantId" VARCHAR(255),
        "createdBy" INTEGER REFERENCES "Users"("id") ON DELETE SET NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // ── Segmentation ─────────────────────────────────────────────────
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "customer_segments" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(200) NOT NULL,
        "description" TEXT,
        "criteria" JSONB NOT NULL DEFAULT '[]',
        "customerCount" INTEGER NOT NULL DEFAULT 0,
        "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        "type" VARCHAR(20),
        "lastEvaluatedAt" TIMESTAMP WITH TIME ZONE,
        "tenantId" VARCHAR(255),
        "createdBy" INTEGER REFERENCES "Users"("id") ON DELETE SET NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // ── Social Listening ─────────────────────────────────────────────
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "social_mentions" (
        "id" SERIAL PRIMARY KEY,
        "platform" VARCHAR(50) NOT NULL,
        "content" TEXT NOT NULL,
        "sentiment" VARCHAR(20),
        "sentimentScore" FLOAT,
        "author" VARCHAR(200),
        "url" VARCHAR(500),
        "mentionDate" TIMESTAMP WITH TIME ZONE NOT NULL,
        "reach" INTEGER DEFAULT 0,
        "engagement" INTEGER DEFAULT 0,
        "keyword" VARCHAR(200),
        "status" VARCHAR(20) NOT NULL DEFAULT 'NEW',
        "tenantId" VARCHAR(255),
        "assignedTo" INTEGER REFERENCES "Users"("id") ON DELETE SET NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // ── Usage Billing ────────────────────────────────────────────────
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "usage_meters" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(200) NOT NULL,
        "description" TEXT,
        "unit" VARCHAR(50) NOT NULL,
        "pricePerUnit" DECIMAL(10,4) NOT NULL,
        "billingModel" VARCHAR(30) NOT NULL DEFAULT 'PER_UNIT',
        "tiers" JSONB,
        "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        "tenantId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "usage_records" (
        "id" SERIAL PRIMARY KEY,
        "meterId" INTEGER NOT NULL REFERENCES "usage_meters"("id") ON DELETE CASCADE,
        "customerId" UUID NOT NULL,
        "quantity" FLOAT NOT NULL,
        "recordedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "billingPeriod" VARCHAR(50),
        "metadata" JSONB,
        "tenantId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // ── Competitor Deals ─────────────────────────────────────────────
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "sales_competitor_deals" (
        "id" SERIAL PRIMARY KEY,
        "competitorId" INTEGER NOT NULL REFERENCES "sales_competitors"("id") ON DELETE CASCADE,
        "dealId" UUID NOT NULL REFERENCES "deals"("id") ON DELETE CASCADE,
        "outcome" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        "notes" TEXT,
        "tenantId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // ── CPQ ──────────────────────────────────────────────────────────
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "sales_price_books" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(200) NOT NULL,
        "description" TEXT,
        "currency" VARCHAR(3) NOT NULL DEFAULT 'SAR',
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "effectiveDate" DATE,
        "expiryDate" DATE,
        "tenantId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "sales_price_book_entries" (
        "id" SERIAL PRIMARY KEY,
        "priceBookId" INTEGER NOT NULL REFERENCES "sales_price_books"("id") ON DELETE CASCADE,
        "productName" VARCHAR(200) NOT NULL,
        "sku" VARCHAR(50),
        "unitPrice" DECIMAL(12,2) NOT NULL,
        "costPrice" DECIMAL(12,2),
        "minQty" INTEGER DEFAULT 1,
        "maxDiscount" DECIMAL(5,2),
        "tenantId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "cpq_quotes" (
        "id" SERIAL PRIMARY KEY,
        "quoteNumber" VARCHAR(20) NOT NULL UNIQUE,
        "title" VARCHAR(200) NOT NULL,
        "clientId" UUID REFERENCES "clients"("id") ON DELETE SET NULL,
        "dealId" INTEGER,
        "opportunityId" INTEGER,
        "priceBookId" INTEGER REFERENCES "sales_price_books"("id") ON DELETE SET NULL,
        "items" JSONB NOT NULL DEFAULT '[]',
        "subtotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
        "discountTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
        "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 15,
        "taxAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
        "total" DECIMAL(14,2) NOT NULL DEFAULT 0,
        "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
        "validUntil" DATE,
        "currency" VARCHAR(3) NOT NULL DEFAULT 'SAR',
        "notes" TEXT,
        "termsAndConditions" TEXT,
        "tenantId" VARCHAR(255),
        "createdBy" INTEGER REFERENCES "Users"("id") ON DELETE SET NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "cpq_pricing_rules" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(200) NOT NULL,
        "type" VARCHAR(20) NOT NULL,
        "conditions" JSONB DEFAULT '{}',
        "discountPercent" DECIMAL(5,2) DEFAULT 0,
        "discountAmount" DECIMAL(14,2) DEFAULT 0,
        "minQuantity" INTEGER,
        "maxQuantity" INTEGER,
        "productCategory" VARCHAR(100),
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "priority" INTEGER NOT NULL DEFAULT 0,
        "tenantId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // ── A/B Testing ──────────────────────────────────────────────────
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "mkt_ab_tests" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(200) NOT NULL,
        "type" VARCHAR(50) NOT NULL DEFAULT 'EMAIL',
        "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
        "variants" JSONB,
        "results" JSONB,
        "startDate" DATE,
        "endDate" DATE,
        "winnerVariant" VARCHAR(255),
        "confidence" DECIMAL(5,2),
        "notes" TEXT,
        "tenantId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // ── Form Builder ─────────────────────────────────────────────────
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "mkt_form_templates" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(200) NOT NULL,
        "description" TEXT,
        "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        "fields" JSONB,
        "settings" JSONB,
        "thankYouMessage" VARCHAR(255),
        "redirectUrl" VARCHAR(255),
        "createLead" BOOLEAN NOT NULL DEFAULT false,
        "submissionCount" INTEGER NOT NULL DEFAULT 0,
        "viewCount" INTEGER NOT NULL DEFAULT 0,
        "embedToken" VARCHAR(255),
        "enableRecaptcha" BOOLEAN NOT NULL DEFAULT false,
        "enableHoneypot" BOOLEAN NOT NULL DEFAULT true,
        "rateLimit" INTEGER NOT NULL DEFAULT 10,
        "styling" JSONB,
        "autoResponse" JSONB,
        "conditionalLogic" JSONB,
        "tenantId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "mkt_form_submissions" (
        "id" SERIAL PRIMARY KEY,
        "formId" INTEGER NOT NULL,
        "data" JSONB NOT NULL,
        "source" VARCHAR(255),
        "ipAddress" VARCHAR(255),
        "leadId" VARCHAR(255),
        "utmParams" JSONB,
        "userAgent" VARCHAR(255),
        "tenantId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // ── Loyalty ──────────────────────────────────────────────────────
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "mkt_loyalty_programs" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(200) NOT NULL,
        "description" TEXT,
        "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        "rules" JSONB,
        "tiers" JSONB,
        "pointsPerCurrency" DECIMAL(5,2) DEFAULT 1,
        "tenantId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "mkt_loyalty_points" (
        "id" SERIAL PRIMARY KEY,
        "clientId" UUID NOT NULL REFERENCES "clients"("id") ON DELETE CASCADE,
        "programId" INTEGER NOT NULL,
        "points" INTEGER NOT NULL,
        "transactionType" VARCHAR(20) NOT NULL,
        "description" VARCHAR(255),
        "referenceId" VARCHAR(255),
        "tenantId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // ── Surveys ──────────────────────────────────────────────────────
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "mkt_surveys" (
        "id" SERIAL PRIMARY KEY,
        "title" VARCHAR(200) NOT NULL,
        "description" TEXT,
        "type" VARCHAR(30) NOT NULL DEFAULT 'CUSTOM',
        "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
        "questions" JSONB,
        "responseCount" INTEGER NOT NULL DEFAULT 0,
        "startDate" DATE,
        "endDate" DATE,
        "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
        "allowMultipleResponses" BOOLEAN NOT NULL DEFAULT false,
        "createdBy" INTEGER,
        "tenantId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "mkt_survey_responses" (
        "id" SERIAL PRIMARY KEY,
        "surveyId" INTEGER NOT NULL REFERENCES "mkt_surveys"("id") ON DELETE CASCADE,
        "respondentId" INTEGER,
        "respondentEmail" VARCHAR(255),
        "respondentName" VARCHAR(255),
        "answers" JSONB NOT NULL,
        "completedAt" TIMESTAMP WITH TIME ZONE,
        "tenantId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // ── Live Chat ────────────────────────────────────────────────────
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "comm_chat_conversations" (
        "id" SERIAL PRIMARY KEY,
        "clientId" UUID REFERENCES "clients"("id") ON DELETE SET NULL,
        "staffId" INTEGER REFERENCES "Users"("id") ON DELETE SET NULL,
        "status" VARCHAR(20) NOT NULL DEFAULT 'OPEN',
        "channel" VARCHAR(20) NOT NULL DEFAULT 'WEB',
        "subject" VARCHAR(255),
        "visitorName" VARCHAR(255),
        "visitorEmail" VARCHAR(255),
        "visitorId" VARCHAR(255),
        "departmentId" INTEGER,
        "metadata" JSONB,
        "priority" VARCHAR(10) NOT NULL DEFAULT 'NORMAL',
        "rating" INTEGER,
        "feedback" TEXT,
        "startedAt" TIMESTAMP WITH TIME ZONE,
        "resolvedAt" TIMESTAMP WITH TIME ZONE,
        "messageCount" INTEGER DEFAULT 0,
        "unreadCount" INTEGER DEFAULT 0,
        "lastMessage" TEXT,
        "cannedResponses" JSONB DEFAULT '[]',
        "tenantId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "comm_chat_messages" (
        "id" SERIAL PRIMARY KEY,
        "conversationId" INTEGER NOT NULL REFERENCES "comm_chat_conversations"("id") ON DELETE CASCADE,
        "senderId" VARCHAR(255),
        "senderName" VARCHAR(255),
        "senderType" VARCHAR(20) NOT NULL,
        "content" TEXT NOT NULL,
        "messageType" VARCHAR(20) NOT NULL DEFAULT 'TEXT',
        "fileUrl" VARCHAR(255),
        "fileName" VARCHAR(255),
        "isRead" BOOLEAN NOT NULL DEFAULT false,
        "readAt" TIMESTAMP WITH TIME ZONE,
        "tenantId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // ── Warranty ─────────────────────────────────────────────────────
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "as_warranties" (
        "id" SERIAL PRIMARY KEY,
        "productName" VARCHAR(200) NOT NULL,
        "serialNumber" VARCHAR(50),
        "clientId" UUID REFERENCES "clients"("id") ON DELETE SET NULL,
        "startDate" DATE NOT NULL,
        "endDate" DATE NOT NULL,
        "type" VARCHAR(30) NOT NULL DEFAULT 'STANDARD',
        "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        "terms" TEXT,
        "tenantId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "as_warranty_claims" (
        "id" SERIAL PRIMARY KEY,
        "warrantyId" INTEGER NOT NULL REFERENCES "as_warranties"("id") ON DELETE CASCADE,
        "description" TEXT NOT NULL,
        "status" VARCHAR(20) NOT NULL DEFAULT 'OPEN',
        "resolution" TEXT,
        "claimAmount" DECIMAL(12,2),
        "resolvedAt" TIMESTAMP WITH TIME ZONE,
        "tenantId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // ── E-Commerce ───────────────────────────────────────────────────
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "ec_categories" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" VARCHAR(255) NOT NULL,
        "slug" VARCHAR(255) NOT NULL UNIQUE,
        "description" TEXT,
        "image" VARCHAR(255),
        "parentId" UUID REFERENCES "ec_categories"("id") ON DELETE SET NULL,
        "sortOrder" INTEGER DEFAULT 0,
        "isActive" BOOLEAN DEFAULT true,
        "productCount" INTEGER DEFAULT 0,
        "tenantId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "ec_coupons" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "code" VARCHAR(255) NOT NULL UNIQUE,
        "description" VARCHAR(255),
        "type" VARCHAR(20) NOT NULL,
        "value" DECIMAL(12,2) NOT NULL,
        "minOrderAmount" DECIMAL(12,2) DEFAULT 0,
        "maxDiscountAmount" DECIMAL(12,2),
        "maxUses" INTEGER DEFAULT 0,
        "usedCount" INTEGER DEFAULT 0,
        "maxUsesPerCustomer" INTEGER DEFAULT 0,
        "validFrom" TIMESTAMP WITH TIME ZONE,
        "validTo" TIMESTAMP WITH TIME ZONE,
        "status" VARCHAR(20) DEFAULT 'ACTIVE',
        "applicableProducts" JSONB,
        "applicableCategories" JSONB,
        "tenantId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "ec_reviews" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "productId" UUID NOT NULL,
        "clientId" UUID NOT NULL REFERENCES "clients"("id") ON DELETE CASCADE,
        "rating" INTEGER NOT NULL,
        "title" VARCHAR(255),
        "comment" TEXT,
        "isVerifiedPurchase" BOOLEAN DEFAULT false,
        "status" VARCHAR(20) DEFAULT 'PENDING',
        "merchantResponse" TEXT,
        "respondedAt" TIMESTAMP WITH TIME ZONE,
        "tenantId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "ec_carts" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "clientId" UUID NOT NULL REFERENCES "clients"("id") ON DELETE CASCADE,
        "status" VARCHAR(20) DEFAULT 'ACTIVE',
        "currency" VARCHAR(255) DEFAULT 'SAR',
        "couponCode" VARCHAR(255),
        "discountAmount" DECIMAL(12,2) DEFAULT 0,
        "notes" TEXT,
        "tenantId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "ec_cart_items" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "cartId" UUID NOT NULL REFERENCES "ec_carts"("id") ON DELETE CASCADE,
        "productId" UUID NOT NULL,
        "quantity" DECIMAL(10,2) DEFAULT 1,
        "unitPrice" DECIMAL(12,2) NOT NULL,
        "notes" TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // ── HR Recruitment ───────────────────────────────────────────────
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "hr_job_postings" (
        "id" SERIAL PRIMARY KEY,
        "title" VARCHAR(200) NOT NULL,
        "departmentId" UUID REFERENCES "departments"("id") ON DELETE SET NULL,
        "status" VARCHAR(20) NOT NULL DEFAULT 'OPEN',
        "type" VARCHAR(20) NOT NULL DEFAULT 'FULL_TIME',
        "location" VARCHAR(255),
        "salaryMin" DECIMAL(12,2),
        "salaryMax" DECIMAL(12,2),
        "description" TEXT,
        "requirements" JSONB,
        "openPositions" INTEGER DEFAULT 1,
        "closingDate" DATE,
        "tenantId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "hr_applicants" (
        "id" SERIAL PRIMARY KEY,
        "jobPostingId" INTEGER NOT NULL REFERENCES "hr_job_postings"("id") ON DELETE CASCADE,
        "name" VARCHAR(100) NOT NULL,
        "email" VARCHAR(100) NOT NULL,
        "phone" VARCHAR(20),
        "stage" VARCHAR(20) NOT NULL DEFAULT 'APPLIED',
        "resumeUrl" VARCHAR(255),
        "rating" INTEGER,
        "notes" TEXT,
        "experience" JSONB,
        "source" VARCHAR(255),
        "tenantId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // ── HR Training ──────────────────────────────────────────────────
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "hr_training_programs" (
        "id" SERIAL PRIMARY KEY,
        "title" VARCHAR(200) NOT NULL,
        "description" TEXT,
        "type" VARCHAR(20) NOT NULL DEFAULT 'ONLINE',
        "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        "category" VARCHAR(100),
        "department" VARCHAR(100),
        "durationHours" INTEGER,
        "cost" DECIMAL(12,2),
        "instructor" VARCHAR(255),
        "maxParticipants" INTEGER,
        "startDate" DATE,
        "endDate" DATE,
        "materials" JSONB,
        "createdBy" INTEGER,
        "tenantId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "hr_training_enrollments" (
        "id" SERIAL PRIMARY KEY,
        "programId" INTEGER NOT NULL REFERENCES "hr_training_programs"("id") ON DELETE CASCADE,
        "employeeId" UUID NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
        "status" VARCHAR(20) NOT NULL DEFAULT 'ENROLLED',
        "progress" INTEGER,
        "score" DECIMAL(5,2),
        "completedAt" TIMESTAMP WITH TIME ZONE,
        "feedback" TEXT,
        "rating" INTEGER,
        "tenantId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // ── Commissions ──────────────────────────────────────────────────
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "sales_commissions" (
        "id" SERIAL PRIMARY KEY,
        "staffId" INTEGER NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
        "dealId" UUID REFERENCES "deals"("id") ON DELETE SET NULL,
        "amount" DECIMAL(12,2) NOT NULL,
        "rate" DECIMAL(5,2),
        "dealValue" DECIMAL(12,2),
        "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        "paidAt" TIMESTAMP WITH TIME ZONE,
        "notes" TEXT,
        "tenantId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // ── Meeting Notes ────────────────────────────────────────────────
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "as_meeting_notes" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" VARCHAR(300) NOT NULL,
        "type" VARCHAR(30) NOT NULL DEFAULT 'INTERNAL',
        "date" TIMESTAMP WITH TIME ZONE NOT NULL,
        "attendees" JSONB,
        "minutes" TEXT,
        "actionItems" JSONB,
        "tenantId" VARCHAR(255),
        "createdBy" INTEGER REFERENCES "Users"("id") ON DELETE SET NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // ── WhatsApp ─────────────────────────────────────────────────────
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "wa_contacts" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "phoneNumber" VARCHAR(255) NOT NULL,
        "name" VARCHAR(255),
        "profilePicUrl" VARCHAR(255),
        "clientId" UUID REFERENCES "clients"("id") ON DELETE SET NULL,
        "lastMessageAt" TIMESTAMP WITH TIME ZONE,
        "unreadCount" INTEGER NOT NULL DEFAULT 0,
        "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        "tags" JSONB NOT NULL DEFAULT '[]',
        "tenantId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "wa_messages" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "contactId" UUID NOT NULL REFERENCES "wa_contacts"("id") ON DELETE CASCADE,
        "direction" VARCHAR(20) NOT NULL DEFAULT 'OUTBOUND',
        "content" TEXT NOT NULL,
        "type" VARCHAR(20) NOT NULL DEFAULT 'TEXT',
        "mediaUrl" VARCHAR(255),
        "mediaCaption" VARCHAR(255),
        "fileName" VARCHAR(255),
        "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        "templateName" VARCHAR(255),
        "metadata" JSONB NOT NULL DEFAULT '{}',
        "tenantId" VARCHAR(255),
        "sentBy" INTEGER REFERENCES "Users"("id") ON DELETE SET NULL,
        "externalId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "wa_templates" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" VARCHAR(255) NOT NULL,
        "language" VARCHAR(255) NOT NULL DEFAULT 'en',
        "category" VARCHAR(20) NOT NULL DEFAULT 'UTILITY',
        "content" TEXT NOT NULL,
        "headerType" VARCHAR(20) NOT NULL DEFAULT 'NONE',
        "headerContent" TEXT,
        "footerText" VARCHAR(255),
        "buttons" JSONB NOT NULL DEFAULT '[]',
        "status" VARCHAR(20) NOT NULL DEFAULT 'APPROVED',
        "tenantId" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // ── Backups ──────────────────────────────────────────────────────
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "backups" (
        "id" SERIAL PRIMARY KEY,
        "filename" VARCHAR(255) NOT NULL,
        "filePath" VARCHAR(255) NOT NULL,
        "fileSize" BIGINT NOT NULL DEFAULT 0,
        "backupType" VARCHAR(20) NOT NULL DEFAULT 'manual',
        "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
        "startedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "completedAt" TIMESTAMP WITH TIME ZONE,
        "error" TEXT,
        "createdBy" INTEGER REFERENCES "Users"("id") ON DELETE SET NULL,
        "metadata" JSONB,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    console.log('All remaining tables created successfully');
  },

  async down(queryInterface) {
    const tables = [
      'backups',
      'wa_templates', 'wa_messages', 'wa_contacts',
      'as_meeting_notes',
      'sales_commissions',
      'hr_training_enrollments', 'hr_training_programs',
      'hr_applicants', 'hr_job_postings',
      'ec_cart_items', 'ec_carts', 'ec_reviews', 'ec_coupons', 'ec_categories',
      'as_warranty_claims', 'as_warranties',
      'comm_chat_messages', 'comm_chat_conversations',
      'mkt_survey_responses', 'mkt_surveys',
      'mkt_loyalty_points', 'mkt_loyalty_programs',
      'mkt_form_submissions', 'mkt_form_templates',
      'mkt_ab_tests',
      'cpq_pricing_rules', 'cpq_quotes',
      'sales_price_book_entries', 'sales_price_books',
      'sales_competitor_deals',
      'usage_records', 'usage_meters',
      'social_mentions',
      'customer_segments',
      'demand_forecasts',
      'data_requests', 'consent_records',
      'clv_records',
      'abandoned_carts',
      'attribution_touchpoints',
      'account_stakeholders', 'account_plans'
    ];

    for (const table of tables) {
      await queryInterface.sequelize.query(`DROP TABLE IF EXISTS "${table}" CASCADE;`);
    }
  }
};
