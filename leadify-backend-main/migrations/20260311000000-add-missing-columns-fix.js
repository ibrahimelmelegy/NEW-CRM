'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. deals.probability — FLOAT DEFAULT 0
    await queryInterface.sequelize.query(`
      ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "probability" FLOAT DEFAULT 0;
    `);

    // 2. clients.parentCompanyId — UUID nullable, self-referencing FK
    await queryInterface.sequelize.query(`
      ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "parentCompanyId" UUID REFERENCES "clients"(id) ON DELETE SET NULL;
    `);

    // 3. invoices.dueDate — TIMESTAMP WITH TIME ZONE nullable
    await queryInterface.sequelize.query(`
      ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP WITH TIME ZONE;
    `);

    // 4. catalog_products.stockQuantity — INTEGER DEFAULT 0
    await queryInterface.sequelize.query(`
      ALTER TABLE "catalog_products" ADD COLUMN IF NOT EXISTS "stockQuantity" INTEGER DEFAULT 0;
    `);

    // 5. calendar_events.startTime — VARCHAR(5) nullable (HH:MM format)
    await queryInterface.sequelize.query(`
      ALTER TABLE "calendar_events" ADD COLUMN IF NOT EXISTS "startTime" VARCHAR(5);
    `);

    console.log('All 5 missing columns added successfully (corrected table names)');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query('ALTER TABLE "deals" DROP COLUMN IF EXISTS "probability";');
    await queryInterface.sequelize.query('ALTER TABLE "clients" DROP COLUMN IF EXISTS "parentCompanyId";');
    await queryInterface.sequelize.query('ALTER TABLE "invoices" DROP COLUMN IF EXISTS "dueDate";');
    await queryInterface.sequelize.query('ALTER TABLE "catalog_products" DROP COLUMN IF EXISTS "stockQuantity";');
    await queryInterface.sequelize.query('ALTER TABLE "calendar_events" DROP COLUMN IF EXISTS "startTime";');
  }
};
