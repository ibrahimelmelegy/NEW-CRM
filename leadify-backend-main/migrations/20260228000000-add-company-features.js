module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add new columns to clients table
    await queryInterface.addColumn('clients', 'parentCompanyId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'clients',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('clients', 'customFields', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: {}
    });

    await queryInterface.addColumn('clients', 'website', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('clients', 'annualRevenue', {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: true
    });

    // Create company_notes table
    await queryInterface.createTable('company_notes', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      companyId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'clients',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      attachments: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
        defaultValue: []
      },
      isPinned: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes for performance
    await queryInterface.addIndex('clients', ['parentCompanyId']);
    await queryInterface.addIndex('company_notes', ['companyId']);
    await queryInterface.addIndex('company_notes', ['userId']);
    await queryInterface.addIndex('company_notes', ['isPinned']);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop indexes
    await queryInterface.removeIndex('company_notes', ['isPinned']);
    await queryInterface.removeIndex('company_notes', ['userId']);
    await queryInterface.removeIndex('company_notes', ['companyId']);
    await queryInterface.removeIndex('clients', ['parentCompanyId']);

    // Drop company_notes table
    await queryInterface.dropTable('company_notes');

    // Remove columns from clients table
    await queryInterface.removeColumn('clients', 'annualRevenue');
    await queryInterface.removeColumn('clients', 'website');
    await queryInterface.removeColumn('clients', 'customFields');
    await queryInterface.removeColumn('clients', 'parentCompanyId');
  }
};
