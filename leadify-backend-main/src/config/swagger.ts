import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import * as glob from 'glob';
const routePattern = './**/*/**/*Routes.ts';
const altRoutePattern = './**/*/**/*.routes.ts';

// Get all files matching both patterns
const routeFiles = [...glob.sync(routePattern), ...glob.sync(altRoutePattern)];
const url = process.env.BASE_URL || 'https://staging-api.hp-tech.com/';

const swaggerOptions: swaggerJsdoc.Options = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'High Point Technology API',
      version: '1.0.0',
      description: 'Documentation for High Point Technology CRM API'
    },
    servers: [
      {
        url,
        description: 'Server URL'
      }
    ],
    tags: [
      // ── Authentication & Users ──
      { name: 'Authentication', description: 'Login, register, password reset, token management' },
      { name: 'User', description: 'User management — profiles, roles, permissions' },
      { name: 'Role', description: 'Role and permission management' },

      // ── Core CRM ──
      { name: 'Lead', description: 'Lead management — create, qualify, convert' },
      { name: 'Lead Scoring', description: 'Lead scoring rules, score calculation, grades' },
      { name: 'Deal', description: 'Deal/opportunity pipeline management' },
      { name: 'Opportunity', description: 'Opportunity tracking and management' },
      { name: 'Client', description: 'Client/account management' },
      { name: 'Pipeline Config', description: 'Pipeline stage configuration and ordering' },

      // ── Sales & Revenue ──
      { name: 'Sales Order', description: 'Sales order management and fulfillment' },
      { name: 'Invoice', description: 'Invoice generation and management' },
      { name: 'Invoice Billing', description: 'Invoice billing, aging reports, credit notes' },
      { name: 'Payment', description: 'Payment tracking and processing' },
      { name: 'Subscription', description: 'Subscription plans, billing cycles, renewals' },
      { name: 'Product Catalog', description: 'Product catalog and quote line items' },
      { name: 'Contract', description: 'Contract lifecycle — draft, sign, track' },
      { name: 'Forecasting', description: 'Revenue forecasting and predictions' },
      { name: 'Territory', description: 'Sales territory management' },

      // ── Proposals ──
      { name: 'Proposal', description: 'Proposal creation and management' },
      { name: 'Proposal Content', description: 'Proposal content blocks' },
      { name: 'Proposal Finance Table', description: 'Proposal finance tables' },
      { name: 'Proposal Finance Table Item', description: 'Proposal finance table line items' },
      { name: 'Proposal Log', description: 'Proposal activity and change logs' },

      // ── Projects & Tasks ──
      { name: 'Project', description: 'Project management — planning, tracking, delivery' },
      { name: 'Project Manpower', description: 'Project manpower allocation' },
      { name: 'Tasks', description: 'Task management — create, assign, track' },
      { name: 'Daily Task', description: 'Daily task tracking and management' },

      // ── Resources ──
      { name: 'Service', description: 'Service definitions and pricing' },
      { name: 'Manpower', description: 'Manpower/workforce resource management' },
      { name: 'Material', description: 'Material management' },
      { name: 'Additional Material', description: 'Additional material categories and items' },
      { name: 'Vehicle', description: 'Vehicle fleet management' },
      { name: 'Asset', description: 'Asset tracking and management' },

      // ── HR & Payroll ──
      { name: 'HR', description: 'HR operations — attendance, leave management' },
      { name: 'Employee', description: 'Employee records, departments, org chart' },
      { name: 'Payroll', description: 'Payroll runs, payslips, salary structures, end-of-service' },
      { name: 'Time Tracking', description: 'Time entry tracking and reporting' },
      { name: 'Field Operations', description: 'Field check-in/out and team location tracking' },

      // ── Finance & Accounting ──
      { name: 'Finance', description: 'Expense management, budgets, expense categories' },
      { name: 'Accounting', description: 'Chart of accounts, journal entries, financial reports' },
      { name: 'Currency', description: 'Currency management, tax rules, VAT calculation' },
      { name: 'ZATCA', description: 'ZATCA e-invoicing compliance (Saudi Arabia)' },
      { name: 'Zakaat', description: 'Zakaat assessment and calculation' },

      // ── Procurement & Inventory ──
      { name: 'Procurement', description: 'Purchase order management' },
      { name: 'RFQ', description: 'Request for Quotation — vendor quotes' },
      { name: 'Vendor', description: 'Vendor/supplier management' },
      { name: 'Inventory', description: 'Inventory, warehouses, stock movements' },

      // ── Marketing & Engagement ──
      { name: 'Campaign', description: 'Marketing campaign management' },
      { name: 'Sequence', description: 'Automated outreach sequences' },
      { name: 'Gamification', description: 'Points, achievements, leaderboards' },
      { name: 'Playbook', description: 'Sales playbooks and guided processes' },

      // ── Support & Customer Success ──
      { name: 'Support', description: 'Support tickets, canned responses, categories' },
      { name: 'SLA', description: 'Service Level Agreement management' },
      { name: 'Customer Success', description: 'Customer health scores and success metrics' },
      { name: 'Portal', description: 'Client portal — self-service access' },
      { name: 'Knowledge Base', description: 'Knowledge base articles (public + internal)' },

      // ── Communication ──
      { name: 'Communication', description: 'Activity logging — calls, emails, meetings' },
      { name: 'Email Integration', description: 'Email accounts, messages, templates, tracking' },
      { name: 'Messaging', description: 'WhatsApp/SMS messaging and conversations' },
      { name: 'VoIP', description: 'Voice calls via Twilio integration' },
      { name: 'Notification', description: 'In-app notifications' },
      { name: 'Calendar', description: 'Calendar events and scheduling' },

      // ── Dashboards & Reports ──
      { name: 'Dashboard', description: 'Custom dashboards, widgets, analytics' },
      { name: 'Report Builder', description: 'Saved report configurations and execution' },
      { name: 'Custom Report', description: 'Advanced report builder with modules and aggregations' },
      { name: 'Insights', description: 'Business insights and analytics' },
      { name: 'Activity', description: 'Activity logs across all CRM entities' },

      // ── Documents ──
      { name: 'Document', description: 'Document/file management with folders' },
      { name: 'Document Template', description: 'Invoice and PO document templates' },

      // ── Collaboration ──
      { name: 'Comment', description: 'Comments on any entity' },
      { name: 'Attachment', description: 'File attachments on any entity' },

      // ── Automation & AI ──
      { name: 'Workflow', description: 'Workflow automation rules and execution' },
      { name: 'Approval', description: 'Approval workflows and requests' },
      { name: 'AI', description: 'AI-powered features — email, scoring, insights, coaching' },

      // ── Search & Views ──
      { name: 'Search', description: 'Global and advanced search across entities' },
      { name: 'Saved View', description: 'Custom filtered views for CRM entities' },
      { name: 'Duplicate Detection', description: 'Duplicate record detection and merging' },
      { name: 'Custom Field', description: 'Custom field definitions and values' },

      // ── Settings & Admin ──
      { name: 'Setting', description: 'Application settings — branding, email config' },
      { name: 'Webhook', description: 'Outbound webhook management' },
      { name: 'Upload', description: 'File upload service' },
      { name: 'Audit', description: 'Audit trail and change tracking' },

      // ── Integrations ──
      { name: 'Integration', description: 'Third-party integrations hub — Google, Outlook, webhooks' },
      { name: 'ERPNext', description: 'ERPNext ERP integration — sync invoices, clients, vendors' },

      // ── Security ──
      { name: 'Security', description: 'Security module overview' },
      { name: 'Two-Factor Authentication', description: '2FA/MFA setup and verification' },
      { name: 'Session Security', description: 'Session management, IP whitelist, login history' },
      { name: 'Field Permissions', description: 'Field-level access control' },
      { name: 'Data Sharing', description: 'Data sharing rules between users/teams' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [path.join(__dirname, '../routes/*.ts'), ...routeFiles.map(file => path.resolve(file))]
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

export { swaggerUi, swaggerDocs };
