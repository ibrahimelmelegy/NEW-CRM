'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();

    // Create custom_fields table if it doesn't exist
    if (!tables.includes('custom_fields')) {
      await queryInterface.createTable('custom_fields', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        entity_type: {
          type: Sequelize.ENUM('LEAD', 'DEAL', 'OPPORTUNITY', 'CLIENT', 'CONTACT', 'INVOICE'),
          allowNull: false,
        },
        field_name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        field_label: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        field_type: {
          type: Sequelize.ENUM('TEXT', 'NUMBER', 'DATE', 'SELECT', 'MULTISELECT', 'CHECKBOX', 'TEXTAREA', 'EMAIL', 'PHONE', 'URL', 'CURRENCY'),
          allowNull: false,
        },
        options: {
          type: Sequelize.JSONB,
          allowNull: true,
        },
        default_value: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        is_required: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        sort_order: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        validation_rules: {
          type: Sequelize.JSONB,
          allowNull: true,
        },
        created_by: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id',
          },
          onDelete: 'SET NULL',
        },
        created_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.fn('NOW'),
        },
        updated_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.fn('NOW'),
        },
      });

      // Add indexes
      await queryInterface.addIndex('custom_fields', ['entity_type']);
      await queryInterface.addIndex('custom_fields', ['entity_type', 'is_active']);
      await queryInterface.addIndex('custom_fields', ['field_name', 'entity_type'], { unique: true });
    } else {
      // Table exists — add new columns if they don't exist
      const columns = await queryInterface.describeTable('custom_fields');

      if (!columns.default_value) {
        await queryInterface.addColumn('custom_fields', 'default_value', {
          type: Sequelize.STRING,
          allowNull: true,
        });
      }

      if (!columns.is_required && !columns.required) {
        await queryInterface.addColumn('custom_fields', 'is_required', {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        });
      }

      // Rename 'required' to 'is_required' if old column exists
      if (columns.required && !columns.is_required) {
        await queryInterface.renameColumn('custom_fields', 'required', 'is_required');
      }

      if (!columns.is_active) {
        await queryInterface.addColumn('custom_fields', 'is_active', {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        });
      }

      if (!columns.validation_rules) {
        await queryInterface.addColumn('custom_fields', 'validation_rules', {
          type: Sequelize.JSONB,
          allowNull: true,
        });
      }

      if (!columns.created_by) {
        await queryInterface.addColumn('custom_fields', 'created_by', {
          type: Sequelize.UUID,
          allowNull: true,
        });
      }

      // Update ENUMs to include new entity types and field types
      // PostgreSQL requires dropping and recreating ENUM types
      try {
        await queryInterface.sequelize.query(`
          ALTER TYPE "enum_custom_fields_entity_type"
          ADD VALUE IF NOT EXISTS 'CONTACT';
        `);
        await queryInterface.sequelize.query(`
          ALTER TYPE "enum_custom_fields_entity_type"
          ADD VALUE IF NOT EXISTS 'INVOICE';
        `);
      } catch (e) {
        // ENUM values may already exist
        console.log('Entity type ENUM update skipped (values may already exist)');
      }

      try {
        await queryInterface.sequelize.query(`
          ALTER TYPE "enum_custom_fields_field_type"
          ADD VALUE IF NOT EXISTS 'MULTISELECT';
        `);
        await queryInterface.sequelize.query(`
          ALTER TYPE "enum_custom_fields_field_type"
          ADD VALUE IF NOT EXISTS 'EMAIL';
        `);
        await queryInterface.sequelize.query(`
          ALTER TYPE "enum_custom_fields_field_type"
          ADD VALUE IF NOT EXISTS 'PHONE';
        `);
        await queryInterface.sequelize.query(`
          ALTER TYPE "enum_custom_fields_field_type"
          ADD VALUE IF NOT EXISTS 'URL';
        `);
        await queryInterface.sequelize.query(`
          ALTER TYPE "enum_custom_fields_field_type"
          ADD VALUE IF NOT EXISTS 'CURRENCY';
        `);
      } catch (e) {
        console.log('Field type ENUM update skipped (values may already exist)');
      }
    }

    // Create custom_field_values table if it doesn't exist
    if (!tables.includes('custom_field_values')) {
      await queryInterface.createTable('custom_field_values', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        custom_field_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'custom_fields',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
        entity_type: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        entity_id: {
          type: Sequelize.UUID,
          allowNull: false,
        },
        value: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        created_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.fn('NOW'),
        },
        updated_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.fn('NOW'),
        },
      });

      await queryInterface.addIndex('custom_field_values', ['entity_id', 'entity_type']);
      await queryInterface.addIndex('custom_field_values', ['custom_field_id']);
      await queryInterface.addIndex('custom_field_values', ['custom_field_id', 'entity_type', 'entity_id'], {
        unique: true,
        name: 'cfv_unique_field_entity',
      });
    } else {
      // Ensure value column is TEXT type
      const columns = await queryInterface.describeTable('custom_field_values');
      if (columns.value && columns.value.type !== 'TEXT') {
        await queryInterface.changeColumn('custom_field_values', 'value', {
          type: Sequelize.TEXT,
          allowNull: true,
        });
      }
    }

    console.log('Custom fields enhancement migration complete');
  },

  async down(queryInterface) {
    await queryInterface.dropTable('custom_field_values');
    await queryInterface.dropTable('custom_fields');
  },
};
