import cors from 'cors';
import cookieParser from 'cookie-parser';
import express, { Application, NextFunction, Request, Response } from 'express';
import { serverAdapter } from './workflow/workflowQueue';
import helmet from 'helmet';
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import middleware from 'i18next-http-middleware';
import { doubleCsrf } from 'csrf-csrf';
import { generalLimiter, uploadLimiter, authLimiter, apiIntensiveLimiter, exportLimiter, webhookLimiter } from './middleware/rateLimiter';
import { sanitizeInput } from './middleware/sanitize';
import { authenticateUser, HasPermission } from './middleware/authMiddleware';
import { validateTenant } from './middleware/tenantMiddleware';
import { tenantRateLimit } from './middleware/tenantRateLimit';

// Validate required SECRET_KEY at startup — never fall back to a hardcoded value
const CSRF_SECRET = process.env.SECRET_KEY;
if (!CSRF_SECRET) {
  throw new Error('FATAL: SECRET_KEY environment variable is required for CSRF protection. Cannot start without it.');
}
import assetRoutes from './asset/assetRoutes';
import clientRoutes from './client/clientRoutes';
import { swaggerSpec, swaggerUi } from './config/swagger';
import healthRoutes from './health/healthRoutes';
import dealRoutes from './deal/dealRoutes';
import leadRoutes from './lead/leadRoutes';
import manpowerRoutes from './manpower/manpowerRoutes';
import AdditionalMaterialRoutes from './additionalMaterial/additionalMaterialRoutes';
import materialRoutes from './material/materialRoutes';
import notificationRoutes from './notification/notificationRoutes';
import unsubscribeRoutes from './notification/unsubscribeRoutes';
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
import thirdPartyIntegrationRoutes from './integrations/integrationRoutes';
import webhookHandlerRoutes from './integrations/webhookHandlers';
import auditRoutes from './audit/auditRoutes';
import taskRoutes from './tasks/taskRoutes';
import plannerRoutes from './tasks/plannerRoutes';
import virtualOfficeRoutes from './virtualOffice/virtualOfficeRoutes';
import manufacturingRoutes from './manufacturing/manufacturingRoutes';
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
// ─── New Module Routes ────────────────────────────────────────────────────────
import performanceRoutes from './hr/performance/performanceRoutes';
import recruitmentRoutes from './hr/recruitment/recruitmentRoutes';
import trainingRoutes from './hr/training/trainingRoutes';
import commissionRoutes from './commission/commissionRoutes';
import competitorRoutes from './competitor/competitorRoutes';
import cpqRoutes from './cpq/cpqRoutes';
import abTestRoutes from './abTesting/abTestRoutes';
import formBuilderRoutes from './formBuilder/formBuilderRoutes';
import loyaltyRoutes from './loyalty/loyaltyRoutes';
import socialCrmRoutes from './socialCrm/socialCrmRoutes';
import surveyRoutes from './survey/surveyRoutes';
import liveChatRoutes from './liveChat/liveChatRoutes';
import bookingRoutes from './booking/bookingRoutes';
import warehouseRoutes from './warehouse/warehouseRoutes';
import vendorScorecardRoutes from './vendorScorecard/vendorScorecardRoutes';
import warrantyRoutes from './warranty/warrantyRoutes';
import shippingRoutes from './shipping/shippingRoutes';
import goalRoutes from './goals/goalRoutes';
import ecCategoryRoutes from './ecommerce/category/categoryRoutes';
import ecCouponRoutes from './ecommerce/coupon/couponRoutes';
import ecReviewRoutes from './ecommerce/review/reviewRoutes';
import ecCartRoutes from './ecommerce/cart/cartRoutes';
import ecProductRoutes from './ecommerce/product/ecProductRoutes';
import ecDashboardRoutes from './ecommerce/dashboard/ecDashboardRoutes';
import meetingNoteRoutes from './meetingNote/meetingNoteRoutes';
import eSignatureRoutes from './eSignature/eSignatureRoutes';
import whatsappRoutes from './whatsapp/whatsappRoutes';
import filePreviewRoutes from './storage/filePreviewRoutes';
// ─── Wave 7-8 Enterprise Module Routes ──────────────────────────────────────
import segmentRoutes from './segmentation/segmentRoutes';
import socialListeningRoutes from './socialListening/socialListeningRoutes';
import demandForecastRoutes from './demandForecasting/demandForecastRoutes';
import cartRecoveryRoutes from './cartRecovery/cartRecoveryRoutes';
import clvRoutes from './clvAnalytics/clvRoutes';
import attributionRoutes from './attributionModeling/attributionRoutes';
import usageBillingRoutes from './usageBilling/usageBillingRoutes';
import accountPlanRoutes from './accountPlanning/accountPlanRoutes';
import complianceManagerRoutes from './complianceManager/complianceRoutes';
import aiLeadScoringRoutes from './aiLeadScoring/aiLeadScoringRoutes';
// ─── Tenant Management Routes ────────────────────────────────────────────────
import tenantAdminRoutes from './tenant/tenantRoutes';
import tenantSelfRoutes from './tenant/tenantSelfRoutes';
import backupRoutes from './backup/backupRoutes';
import monitoringRoutes from './monitoring/monitoringRoutes';
import { metricsMiddleware } from './middleware/metricsMiddleware';
import { errorTracker } from './middleware/errorTracker';

