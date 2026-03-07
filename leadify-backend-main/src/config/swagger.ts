import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import path from 'path';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Leadify CRM API',
      version: '2.0.0',
      description: `
## Leadify CRM — Enterprise API

Full-featured CRM platform with 120+ API modules covering:

- **CRM Core**: Leads, Deals, Opportunities, Clients, Companies
- **Sales**: Quotes, Invoices, Sales Orders, Contracts, Subscriptions, Commissions
- **Operations**: Projects, Tasks, Time Tracking, Field Operations, Resource Planning
- **HR**: Employees, Departments, Payroll, Attendance, Leave, Recruitment, Training
- **Finance**: Expenses, Budgets, Payments, Accounting (Chart of Accounts, Journal Entries, Trial Balance, P&L, Balance Sheet), ZATCA, Zakaat
- **Procurement**: Vendors, Purchase Orders, RFQ, Vendor Scorecards
- **Marketing**: Campaigns, Sequences, A/B Testing, Social CRM, Surveys, Loyalty, Events
- **E-Commerce**: Products, Categories, Coupons, Reviews, Cart, Orders
- **Supply Chain**: Inventory, Warehouse, Manufacturing, Shipping
- **Support**: Tickets, Knowledge Base, Live Chat, Canned Responses, SLA
- **Documents**: Document Builder, E-Signatures, Templates, File Storage
- **Communication**: Messaging, Email, WhatsApp, VoIP, Meeting Notes
- **Analytics**: Reports, Forecasting, Heatmaps, AI Insights, Gamification
- **Settings**: Roles, Permissions, Workflows, Webhooks, Integrations, Custom Fields

### Authentication
All endpoints (except health checks and auth) require a Bearer JWT token.

### Multi-Tenancy
All data is tenant-isolated. The tenant is determined from the authenticated user's context.
      `,
      contact: {
        name: 'Leadify CRM Support'
      }
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3061',
        description: 'API Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            status: { type: 'number', example: 400 },
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Validation error' }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            status: { type: 'number', example: 200 },
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Success' },
            body: { type: 'object' }
          }
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            status: { type: 'number', example: 200 },
            success: { type: 'boolean', example: true },
            body: {
              type: 'object',
              properties: {
                rows: { type: 'array', items: { type: 'object' } },
                count: { type: 'number', example: 100 }
              }
            }
          }
        },
        Lead: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', example: 'john@example.com' },
            phone: { type: 'string', example: '+1234567890' },
            company: { type: 'string', example: 'Acme Corp' },
            status: { type: 'string', enum: ['new', 'contacted', 'qualified', 'lost', 'converted'] },
            source: { type: 'string', example: 'website' },
            score: { type: 'number', example: 85 },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Deal: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            title: { type: 'string', example: 'Enterprise License Deal' },
            value: { type: 'number', example: 50000 },
            stage: { type: 'string', example: 'negotiation' },
            probability: { type: 'number', example: 75 },
            expected_close: { type: 'string', format: 'date' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Client: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Acme Corporation' },
            email: { type: 'string', example: 'contact@acme.com' },
            phone: { type: 'string', example: '+1234567890' },
            company: { type: 'string', example: 'Acme Corp' },
            industry: { type: 'string', example: 'Technology' },
            created_at: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Health', description: 'Health check endpoints' },
      { name: 'Authentication', description: 'Authentication & authorization' },
      { name: 'Two-Factor Authentication', description: 'Two-factor authentication setup & validation' },
      { name: 'Lead', description: 'Lead management' },
      { name: 'Deal', description: 'Deal pipeline management' },
      { name: 'Client', description: 'Client/contact management' },
      { name: 'Invoice', description: 'Invoice management' },
      { name: 'Communication', description: 'Activity logging, calls, timelines, and stats' },
      { name: 'Support', description: 'Support ticket system' },
      { name: 'Employee', description: 'Employee & department management' },
      { name: 'Finance', description: 'Expenses, budgets, and expense categories' },
      { name: 'Setting', description: 'Application settings & configuration' },
      { name: 'Opportunities', description: 'Opportunity tracking' },
      { name: 'Projects', description: 'Project management' },
      { name: 'Tasks', description: 'Task management' },
      { name: 'Procurement', description: 'Procurement & vendors' },
      { name: 'Marketing', description: 'Marketing automation' },
      { name: 'E-Commerce', description: 'E-commerce operations' },
      { name: 'Inventory', description: 'Inventory & supply chain' },
      { name: 'Documents', description: 'Document management' },
      { name: 'Reports', description: 'Reports & analytics' }
    ]
  },
  // Scan all route files for @swagger JSDoc annotations
  apis: [
    path.join(__dirname, '../user/authenticationRoutes.{ts,js}'),
    path.join(__dirname, '../lead/leadRoutes.{ts,js}'),
    path.join(__dirname, '../deal/dealRoutes.{ts,js}'),
    path.join(__dirname, '../client/clientRoutes.{ts,js}'),
    path.join(__dirname, '../invoice/invoiceRoutes.{ts,js}'),
    path.join(__dirname, '../communication/communicationRoutes.{ts,js}'),
    path.join(__dirname, '../support/supportRoutes.{ts,js}'),
    path.join(__dirname, '../hr/employeeRoutes.{ts,js}'),
    path.join(__dirname, '../finance/financeRoutes.{ts,js}'),
    path.join(__dirname, '../setting/settingRoutes.{ts,js}'),
    path.join(__dirname, '../health/healthRoutes.{ts,js}')
  ]
};

export const swaggerSpec = swaggerJsdoc(options);
export { swaggerUi };
