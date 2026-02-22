import cors from 'cors';
import cookieParser from 'cookie-parser';
import express, { Application, NextFunction, Request, Response } from 'express';
import { serverAdapter } from './workflow/workflowQueue';
import helmet from 'helmet';
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import middleware from 'i18next-http-middleware';
import { doubleCsrf } from 'csrf-csrf';
import { generalLimiter, uploadLimiter } from './middleware/rateLimiter';
import { sanitizeInput } from './middleware/sanitize';
import assetRoutes from './asset/assetRoutes';
import clientRoutes from './client/clientRoutes';
import { swaggerDocs, swaggerUi } from './config/swagger';
import dealRoutes from './deal/dealRoutes';
import leadRoutes from './lead/leadRoutes';
import manpowerRoutes from './manpower/manpowerRoutes';
import AdditionalMaterialRoutes from './additionalMaterial/additionalMaterialRoutes';
import materialRoutes from './material/materialRoutes';
import notificationRoutes from './notification/notificationRoutes';
import opportunityRoutes from './opportunity/opportunityRoutes';
import projectRoutes from './project/projectRoutes';
import projectManpowerRoutes from './projectManpower/projectManpowerRoutes';
import proposalRoutes from './proposal/proposalRoutes';
import proposalContentRoutes from './proposalContent/proposalContentRoutes';
import serviceRoutes from './service/serviceRoutes';
import UploaderRoutes from './uploader/uploader.routes';
import authRoutes from './user/authenticationRoutes';
import userRoutes from './user/userRoutes';
import ErrorHandler from './utils/error/ErrorHandler';
import vehicleRoutes from './vehicle/vehicleRoutes';
import ActivityRoutes from './activity-logs/activityRoutes';
import proposalFinanceTableItemRoutes from './ProposalFinanceTableItem/proposalFinanceTableItemRoutes';
import proposalFinanceTableRoutes from './proposalFinanceTable/proposalFinanceTableRoutes';
import proposalLogRoutes from './proposalLog/proposalLogRoutes';
import roleRoutes from './role/roleRoutes';
import settingRoutes from './setting/settingRoutes';
import insightRoutes from './insights/insightRoutes';
import dailyTaskRoutes from './dailyTask/dailyTaskRoutes';
import vendorRoutes from './vendor/vendorRoutes';
import procurementRoutes from './procurement/procurementRoutes';
import rfqRoutes from './procurement/rfqRoutes';
import aiRoutes from './ai/aiRoutes';
import integrationRoutes from './integration/integrationRoutes';
import messagingRoutes from './messaging/messagingRoutes';
import customFieldRoutes from './customField/customFieldRoutes';
import webhookRoutes from './webhook/webhookRoutes';
import timeTrackingRoutes from './timeTracking/timeTrackingRoutes';
import reportBuilderRoutes from './reports/reportRoutes';
import invoiceRoutes from './invoice/invoiceRoutes';
import invoiceBillingRoutes from './invoice/invoiceBillingRoutes';
import workflowRoutes from './workflow/workflowRoutes';
import campaignRoutes from './campaign/campaignRoutes';
import contractRoutes from './contract/contractRoutes';
import portalRoutes from './portal/portalRoutes';
import documentTemplateRoutes from './documentTemplate/documentTemplateRoutes';
import kbRoutes from './knowledgeBase/kbRoutes';
import hrRoutes from './hr/hrRoutes';
import employeeRoutes from './hr/employeeRoutes';
import financeRoutes from './finance/financeRoutes';
import calendarRoutes from './calendar/calendarRoutes';
import fieldOpsRoutes from './fieldOps/fieldOpsRoutes';
import gamificationRoutes from './gamification/gamificationRoutes';
import currencyRoutes from './currency/currencyRoutes';
import inventoryRoutes from './inventory/inventoryRoutes';
import documentRoutes from './documents/documentRoutes';
import approvalRoutes from './approval/approvalRoutes';
import commentRoutes from './comments/commentRoutes';
import attachmentRoutes from './attachments/attachmentRoutes';
import erpnextRoutes from './integrations/erpnext/erpnextRoutes';
import auditRoutes from './audit/auditRoutes';
import taskRoutes from './tasks/taskRoutes';
import plannerRoutes from './tasks/plannerRoutes';
import zatcaRoutes from './zatca/zatcaRoutes';
import zakaatRoutes from './zakaat/zakaatRoutes';
import savedViewRoutes from './savedViews/savedViewRoutes';
import searchRoutes from './search/searchRoutes';
import leadScoringRoutes from './leadScoring/leadScoringRoutes';
import duplicateRoutes from './duplicateDetection/duplicateRoutes';
import slaRoutes from './sla/slaRoutes';
import dashboardRoutes from './dashboard/dashboardRoutes';
import customReportRoutes from './reports/customReportRoutes';
import securityRoutes from './security/securityRoutes';
import pipelineConfigRoutes from './pipelineConfig/pipelineConfigRoutes';
import territoryRoutes from './territory/territoryRoutes';
import forecastRoutes from './forecasting/forecastRoutes';
import emailRoutes from './emailIntegration/emailRoutes';
import sequenceRoutes from './sequences/sequenceRoutes';
import productCatalogRoutes from './productCatalog/productRoutes';
import playbookRoutes from './playbook/playbookRoutes';
import salesOrderRoutes from './salesOrder/salesOrderRoutes';
import paymentRoutes from './payment/paymentRoutes';
import supportRoutes from './support/supportRoutes';
import subscriptionRoutes from './subscription/subscriptionRoutes';
import payrollRoutes from './payroll/payrollRoutes';
import accountingRoutes from './accounting/accountingRoutes';
import communicationRoutes from './communication/communicationRoutes';
import customerSuccessRoutes from './customerSuccess/customerSuccessRoutes';
import voipRoutes from './communication/voipRoutes';
import docBuilderRoutes from './docBuilder/docBuilderRoutes';

