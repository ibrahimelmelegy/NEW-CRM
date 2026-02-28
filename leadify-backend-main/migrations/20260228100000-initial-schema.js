'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Baseline migration — documents existing schema
    // Skip if tables already exist (for existing deployments)
    const tables = await queryInterface.showAllTables();

    if (!tables.includes('users')) {
      await queryInterface.createTable('users', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: Sequelize.STRING, allowNull: false },
        email: { type: Sequelize.STRING, allowNull: false, unique: true },
        password: { type: Sequelize.STRING, allowNull: false },
        role_id: { type: Sequelize.INTEGER },
        tenant_id: { type: Sequelize.INTEGER },
        is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
        created_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
        updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
      });
    }

    if (!tables.includes('roles')) {
      await queryInterface.createTable('roles', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: Sequelize.STRING, allowNull: false },
        permissions: { type: Sequelize.JSONB, defaultValue: [] },
        tenant_id: { type: Sequelize.INTEGER },
        created_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
        updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
      });
    }

    if (!tables.includes('tenants')) {
      await queryInterface.createTable('tenants', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: Sequelize.STRING, allowNull: false },
        domain: { type: Sequelize.STRING },
        settings: { type: Sequelize.JSONB, defaultValue: {} },
        is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
        created_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
        updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
      });
    }

    console.log('Baseline migration complete — existing tables preserved');
  },

  async down(queryInterface) {
    // Reverse baseline — only drop if explicitly needed
    // WARNING: This will destroy all data
    const tables = ['tenants', 'roles', 'users'];
    for (const table of tables) {
      await queryInterface.dropTable(table, { cascade: true }).catch(() => {});
    }
  },
};
