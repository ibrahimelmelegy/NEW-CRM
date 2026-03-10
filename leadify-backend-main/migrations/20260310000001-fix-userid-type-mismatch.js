'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = ['LeadUsers', 'DealUsers', 'OpportunityUsers', 'ClientUsers', 'ProjectUsers', 'ProposalUsers'];
    for (const table of tables) {
      try {
        await queryInterface.sequelize.query(
          `ALTER TABLE "${table}" ALTER COLUMN "userId" TYPE INTEGER USING "userId"::INTEGER;`
        );
        console.log(`Fixed userId type in ${table}`);
      } catch (err) {
        // Table may not exist yet or column already correct type
        console.log(`Skipped ${table}: ${err.message}`);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    const tables = ['LeadUsers', 'DealUsers', 'OpportunityUsers', 'ClientUsers', 'ProjectUsers', 'ProposalUsers'];
    for (const table of tables) {
      try {
        await queryInterface.sequelize.query(
          `ALTER TABLE "${table}" ALTER COLUMN "userId" TYPE VARCHAR(255) USING "userId"::VARCHAR;`
        );
      } catch (err) {
        console.log(`Skipped rollback for ${table}: ${err.message}`);
      }
    }
  }
};