const fileUpload = require('express-fileupload');

const app: Application = express();

// 1. Trust proxy (for reverse proxy / load balancer setups)
app.set('trust proxy', 1);

// 2. Security headers (helmet)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'"],
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true
  }
}));

// 3. HTTPS enforcement (production only)
if (process.env.NODE_ENV === 'production') {
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// 4. i18next middleware
i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    backend: {
      loadPath: './src/utils/error/locales/{{lng}}/translation.json'
    },
    fallbackLng: 'en-US'
  });
app.use(middleware.handle(i18next));

// 5. JSON body parser
app.use(express.json({ limit: '1mb' }));

// 5.5. Cookie parser (required for CSRF)
app.use(cookieParser(process.env.SECRET_KEY || 'csrf-secret'));

// 6. Input sanitization (XSS protection)
app.use(sanitizeInput);

// 7. CORS (single configured call)
const CORS_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3060'];

app.use(cors({
  origin: CORS_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'Accept-Language', 'X-CSRF-Token'],
  maxAge: 86400
}));

// 8. CSRF protection setup
const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
  getSecret: () => process.env.SECRET_KEY || 'csrf-secret',
  getSessionIdentifier: (req: Request) => req.headers.authorization || '',
  cookieName: '__csrf',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'strict' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  },
  getCsrfTokenFromRequest: (req: Request) => req.headers['x-csrf-token'] as string,
});

// Expose CSRF token endpoint for frontend
app.get('/api/csrf-token', (req: Request, res: Response) => {
  const token = generateCsrfToken(req, res);
  res.json({ csrfToken: token });
});

// API routes use Bearer token auth (JWT + session), so CSRF middleware
// is available but not globally applied. Apply per-route if needed
// for cookie-based auth flows via: app.use('/path', doubleCsrfProtection, handler)

// 9. General rate limiting
app.use(generalLimiter);

// 9. Request logging (development only, no query strings)
if (process.env.NODE_ENV !== 'production') {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`[DEV] ${req.method} ${req.path}`);
    next();
  });
}

// 10. File upload with limits
app.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  abortOnLimit: true,
  responseOnLimit: 'File size exceeds the 10MB limit.',
  safeFileNames: true,
  preserveExtension: true
}));

// --- API Routes ---
app.use('/api/insights', insightRoutes);
app.use('/api/role', roleRoutes);
app.use('/api/proposal-log', proposalLogRoutes);
app.use('/api/proposal-finance-table-item', proposalFinanceTableItemRoutes);
app.use('/api/proposal-finance-table', proposalFinanceTableRoutes);
app.use('/api/proposal-content', proposalContentRoutes);
app.use('/api/proposal', proposalRoutes);
app.use('/api/project-manpower', projectManpowerRoutes);
app.use('/api/project', projectRoutes);
app.use('/api/asset', assetRoutes);
app.use('/api/service', serviceRoutes);
app.use('/api/upload', uploadLimiter, UploaderRoutes);
app.use('/api/additional-material', AdditionalMaterialRoutes);
app.use('/api/material', materialRoutes);
app.use('/api/vehicle', vehicleRoutes);
app.use('/api/manpower', manpowerRoutes);
app.use('/api/deal', dealRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api/opportunity', opportunityRoutes);
app.use('/api/lead', leadRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/activity', ActivityRoutes);
app.use('/api/users', userRoutes);
app.use('/api/setting', settingRoutes);
app.use('/api/daily-task', dailyTaskRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/procurement', procurementRoutes);
app.use('/api/rfq', rfqRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/integrations/erpnext', erpnextRoutes);
app.use('/api/messaging', messagingRoutes);
app.use('/api/custom-fields', customFieldRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/time-tracking', timeTrackingRoutes);
app.use('/api/report-builder', reportBuilderRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/invoices/billing', invoiceBillingRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/document-templates', documentTemplateRoutes);
app.use('/api/knowledge-base', kbRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/hr', employeeRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/field-ops', fieldOpsRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/currency', currencyRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/planner', plannerRoutes);
app.use('/api/zatca', zatcaRoutes);
app.use('/api/zakaat', zakaatRoutes);
app.use('/api/saved-views', savedViewRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/lead-scoring', leadScoringRoutes);
app.use('/api/duplicates', duplicateRoutes);
app.use('/api/sla', slaRoutes);
app.use('/api/dashboards', dashboardRoutes);
app.use('/api/reports', customReportRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/pipeline-config', pipelineConfigRoutes);
app.use('/api/territories', territoryRoutes);
app.use('/api/forecasting', forecastRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/sequences', sequenceRoutes);
app.use('/api/catalog', productCatalogRoutes);
app.use('/api/playbook', playbookRoutes);
app.use('/api/sales-orders', salesOrderRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/communications', communicationRoutes);
app.use('/api/customer-success', customerSuccessRoutes);
app.use('/api/voip', voipRoutes);
app.use('/api/doc-builder', docBuilderRoutes);

// Authentication routes
// Apply strict rate limiting only to login/password-reset endpoints (not /me which is called on every page)
app.use('/api/auth', authRoutes);

// BullMQ Queue Dashboard (Optional: Secure this middleware in production)
app.use('/api/admin/queues', serverAdapter.getRouter());

// Serve static files from the 'public' directory
app.use('/assets', express.static('public/uploads'));

// Set up Swagger documentation route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Error Handling Middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  ErrorHandler(err, req, res, next);
});

export default app;