const fileUpload = require('express-fileupload');

const app: Application = express();

// 1. Trust proxy (for reverse proxy / load balancer setups)
app.set('trust proxy', 1);

// 2. Security headers (helmet)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        connectSrc: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true
    }
  })
);

// Permissions-Policy header
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), payment=()'
  );
  next();
});

// 3. HTTPS enforcement (production only, when FORCE_HTTPS=true)
if (process.env.NODE_ENV === 'production' && process.env.FORCE_HTTPS === 'true') {
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
app.use(cookieParser(CSRF_SECRET));

// 6. Input sanitization (XSS protection)
app.use(sanitizeInput);

// 7. CORS (single configured call)
const CORS_ORIGINS = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(o => o.trim()) : ['http://localhost:3060'];

app.use(
  cors({
    origin: CORS_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'Accept-Language', 'X-CSRF-Token'],
    maxAge: 86400
  })
);

// 8. CSRF protection setup
const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
  getSecret: () => CSRF_SECRET,
  getSessionIdentifier: (req: Request) => req.headers.authorization || req.cookies?.['__session'] || '',
  cookieName: '__csrf',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'strict' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  },
  getCsrfTokenFromRequest: (req: Request) => req.headers['x-csrf-token'] as string
});

// Health checks — no auth required
app.use('/api', healthRoutes);

// Swagger API docs — protected in production, open in development
const swaggerMiddleware = [
  (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
    );
    next();
  },
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Leadify CRM API Documentation',
  })
];
if (process.env.NODE_ENV === 'production') {
  app.use('/api/docs', authenticateUser, ...swaggerMiddleware);
  app.get('/api/docs.json', authenticateUser, (_req, res) => res.json(swaggerSpec));
} else {
  app.use('/api/docs', ...swaggerMiddleware);
  app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));
}

// Expose CSRF token endpoint for frontend
app.get('/api/csrf-token', (req: Request, res: Response) => {
  const token = generateCsrfToken(req, res);
  res.json({ csrfToken: token });
});

// CSRF protection for state-changing requests (POST/PUT/PATCH/DELETE)
// Skips GET/HEAD/OPTIONS, auth routes (no CSRF token yet), and webhooks (external callers)
app.use('/api', (req: Request, res: Response, next: NextFunction) => {
  // Skip safe HTTP methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  // Skip auth routes (login/register don't have CSRF token yet)
  if (req.path.startsWith('/auth/')) return next();
  // Skip webhook endpoints (external callers can't provide CSRF tokens)
  if (req.path.startsWith('/webhooks/')) return next();
  // Skip health check endpoints
  if (req.path.startsWith('/health')) return next();
  // Skip CSRF token endpoint itself
  if (req.path === '/csrf-token') return next();
  // Apply CSRF protection
  doubleCsrfProtection(req, res, next);
});

// 9. General rate limiting
app.use(generalLimiter);

// 9.5. Metrics collection middleware (tracks request count, response times, errors)
app.use(metricsMiddleware);

// 9. Request logging (development only, no query strings)
if (process.env.NODE_ENV !== 'production') {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    // Request logged for development
    next();
  });
}

