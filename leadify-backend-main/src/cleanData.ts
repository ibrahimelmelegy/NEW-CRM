/**
 * cleanData.ts — Clear all CRM business data from database
 *
 * Keeps: Users, Roles, Permissions, Tenants, Settings
 * Clears: Leads, Clients, Deals, Opportunities, Proposals, Projects, Tasks,
 *         Invoices, Vendors, Expenses, Tickets, Campaigns, etc.
 *
 * Run:  npx ts-node src/cleanData.ts
 *   or: npm run clean-data
 */
import dotenv from 'dotenv';
dotenv.config();
import { sequelize } from './config/db';

const TABLES_TO_TRUNCATE = [
  // ── Junction / child tables first ──
  'lead_users',
  'opportunity_users',
  'deal_users',
  'client_users',
  'proposal_users',
  'user_projects',

  // ── Child records ──
  'invoices',
  'purchase_order_items',
  'sales_order_items',
  'approval_requests',

  // ── Main CRM entities ──
  'leads',
  'clients',
  'deals',
  'opportunities',
  'proposals',
  'projects',
  'tasks',
  'vendors',
  'purchase_orders',
  'sales_orders',

  // ── Finance ──
  'expenses',
  'expense_categories',

  // ── Support ──
  'tickets',
  'ticket_categories',
  'kb_articles',

  // ── Marketing & Communication ──
  'campaigns',
  'calendar_events',

  // ── Workflow & Approvals ──
  'approval_workflows',
  'workflow_rules',

  // ── Analytics & Forecasting ──
  'forecast_periods',

  // ── Gamification ──
  'achievements',
  'user_points',

  // ── Notifications ──
  'notifications',

  // ── Activity logs ──
  'activity_logs',
  'lead_activities',
  'client_activities',
  'deal_activities',
  'opportunity_activities',
  'vendor_activities',
  'proposal_activities',
  'project_activities',

  // ── HR ──
  'employees',
  'departments',

  // ── Other data ──
  'materials',
  'assets',
  'manpower',
  'catalog_products',
  'services',
  'delivery_notes',
  'delivery_note_items',
  'quotes',
  'quote_items',
  'proforma_invoices',
  'proforma_invoice_items',
  'contracts',
  'subscriptions',
];

async function cleanData() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database. Starting cleanup...\n');

    let cleaned = 0;
    let skipped = 0;

    for (const table of TABLES_TO_TRUNCATE) {
      try {
        await sequelize.query(`TRUNCATE TABLE "${table}" CASCADE`, { logging: false });
        console.log(`  ✓ ${table} — truncated`);
        cleaned++;
      } catch (error: unknown) {
        const msg = (error as Error).message || '';
        if (msg.includes('does not exist') || msg.includes('relation')) {
          console.log(`  - ${table} — table not found (skipped)`);
          skipped++;
        } else {
          console.log(`  ✗ ${table} — ERROR: ${msg}`);
        }
      }
    }

    console.log(`\nDone! ${cleaned} tables truncated, ${skipped} skipped.`);
    console.log('Users, Roles, Permissions, Tenants, and Settings preserved.');
  } catch (error) {
    console.error('Cleanup failed:', error);
  } finally {
    await sequelize.close();
  }
}

cleanData();
