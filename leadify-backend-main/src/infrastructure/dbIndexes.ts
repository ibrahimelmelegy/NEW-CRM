/**
 * Database Performance Indexes
 *
 * Run once at server startup to ensure all performance-critical indexes exist.
 * Uses CREATE INDEX IF NOT EXISTS so it is safe to run repeatedly.
 *
 * The indexes here supplement the indexes already defined in Sequelize models
 * (e.g., Lead, Opportunity, Task, AuditTrail). These target additional columns
 * and composite patterns that are common in CRM query workloads at scale.
 *
 * Table/column names are derived from the actual Sequelize models in config/db.ts.
 */

import { Sequelize } from 'sequelize-typescript';

export async function addPerformanceIndexes(sequelize: Sequelize): Promise<void> {
  const indexes: string[] = [
    // ──────────────────────────────────────────────────────────────────
    // Leads (table: "leads", PK: UUID)
    // Model already indexes: name, email, phone, status
    // ──────────────────────────────────────────────────────────────────
    'CREATE INDEX IF NOT EXISTS idx_leads_lead_source ON leads("leadSource")',
    'CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads("createdAt" DESC)',
    'CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(score DESC)',
    'CREATE INDEX IF NOT EXISTS idx_leads_last_contact ON leads("lastContactDate" DESC)',
    // Composite: filter by status + sort by creation
    'CREATE INDEX IF NOT EXISTS idx_leads_status_created ON leads(status, "createdAt" DESC)',

    // ──────────────────────────────────────────────────────────────────
    // Deals (table: "deals", PK: UUID)
    // ──────────────────────────────────────────────────────────────────
    'CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage)',
    'CREATE INDEX IF NOT EXISTS idx_deals_price ON deals(price)',
    'CREATE INDEX IF NOT EXISTS idx_deals_created_at ON deals("createdAt" DESC)',
    'CREATE INDEX IF NOT EXISTS idx_deals_lead_id ON deals("leadId")',
    'CREATE INDEX IF NOT EXISTS idx_deals_client_id ON deals("clientId")',
    'CREATE INDEX IF NOT EXISTS idx_deals_opportunity_id ON deals("opportunityId")',
    // Composite: pipeline view (stage + price)
    'CREATE INDEX IF NOT EXISTS idx_deals_stage_price ON deals(stage, price DESC)',

    // ──────────────────────────────────────────────────────────────────
    // Clients (table: "clients", PK: UUID)
    // ──────────────────────────────────────────────────────────────────
    'CREATE INDEX IF NOT EXISTS idx_clients_industry ON clients(industry)',
    'CREATE INDEX IF NOT EXISTS idx_clients_status ON clients("clientStatus")',
    'CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients("createdAt" DESC)',
    'CREATE INDEX IF NOT EXISTS idx_clients_lead_id ON clients("leadId")',

    // ──────────────────────────────────────────────────────────────────
    // Opportunities (table: "opportunities", PK: UUID)
    // Model already indexes: leadId, clientId, stage, name
    // ──────────────────────────────────────────────────────────────────
    'CREATE INDEX IF NOT EXISTS idx_opps_estimated_value ON opportunities("estimatedValue" DESC)',
    'CREATE INDEX IF NOT EXISTS idx_opps_created_at ON opportunities("createdAt" DESC)',
    'CREATE INDEX IF NOT EXISTS idx_opps_priority ON opportunities(priority)',
    'CREATE INDEX IF NOT EXISTS idx_opps_close_date ON opportunities("expectedCloseDate")',

    // ──────────────────────────────────────────────────────────────────
    // Projects (table: "projects", PK: UUID)
    // ──────────────────────────────────────────────────────────────────
    'CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)',
    'CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects("createdAt" DESC)',
    'CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects("clientId")',
    'CREATE INDEX IF NOT EXISTS idx_projects_lead_id ON projects("leadId")',
    'CREATE INDEX IF NOT EXISTS idx_projects_deal_id ON projects("dealId")',

    // ──────────────────────────────────────────────────────────────────
    // Invoices (table: "invoices", PK: integer auto-increment)
    // ──────────────────────────────────────────────────────────────────
    'CREATE INDEX IF NOT EXISTS idx_invoices_deal_id ON invoices("dealId")',
    'CREATE INDEX IF NOT EXISTS idx_invoices_collected ON invoices(collected)',
    'CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices("invoiceDate" DESC)',

    // ──────────────────────────────────────────────────────────────────
    // Contracts (table: "contracts", PK: UUID)
    // ──────────────────────────────────────────────────────────────────
    'CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status)',
    'CREATE INDEX IF NOT EXISTS idx_contracts_deal_id ON contracts("dealId")',
    'CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON contracts("userId")',
    'CREATE INDEX IF NOT EXISTS idx_contracts_expires ON contracts("expiresAt")',

    // ──────────────────────────────────────────────────────────────────
    // Activity Logs (tables: leadActivities, dealActivities,
    //   clientActivities, opportunityActivities, projectActivities,
    //   vendorActivities, purchaseOrderActivities)
    // ──────────────────────────────────────────────────────────────────
    'CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON "leadActivities"("leadId", "createdAt" DESC)',
    'CREATE INDEX IF NOT EXISTS idx_lead_activities_user ON "leadActivities"("userId")',
    'CREATE INDEX IF NOT EXISTS idx_deal_activities_deal ON "dealActivities"("dealId", "createdAt" DESC)',
    'CREATE INDEX IF NOT EXISTS idx_deal_activities_user ON "dealActivities"("userId")',
    'CREATE INDEX IF NOT EXISTS idx_client_activities_client ON "clientActivities"("clientId", "createdAt" DESC)',
    'CREATE INDEX IF NOT EXISTS idx_opp_activities_opp ON "opportunityActivities"("opportunityId", "createdAt" DESC)',
    'CREATE INDEX IF NOT EXISTS idx_project_activities_project ON "projectActivities"("projectId", "createdAt" DESC)',
    'CREATE INDEX IF NOT EXISTS idx_vendor_activities_vendor ON "vendorActivities"("vendorId", "createdAt" DESC)',
    'CREATE INDEX IF NOT EXISTS idx_po_activities_po ON "purchaseOrderActivities"("purchaseOrderId", "createdAt" DESC)',

    // ──────────────────────────────────────────────────────────────────
    // Notifications (table: "notifications", PK: UUID)
    // ──────────────────────────────────────────────────────────────────
    'CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications("userId", "createdAt" DESC)',
    'CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications("userId", "read")',

    // ──────────────────────────────────────────────────────────────────
    // Comments (table: "comments", PK: integer)
    // ──────────────────────────────────────────────────────────────────
    'CREATE INDEX IF NOT EXISTS idx_comments_entity ON comments("entityType", "entityId")',
    'CREATE INDEX IF NOT EXISTS idx_comments_user ON comments("userId")',
    'CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments("parentId")',

    // ──────────────────────────────────────────────────────────────────
    // Attachments (table: "attachments", PK: integer)
    // ──────────────────────────────────────────────────────────────────
    'CREATE INDEX IF NOT EXISTS idx_attachments_entity ON attachments("entityType", "entityId")',
    'CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_by ON attachments("uploadedBy")',

    // ──────────────────────────────────────────────────────────────────
    // Tasks (table: "tasks", PK: integer)
    // Model already indexes: assignedTo, createdBy, status, dueDate,
    //   entityType+entityId, parentTaskId
    // ──────────────────────────────────────────────────────────────────
    'CREATE INDEX IF NOT EXISTS idx_tasks_assigned_status ON tasks("assignedTo", status)',
    'CREATE INDEX IF NOT EXISTS idx_tasks_due_active ON tasks("dueDate") WHERE status NOT IN (\'COMPLETED\', \'CANCELLED\')',

    // ──────────────────────────────────────────────────────────────────
    // Audit Trail (table: "audit_trail", PK: integer)
    // Model already indexes: entityType+entityId, userId, createdAt
    // ──────────────────────────────────────────────────────────────────
    'CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_trail(action)',
    'CREATE INDEX IF NOT EXISTS idx_audit_user_created ON audit_trail("userId", "createdAt" DESC)',

    // ──────────────────────────────────────────────────────────────────
    // Daily Tasks (table: "dailyTasks", PK: UUID)
    // ──────────────────────────────────────────────────────────────────
    'CREATE INDEX IF NOT EXISTS idx_daily_tasks_user ON "dailyTasks"("userId")',
    'CREATE INDEX IF NOT EXISTS idx_daily_tasks_sales_rep ON "dailyTasks"("salesRepresentativeId")',
    'CREATE INDEX IF NOT EXISTS idx_daily_tasks_status ON "dailyTasks"(status)',
    'CREATE INDEX IF NOT EXISTS idx_daily_tasks_created ON "dailyTasks"("createdAt" DESC)',

    // ──────────────────────────────────────────────────────────────────
    // Messages (table: "messages", PK: UUID)
    // ──────────────────────────────────────────────────────────────────
    'CREATE INDEX IF NOT EXISTS idx_messages_user ON messages("userId")',
    'CREATE INDEX IF NOT EXISTS idx_messages_contact ON messages("contactPhone")',
    'CREATE INDEX IF NOT EXISTS idx_messages_created ON messages("createdAt" DESC)',

    // ──────────────────────────────────────────────────────────────────
    // Campaigns (table: "campaigns", PK: UUID)
    // ──────────────────────────────────────────────────────────────────
    'CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status)',
    'CREATE INDEX IF NOT EXISTS idx_campaigns_user ON campaigns("userId")',
    'CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled ON campaigns("scheduledAt")',

    // ──────────────────────────────────────────────────────────────────
    // Time Entries (table: "timeEntries" or similar)
    // ──────────────────────────────────────────────────────────────────
    'CREATE INDEX IF NOT EXISTS idx_time_entries_user ON "timeEntries"("userId", "createdAt" DESC)',
    'CREATE INDEX IF NOT EXISTS idx_time_entries_project ON "timeEntries"("projectId")',

    // ──────────────────────────────────────────────────────────────────
    // Sessions (table: "sessions") - critical for auth performance
    // ──────────────────────────────────────────────────────────────────
    'CREATE INDEX IF NOT EXISTS idx_sessions_user_token ON sessions("userId", token)',
    'CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions("expiresAt")',

    // ──────────────────────────────────────────────────────────────────
    // Users (table: "Users", PK: integer)
    // ──────────────────────────────────────────────────────────────────
    'CREATE INDEX IF NOT EXISTS idx_users_email ON "Users"(email)',
    'CREATE INDEX IF NOT EXISTS idx_users_role ON "Users"("roleId")',
    'CREATE INDEX IF NOT EXISTS idx_users_status ON "Users"(status)',

    // ──────────────────────────────────────────────────────────────────
    // Join Tables - often missed but critical for N+1 queries
    // ──────────────────────────────────────────────────────────────────
    'CREATE INDEX IF NOT EXISTS idx_lead_users_lead ON "leadUsers"("leadId")',
    'CREATE INDEX IF NOT EXISTS idx_lead_users_user ON "leadUsers"("userId")',
    'CREATE INDEX IF NOT EXISTS idx_deal_users_deal ON "dealUsers"("dealId")',
    'CREATE INDEX IF NOT EXISTS idx_deal_users_user ON "dealUsers"("userId")',
    'CREATE INDEX IF NOT EXISTS idx_opp_users_opp ON "opportunityUsers"("opportunityId")',
    'CREATE INDEX IF NOT EXISTS idx_opp_users_user ON "opportunityUsers"("userId")',
    'CREATE INDEX IF NOT EXISTS idx_client_users_client ON "clientUsers"("clientId")',
    'CREATE INDEX IF NOT EXISTS idx_client_users_user ON "clientUsers"("userId")',
    'CREATE INDEX IF NOT EXISTS idx_user_projects_project ON "userProjects"("projectId")',
    'CREATE INDEX IF NOT EXISTS idx_user_projects_user ON "userProjects"("userId")',

    // ──────────────────────────────────────────────────────────────────
    // Full-text Search (GIN indexes for PostgreSQL)
    // These enable fast ILIKE / tsvector searches on name/email fields.
    // ──────────────────────────────────────────────────────────────────
    `CREATE INDEX IF NOT EXISTS idx_leads_search ON leads USING GIN (
      to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(email, '') || ' ' || COALESCE("companyName", ''))
    )`,
    `CREATE INDEX IF NOT EXISTS idx_clients_search ON clients USING GIN (
      to_tsvector('english', COALESCE("clientName", '') || ' ' || COALESCE(email, '') || ' ' || COALESCE("companyName", ''))
    )`,
    `CREATE INDEX IF NOT EXISTS idx_deals_search ON deals USING GIN (
      to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE("companyName", ''))
    )`,
    `CREATE INDEX IF NOT EXISTS idx_opportunities_search ON opportunities USING GIN (
      to_tsvector('english', COALESCE(name, ''))
    )`,
    `CREATE INDEX IF NOT EXISTS idx_projects_search ON projects USING GIN (
      to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, ''))
    )`,
  ];

  let succeeded = 0;
  let skipped = 0;

  for (const sql of indexes) {
    try {
      await sequelize.query(sql);
      succeeded++;
    } catch (e) {
      // Index creation may fail if the table/column doesn't exist yet,
      // or if the table name doesn't match (e.g., join tables with different names).
      // This is expected and safe to skip.
      skipped++;
      const msg = (e as Error).message?.substring(0, 100) || 'unknown error';
      console.warn(`[DB Index] Skipped: ${msg}`);
    }
  }

  console.log(
    `[DB Index] Performance indexes: ${succeeded} created/verified, ${skipped} skipped (total: ${indexes.length})`
  );
}
