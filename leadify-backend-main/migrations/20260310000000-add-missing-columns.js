'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Deals.probability — affects 7 pages (deals, opportunity, commissions, cpq, goals, dashboards)
    await queryInterface.sequelize.query(`
      ALTER TABLE "Deals" ADD COLUMN IF NOT EXISTS "probability" FLOAT DEFAULT 0;
    `);

    // 2. Clients.parentCompanyId — clients page loads completely blank
    await queryInterface.sequelize.query(`
      ALTER TABLE "Clients" ADD COLUMN IF NOT EXISTS "parentCompanyId" INTEGER REFERENCES "Clients"(id) ON DELETE SET NULL;
    `);

    // 3. Invoices.dueDate — invoices page is broken
    await queryInterface.sequelize.query(`
      ALTER TABLE "Invoices" ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP WITH TIME ZONE;
    `);

    // 4. CatalogProducts.stockQuantity — CPQ and products pages are broken
    await queryInterface.sequelize.query(`
      ALTER TABLE "CatalogProducts" ADD COLUMN IF NOT EXISTS "stockQuantity" INTEGER DEFAULT 0;
    `);

    // 5. CalendarEvents.startTime — calendar and dashboard/briefing are broken
    await queryInterface.sequelize.query(`
      ALTER TABLE "CalendarEvents" ADD COLUMN IF NOT EXISTS "startTime" TIMESTAMP WITH TIME ZONE;
    `);

    console.log('All 5 missing columns added successfully');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`ALTER TABLE "Deals" DROP COLUMN IF EXISTS "probability";`);
    await queryInterface.sequelize.query(`ALTER TABLE "Clients" DROP COLUMN IF EXISTS "parentCompanyId";`);
    await queryInterface.sequelize.query(`ALTER TABLE "Invoices" DROP COLUMN IF EXISTS "dueDate";`);
    await queryInterface.sequelize.query(`ALTER TABLE "CatalogProducts" DROP COLUMN IF EXISTS "stockQuantity";`);
    await queryInterface.sequelize.query(`ALTER TABLE "CalendarEvents" DROP COLUMN IF EXISTS "startTime";`);
  }
};
