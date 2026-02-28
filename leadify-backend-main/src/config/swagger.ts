import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

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
        name: 'Leadify CRM Support',
      },
    },
    servers: [
      { url: '/api', description: 'API Server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            status: { type: 'number', example: 400 },
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Validation error' },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            status: { type: 'number', example: 200 },
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Success' },
            body: { type: 'object' },
          },
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
                count: { type: 'number', example: 100 },
              },
            },
          },
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
            created_at: { type: 'string', format: 'date-time' },
          },
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
            created_at: { type: 'string', format: 'date-time' },
          },
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
            created_at: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Health', description: 'Health check endpoints' },
      { name: 'Auth', description: 'Authentication & authorization' },
      { name: 'Leads', description: 'Lead management' },
      { name: 'Deals', description: 'Deal pipeline management' },
      { name: 'Clients', description: 'Client/contact management' },
      { name: 'Opportunities', description: 'Opportunity tracking' },
      { name: 'Invoices', description: 'Invoice management' },
      { name: 'Projects', description: 'Project management' },
      { name: 'Tasks', description: 'Task management' },
      { name: 'HR', description: 'Human resources' },
      { name: 'Finance', description: 'Financial management' },
      { name: 'Procurement', description: 'Procurement & vendors' },
      { name: 'Marketing', description: 'Marketing automation' },
      { name: 'Support', description: 'Customer support' },
      { name: 'E-Commerce', description: 'E-commerce operations' },
      { name: 'Inventory', description: 'Inventory & supply chain' },
      { name: 'Documents', description: 'Document management' },
      { name: 'Communication', description: 'Messaging & communication' },
      { name: 'Reports', description: 'Reports & analytics' },
      { name: 'Settings', description: 'System settings & configuration' },
    ],
    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Basic health check',
          security: [],
          responses: {
            200: { description: 'Service is healthy', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', example: 'ok' }, uptime: { type: 'number' }, timestamp: { type: 'string' } } } } } },
          },
        },
      },
      '/health/ready': {
        get: {
          tags: ['Health'],
          summary: 'Deep health check (database connectivity)',
          security: [],
          responses: {
            200: { description: 'All systems ready' },
            503: { description: 'Service unavailable' },
          },
        },
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login with email and password',
          security: [],
          requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', example: 'admin@example.com' }, password: { type: 'string', example: 'password123' } } } } } },
          responses: {
            200: { description: 'Login successful, returns JWT token' },
            401: { description: 'Invalid credentials' },
          },
        },
      },
      '/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Get current authenticated user',
          responses: {
            200: { description: 'Current user profile' },
            401: { description: 'Not authenticated' },
          },
        },
      },
      '/lead': {
        get: {
          tags: ['Leads'],
          summary: 'List all leads',
          parameters: [
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'status', in: 'query', schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'Paginated list of leads' } },
        },
        post: {
          tags: ['Leads'],
          summary: 'Create a new lead',
          requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Lead' } } } },
          responses: { 201: { description: 'Lead created' } },
        },
      },
      '/lead/{id}': {
        get: { tags: ['Leads'], summary: 'Get lead by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Lead details' }, 404: { description: 'Lead not found' } } },
        put: { tags: ['Leads'], summary: 'Update lead', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Lead updated' } } },
        delete: { tags: ['Leads'], summary: 'Delete lead', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Lead deleted' } } },
      },
      '/deal': {
        get: { tags: ['Deals'], summary: 'List all deals', responses: { 200: { description: 'Paginated list of deals' } } },
        post: { tags: ['Deals'], summary: 'Create a new deal', responses: { 201: { description: 'Deal created' } } },
      },
      '/deal/{id}': {
        get: { tags: ['Deals'], summary: 'Get deal by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Deal details' } } },
        put: { tags: ['Deals'], summary: 'Update deal', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Deal updated' } } },
      },
      '/client': {
        get: { tags: ['Clients'], summary: 'List all clients', responses: { 200: { description: 'Paginated list of clients' } } },
        post: { tags: ['Clients'], summary: 'Create a new client', responses: { 201: { description: 'Client created' } } },
      },
      '/opportunity': {
        get: { tags: ['Opportunities'], summary: 'List opportunities', responses: { 200: { description: 'List of opportunities' } } },
        post: { tags: ['Opportunities'], summary: 'Create opportunity', responses: { 201: { description: 'Opportunity created' } } },
      },
      '/invoice': {
        get: { tags: ['Invoices'], summary: 'List invoices', responses: { 200: { description: 'List of invoices' } } },
        post: { tags: ['Invoices'], summary: 'Create invoice', responses: { 201: { description: 'Invoice created' } } },
      },
      '/project': {
        get: { tags: ['Projects'], summary: 'List projects', responses: { 200: { description: 'List of projects' } } },
        post: { tags: ['Projects'], summary: 'Create project', responses: { 201: { description: 'Project created' } } },
      },
      '/task': {
        get: { tags: ['Tasks'], summary: 'List tasks', responses: { 200: { description: 'List of tasks' } } },
        post: { tags: ['Tasks'], summary: 'Create task', responses: { 201: { description: 'Task created' } } },
      },
      '/hr/employee': {
        get: { tags: ['HR'], summary: 'List employees', responses: { 200: { description: 'List of employees' } } },
        post: { tags: ['HR'], summary: 'Create employee', responses: { 201: { description: 'Employee created' } } },
      },
      '/finance/expense': {
        get: { tags: ['Finance'], summary: 'List expenses', responses: { 200: { description: 'List of expenses' } } },
        post: { tags: ['Finance'], summary: 'Create expense', responses: { 201: { description: 'Expense created' } } },
      },
      '/procurement/purchase-order': {
        get: { tags: ['Procurement'], summary: 'List purchase orders', responses: { 200: { description: 'List of purchase orders' } } },
        post: { tags: ['Procurement'], summary: 'Create purchase order', responses: { 201: { description: 'PO created' } } },
      },
      '/campaign': {
        get: { tags: ['Marketing'], summary: 'List campaigns', responses: { 200: { description: 'List of campaigns' } } },
        post: { tags: ['Marketing'], summary: 'Create campaign', responses: { 201: { description: 'Campaign created' } } },
      },
      '/support/ticket': {
        get: { tags: ['Support'], summary: 'List support tickets', responses: { 200: { description: 'List of tickets' } } },
        post: { tags: ['Support'], summary: 'Create ticket', responses: { 201: { description: 'Ticket created' } } },
      },
      '/ecommerce/product': {
        get: { tags: ['E-Commerce'], summary: 'List products', responses: { 200: { description: 'List of products' } } },
      },
      '/inventory/product': {
        get: { tags: ['Inventory'], summary: 'List inventory products', responses: { 200: { description: 'Inventory list' } } },
      },
      '/document': {
        get: { tags: ['Documents'], summary: 'List documents', responses: { 200: { description: 'List of documents' } } },
      },
      '/report': {
        get: { tags: ['Reports'], summary: 'List reports', responses: { 200: { description: 'List of reports' } } },
      },
      '/setting': {
        get: { tags: ['Settings'], summary: 'Get settings', responses: { 200: { description: 'System settings' } } },
      },
    },
  },
  apis: [], // We define paths inline above
};

export const swaggerSpec = swaggerJsdoc(options);
export { swaggerUi };