// 10. File upload with limits
app.use(
  fileUpload({
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
    abortOnLimit: true,
    responseOnLimit: 'File size exceeds the 10MB limit.',
    safeFileNames: true,
    preserveExtension: true
  })
);

// --- API Routes ---
app.use('/api/insights', insightRoutes);
app.use('/api/role', roleRoutes);
app.use('/api/proposal-log', proposalLogRoutes);
app.use('/api/proposal-finance-table-item', proposalFinanceTableItemRoutes);
app.use('/api/proposal-finance-table', proposalFinanceTableRoutes);
app.use('/api/proposal-content', proposalContentRoutes);
app.use('/api/proposal', proposalRoutes);
app.use('/api/proposal/excel', exportLimiter);
app.use('/api/project-manpower', projectManpowerRoutes);
app.use('/api/project', projectRoutes);
app.use('/api/project/excel', exportLimiter);
app.use('/api/asset', assetRoutes);
app.use('/api/asset/excel', exportLimiter);
app.use('/api/service', serviceRoutes);
app.use('/api/service/excel', exportLimiter);
app.use('/api/upload', uploadLimiter, UploaderRoutes);
app.use('/api/additional-material', AdditionalMaterialRoutes);
app.use('/api/additional-material/excel', exportLimiter);
app.use('/api/material', materialRoutes);
app.use('/api/vehicle', vehicleRoutes);
app.use('/api/vehicle/excel', exportLimiter);
app.use('/api/manpower', manpowerRoutes);
app.use('/api/manpower/excel', exportLimiter);
app.use('/api/deal', dealRoutes);
app.use('/api/deal/excel', exportLimiter);
app.use('/api/notification', notificationRoutes);
app.use('/api/opportunity', opportunityRoutes);
app.use('/api/opportunity/excel', exportLimiter);
app.use('/api/lead', leadRoutes);
app.use('/api/lead/excel', exportLimiter);
app.use('/api/client', clientRoutes);
app.use('/api/client/excel', exportLimiter);
app.use('/api/activity', ActivityRoutes);
app.use('/api/users', userRoutes);
app.use('/api/users/excel', exportLimiter);
// Staff alias — frontend pages (collaboration, analytics, revenue-intelligence)
// call /api/staff which maps to the same user routes
app.use('/api/staff', userRoutes);
app.use('/api/setting', settingRoutes);
app.use('/api/daily-task', dailyTaskRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/procurement', procurementRoutes);
app.use('/api/rfq', rfqRoutes);
app.use('/api/ai', apiIntensiveLimiter, aiRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/integrations/erpnext', erpnextRoutes);
app.use('/api/integrations/third-party', thirdPartyIntegrationRoutes);
app.use('/api/webhooks/incoming', webhookLimiter, webhookHandlerRoutes);
app.use('/api/messaging', messagingRoutes);
app.use('/api/custom-fields', customFieldRoutes);
app.use('/api/webhooks', webhookLimiter, webhookRoutes);
app.use('/api/time-tracking', timeTrackingRoutes);
app.use('/api/report-builder', apiIntensiveLimiter, reportBuilderRoutes);
app.use('/api/report-builder/export-csv', exportLimiter);
app.use('/api/report-builder/export-pdf', exportLimiter);
app.use('/api/invoices/billing', invoiceBillingRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/document-templates', documentTemplateRoutes);
app.use('/api/knowledge-base', kbRoutes);
// Both HR routers share /api/hr — no sub-path overlap:
// hrRoutes handles /attendance/*, /leave-requests/*
// employeeRoutes handles /employees/*, /departments/*, /org-chart, /expiring-documents
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
app.use('/api/virtual-office', virtualOfficeRoutes);
app.use('/api/manufacturing', manufacturingRoutes);
app.use('/api/zatca', zatcaRoutes);
app.use('/api/zakaat', zakaatRoutes);
app.use('/api/saved-views', savedViewRoutes);
app.use('/api/search', apiIntensiveLimiter, searchRoutes);
app.use('/api/lead-scoring', leadScoringRoutes);
app.use('/api/duplicates', duplicateRoutes);
app.use('/api/sla', slaRoutes);
app.use('/api/dashboards', dashboardRoutes);
app.use('/api/reports', apiIntensiveLimiter, customReportRoutes);
app.use('/api/reports/builder/export', exportLimiter);
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
// ─── New Module Routes ────────────────────────────────────────────────────────
app.use('/api/hr/performance', performanceRoutes);
app.use('/api/hr/recruitment', recruitmentRoutes);
app.use('/api/hr/training', trainingRoutes);
app.use('/api/commissions', commissionRoutes);
app.use('/api/competitors', competitorRoutes);
app.use('/api/cpq', cpqRoutes);
app.use('/api/ab-tests', abTestRoutes);
app.use('/api/form-builder', formBuilderRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/social-crm', socialCrmRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/live-chat', liveChatRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/warehouse', warehouseRoutes);
app.use('/api/vendor-scorecard', vendorScorecardRoutes);
app.use('/api/warranty', warrantyRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/goals', goalRoutes);
// ─── E-Commerce Module Routes ───────────────────────────────────────────────
app.use('/api/ecommerce/categories', ecCategoryRoutes);
app.use('/api/ecommerce/coupons', ecCouponRoutes);
app.use('/api/ecommerce/reviews', ecReviewRoutes);
app.use('/api/ecommerce/cart', ecCartRoutes);
app.use('/api/ecommerce/products', ecProductRoutes);
app.use('/api/ecommerce/dashboard', ecDashboardRoutes);
// ─── Meeting Notes & E-Signatures ───────────────────────────────────────────
app.use('/api/meeting-notes', meetingNoteRoutes);
app.use('/api/e-signatures', eSignatureRoutes);
// ─── WhatsApp Module ─────────────────────────────────────────────────────────
app.use('/api/whatsapp', whatsappRoutes);
// ─── File Preview Routes ────────────────────────────────────────────────────
app.use('/api/files', filePreviewRoutes);
// ─── Wave 7-8 Enterprise Modules ───────────────────────────────────────────
app.use('/api/segments', segmentRoutes);
app.use('/api/social-listening', socialListeningRoutes);
app.use('/api/demand-forecasting', demandForecastRoutes);
app.use('/api/cart-recovery', cartRecoveryRoutes);
app.use('/api/clv', clvRoutes);
app.use('/api/attribution', attributionRoutes);
app.use('/api/usage-billing', usageBillingRoutes);
app.use('/api/account-plans', accountPlanRoutes);
app.use('/api/compliance', complianceManagerRoutes);
app.use('/api/ai-lead-scoring', aiLeadScoringRoutes);
// ─── Database Backup & Restore ──────────────────────────────────────────────
app.use('/api/backups', backupRoutes);
// ─── Monitoring & Health Dashboard ──────────────────────────────────────────
app.use('/api/monitoring', monitoringRoutes);

// Public notification unsubscribe (no auth required) — singular to match /api/notification
app.use('/api/notification', unsubscribeRoutes);

// Authentication routes — strict rate limiting on login/password-reset
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);
app.use('/api/auth', authRoutes);

// BullMQ Queue Dashboard — protected with authentication and ADMIN permission
app.use('/api/admin/queues', authenticateUser, HasPermission(['MANAGE_SETTINGS']), serverAdapter.getRouter());

// ─── Tenant Management ─────────────────────────────────────────────────────
// Superadmin tenant admin routes
app.use('/api/admin/tenants', tenantAdminRoutes);
// Self-service tenant info for authenticated users
app.use('/api/tenant', tenantSelfRoutes);

// Serve static files — redirect to CDN when using cloud storage
if (process.env.STORAGE_PROVIDER === 'spaces' && process.env.DO_SPACES_CDN_URL) {
  app.use('/assets', (req: Request, res: Response) => {
    res.redirect(301, `${process.env.DO_SPACES_CDN_URL}${req.path}`);
  });
} else {
  app.use('/assets', express.static('public/uploads'));
}

// Legacy Swagger docs route (redirects to new location)
app.get('/api-docs', (_req, res) => res.redirect('/api/docs'));

// Error Tracking Middleware (logs errors to Redis before passing to handler)
app.use(errorTracker);

// Error Handling Middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  ErrorHandler(err, req, res, next);
});

export default app;
