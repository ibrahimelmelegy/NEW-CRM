/**
 * Safe Schema Sync — Production-grade migration utility
 * ======================================================
 * Compares all registered Sequelize models against the actual database schema
 * and adds any missing columns. Never drops or modifies existing columns.
 *
 * This replaces `sequelize.sync({ alter: true })` with a safer alternative
 * that only performs additive changes.
 */

import { Sequelize, ModelAttributeColumnOptions, DataTypes } from 'sequelize';

interface SyncResult {
  tablesChecked: number;
  columnsAdded: number;
  tablesCreated: number;
  errors: string[];
}

export async function safeSchemaSync(sequelize: Sequelize): Promise<SyncResult> {
  const queryInterface = sequelize.getQueryInterface();
  const result: SyncResult = {
    tablesChecked: 0,
    columnsAdded: 0,
    tablesCreated: 0,
    errors: []
  };

  const models = sequelize.models;

  for (const modelName of Object.keys(models)) {
    const model = models[modelName];
    const tableName = model.getTableName();

    // Skip if tableName is an object (schema-qualified) — use the tableName string
    const tableNameStr = typeof tableName === 'string' ? tableName : tableName.tableName;

    try {
      // Check if table exists
      let existingColumns: Record<string, any>;
      try {
        existingColumns = await queryInterface.describeTable(tableNameStr);
      } catch {
        // Table doesn't exist — create it
        try {
          await model.sync();
          result.tablesCreated++;
          // Table created
        } catch (createErr) {
          result.errors.push(`Failed to create table ${tableNameStr}: ${(createErr as Error).message}`);
        }
        continue;
      }

      result.tablesChecked++;
      const modelAttributes = model.rawAttributes;

      // Compare model columns against existing DB columns
      for (const [attrName, attrDef] of Object.entries(modelAttributes)) {
        const columnName = (attrDef as ModelAttributeColumnOptions).field || attrName;

        if (columnName in existingColumns) {
          continue; // Column already exists, skip
        }

        // Column is missing — add it
        try {
          const columnDef = buildColumnDefinition(attrDef as ModelAttributeColumnOptions);
          await queryInterface.addColumn(tableNameStr, columnName, columnDef);
          result.columnsAdded++;
          // Column added
        } catch (addErr) {
          const errMsg = (addErr as Error).message;
          // Skip if column was added by another process (race condition)
          if (!errMsg.includes('already exists')) {
            result.errors.push(`Failed to add ${tableNameStr}.${columnName}: ${errMsg}`);
          }
        }
      }
    } catch (err) {
      result.errors.push(`Error processing model ${modelName}: ${(err as Error).message}`);
    }
  }

  return result;
}

/**
 * Builds a column definition object suitable for queryInterface.addColumn()
 * from a Sequelize model attribute definition.
 */
function buildColumnDefinition(attrDef: ModelAttributeColumnOptions): ModelAttributeColumnOptions {
  const colDef: ModelAttributeColumnOptions = {
    type: attrDef.type || DataTypes.STRING,
    allowNull: attrDef.allowNull !== false // Default to true for new columns (safe)
  };

  // Carry over default value
  if (attrDef.defaultValue !== undefined) {
    colDef.defaultValue = attrDef.defaultValue;
  }

  // Carry over unique constraint
  if (attrDef.unique) {
    colDef.unique = attrDef.unique;
  }

  // Carry over references (foreign keys)
  if (attrDef.references) {
    colDef.references = attrDef.references;
    if (attrDef.onDelete) (colDef as unknown as Record<string, any>).onDelete = attrDef.onDelete;
    if (attrDef.onUpdate) (colDef as unknown as Record<string, any>).onUpdate = attrDef.onUpdate;
  }

  return colDef;
}
