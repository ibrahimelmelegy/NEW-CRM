/**
 * Migration: Add tsvector search columns + GIN indexes to core CRM tables.
 * Run via: npx ts-node src/search/migrations/addSearchVectors.ts
 *
 * Adds `search_vector` column and auto-update triggers to:
 * leads, deals, clients, opportunities, projects, invoices, contracts
 */
import { sequelize } from '../../config/db';
import logger from '../../config/logger';

const TABLES: {
  table: string;
  fields: string[];
  weights?: Record<string, string>; // field → weight (A/B/C/D)
}[] = [
  {
    table: 'Leads',
    fields: ['name', 'email', 'phone', '"companyName"'],
    weights: { name: 'A', email: 'B', phone: 'C', '"companyName"': 'B' }
  },
  {
    table: 'Deals',
    fields: ['name', '"companyName"'],
    weights: { name: 'A', '"companyName"': 'B' }
  },
  {
    table: 'Clients',
    fields: ['"clientName"', 'email', '"phoneNumber"', '"companyName"'],
    weights: { '"clientName"': 'A', email: 'B', '"phoneNumber"': 'C', '"companyName"': 'B' }
  },
  {
    table: 'Opportunities',
    fields: ['name', '"interestedIn"'],
    weights: { name: 'A', '"interestedIn"': 'B' }
  },
  {
    table: 'Projects',
    fields: ['name', 'type'],
    weights: { name: 'A', type: 'B' }
  },
  {
    table: 'invoices',
    fields: ['"invoiceNumber"'],
    weights: { '"invoiceNumber"': 'A' }
  },
  {
    table: 'contracts',
    fields: ['title', '"signerName"', '"signerEmail"'],
    weights: { title: 'A', '"signerName"': 'B', '"signerEmail"': 'C' }
  }
];

function buildSetweightExpr(fields: string[], weights: Record<string, string>): string {
  return fields
    .map(f => {
      const weight = weights[f] || 'D';
      return `setweight(to_tsvector('english', coalesce(${f}::text, '')), '${weight}')`;
    })
    .join(' || ');
}

async function migrate() {
  // Starting search vector migration

  for (const { table, fields, weights } of TABLES) {
    const vectorExpr = buildSetweightExpr(fields, weights || {});
    const triggerName = `${table.toLowerCase().replace(/"/g, '')}_search_vector_update`;
    const functionName = `${triggerName}_fn`;

    const queries = [
      // 1. Add tsvector column if not exists
      `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS search_vector tsvector;`,

      // 2. Create GIN index
      `CREATE INDEX IF NOT EXISTS idx_${table.toLowerCase().replace(/"/g, '')}_search_vector ON "${table}" USING GIN (search_vector);`,

      // 3. Create trigger function
      `CREATE OR REPLACE FUNCTION ${functionName}() RETURNS trigger AS $$
       BEGIN
         NEW.search_vector := ${vectorExpr.replace(/\b(name|email|phone|type|title)\b/g, match => `NEW.${match}`).replace(/"(\w+)"/g, 'NEW."$1"')};
         RETURN NEW;
       END;
       $$ LANGUAGE plpgsql;`,

      // 4. Drop existing trigger (idempotent)
      `DROP TRIGGER IF EXISTS ${triggerName} ON "${table}";`,

      // 5. Create trigger on INSERT/UPDATE
      `CREATE TRIGGER ${triggerName}
       BEFORE INSERT OR UPDATE ON "${table}"
       FOR EACH ROW EXECUTE FUNCTION ${functionName}();`,

      // 6. Backfill existing data
      `UPDATE "${table}" SET search_vector = ${vectorExpr};`
    ];

    // Processing table
    for (const sql of queries) {
      try {
        await sequelize.query(sql);
      } catch (err: unknown) {
        logger.error(`  Error: ${(err as Error).message}`);
      }
    }
    // Table done
  }

  // Migration complete
  process.exit(0);
}

migrate().catch(err => {
  logger.error('Migration failed: ' + err);
  process.exit(1);
});
