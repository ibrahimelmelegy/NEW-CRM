import express from 'express';
import customReportController from './customReportController';
import reportBuilderController from './reportBuilderController';
import { authenticateUser } from '../middleware/authMiddleware';
import { reportLimiter } from '../infrastructure/rateLimitEnhanced';

const router = express.Router();
router.use(reportLimiter);

/**
 * @swagger
 * tags:
 *   name: Custom Report
 *   description: Custom report CRUD, execution, export, and Report Builder Pro endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ReportFilter:
 *       type: object
 *       properties:
 *         field:
 *           type: string
 *         operator:
 *           type: string
 *           enum: [equals, not_equals, contains, greater_than, less_than, gte, lte, between, in, not_in, is_null, is_not_null]
 *         value:
 *           oneOf:
 *             - type: string
 *             - type: number
 *             - type: array
 *               items:
 *                 type: string
 *     ReportAggregation:
 *       type: object
 *       properties:
 *         field:
 *           type: string
 *         function:
 *           type: string
 *           enum: [COUNT, SUM, AVG, MIN, MAX]
 *     ReportSchedule:
 *       type: object
 *       properties:
 *         frequency:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *         time:
 *           type: string
 *           example: "08:00"
 *         recipients:
 *           type: array
 *           items:
 *             type: string
 *             format: email
 *         format:
 *           type: string
 *           enum: [pdf, excel]
 *     ReportBuilderConfig:
 *       type: object
 *       required:
 *         - modules
 *         - fields
 *       properties:
 *         modules:
 *           type: array
 *           items:
 *             type: string
 *             enum: [leads, deals, clients, opportunities, salesOrders, invoices, payments, tickets, employees]
 *         fields:
 *           type: array
 *           items:
 *             type: string
 *         filters:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ReportFilter'
 *         groupBy:
 *           type: string
 *         aggregations:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ReportAggregation'
 *         sortBy:
 *           type: string
 *         sortOrder:
 *           type: string
 *           enum: [ASC, DESC]
 *         limit:
 *           type: integer
 *         offset:
 *           type: integer
 *     CustomReport:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         entityType:
 *           type: string
 *         fields:
 *           type: array
 *           items:
 *             type: string
 *         filters:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ReportFilter'
 *         groupBy:
 *           type: string
 *           nullable: true
 *         aggregations:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ReportAggregation'
 *         sortBy:
 *           type: string
 *           nullable: true
 *         sortOrder:
 *           type: string
 *           enum: [ASC, DESC]
 *         chartType:
 *           type: string
 *           nullable: true
 *           enum: [bar, line, pie, none]
 *         chartConfig:
 *           type: object
 *           nullable: true
 *           properties:
 *             xAxis:
 *               type: string
 *             yAxis:
 *               type: string
 *             colorScheme:
 *               type: string
 *             stacked:
 *               type: boolean
 *             showLegend:
 *               type: boolean
 *             showValues:
 *               type: boolean
 *         schedule:
 *           $ref: '#/components/schemas/ReportSchedule'
 *         isShared:
 *           type: boolean
 *           default: false
 *         userId:
 *           type: integer
 */

// ─── Report Builder Pro endpoints ────────────────────────────

/**
 * @swagger
 * /api/reports/builder/fields:
 *   get:
 *     summary: Get all available modules and their field definitions
 *     tags: [Custom Report]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Map of module keys to module definitions with fields
 */
router.get('/builder/fields', authenticateUser, reportBuilderController.getAllFields);

/**
 * @swagger
 * /api/reports/builder/fields/{module}:
 *   get:
 *     summary: Get field definitions for a specific module
 *     tags: [Custom Report]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: module
 *         required: true
 *         schema:
 *           type: string
 *           enum: [leads, deals, clients, opportunities, salesOrders, invoices, payments, tickets, employees]
 *         description: Module key
 *     responses:
 *       200:
 *         description: Module definition with fields
 *       404:
 *         description: Module not found
 */
router.get('/builder/fields/:module', authenticateUser, reportBuilderController.getModuleFields);

/**
 * @swagger
 * /api/reports/builder/preview:
 *   post:
 *     summary: Execute a report configuration and return preview data without saving
 *     tags: [Custom Report]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReportBuilderConfig'
 *     responses:
 *       200:
 *         description: Report preview data with results, totalCount, and summary
 */
router.post('/builder/preview', authenticateUser, reportBuilderController.previewReport);

/**
 * @swagger
 * /api/reports/builder/export:
 *   post:
 *     summary: Export report data directly from a configuration without saving
 *     tags: [Custom Report]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - config
 *               - format
 *             properties:
 *               config:
 *                 $ref: '#/components/schemas/ReportBuilderConfig'
 *               format:
 *                 type: string
 *                 enum: [csv, excel, pdf]
 *                 description: Export format
 *     responses:
 *       200:
 *         description: Exported data (CSV as text/csv, others as JSON)
 */
router.post('/builder/export', authenticateUser, reportBuilderController.exportFromConfig);

// Entity type introspection (must come before /:id routes)

/**
 * @swagger
 * /api/reports/entity-types:
 *   get:
 *     summary: Get all available entity types for custom reports
 *     tags: [Custom Report]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Map of entity type keys to display labels
 */
router.get('/entity-types', authenticateUser, customReportController.getEntityTypes);

/**
 * @swagger
 * /api/reports/fields/{entityType}:
 *   get:
 *     summary: Get available fields for a specific entity type
 *     tags: [Custom Report]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [lead, deal, client, opportunity, project, invoice, daily_task, user, contract, vendor, purchase_order, campaign]
 *         description: Entity type key
 *     responses:
 *       200:
 *         description: Entity type and its available fields with type information
 */
router.get('/fields/:entityType', authenticateUser, customReportController.getAvailableFields);

// CRUD

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: Get all custom reports for the authenticated user
 *     tags: [Custom Report]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *         description: Filter reports by entity type
 *     responses:
 *       200:
 *         description: List of custom reports (own and shared)
 */
router.get('/', authenticateUser, customReportController.getReports);

/**
 * @swagger
 * /api/reports/{id}:
 *   get:
 *     summary: Get a custom report by ID
 *     tags: [Custom Report]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Custom report details
 *       404:
 *         description: Report not found
 */
router.get('/:id', authenticateUser, customReportController.getReportById);

/**
 * @swagger
 * /api/reports:
 *   post:
 *     summary: Create a new custom report
 *     tags: [Custom Report]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - entityType
 *               - fields
 *             properties:
 *               name:
 *                 type: string
 *                 description: Report name
 *               description:
 *                 type: string
 *                 description: Report description
 *               entityType:
 *                 type: string
 *                 description: Entity type to report on
 *               fields:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Fields to include in the report
 *               filters:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/ReportFilter'
 *               groupBy:
 *                 type: string
 *                 description: Field to group results by
 *               aggregations:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/ReportAggregation'
 *               sortBy:
 *                 type: string
 *                 description: Field to sort by
 *               sortOrder:
 *                 type: string
 *                 enum: [ASC, DESC]
 *                 default: DESC
 *               chartType:
 *                 type: string
 *                 enum: [bar, line, pie, none]
 *               chartConfig:
 *                 type: object
 *                 properties:
 *                   xAxis:
 *                     type: string
 *                   yAxis:
 *                     type: string
 *                   colorScheme:
 *                     type: string
 *                   stacked:
 *                     type: boolean
 *                   showLegend:
 *                     type: boolean
 *                   showValues:
 *                     type: boolean
 *               isShared:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Custom report created
 */
router.post('/', authenticateUser, customReportController.createReport);

/**
 * @swagger
 * /api/reports/{id}:
 *   put:
 *     summary: Update a custom report
 *     tags: [Custom Report]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Report ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               entityType:
 *                 type: string
 *               fields:
 *                 type: array
 *                 items:
 *                   type: string
 *               filters:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/ReportFilter'
 *               groupBy:
 *                 type: string
 *               aggregations:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/ReportAggregation'
 *               sortBy:
 *                 type: string
 *               sortOrder:
 *                 type: string
 *                 enum: [ASC, DESC]
 *               chartType:
 *                 type: string
 *                 enum: [bar, line, pie, none]
 *               chartConfig:
 *                 type: object
 *                 properties:
 *                   xAxis:
 *                     type: string
 *                   yAxis:
 *                     type: string
 *                   colorScheme:
 *                     type: string
 *                   stacked:
 *                     type: boolean
 *                   showLegend:
 *                     type: boolean
 *                   showValues:
 *                     type: boolean
 *               isShared:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Custom report updated
 *       404:
 *         description: Report not found
 */
router.put('/:id', authenticateUser, customReportController.updateReport);

/**
 * @swagger
 * /api/reports/{id}:
 *   delete:
 *     summary: Delete a custom report
 *     tags: [Custom Report]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Report deleted
 *       404:
 *         description: Report not found
 */
router.delete('/:id', authenticateUser, customReportController.deleteReport);

// Execution & Export

/**
 * @swagger
 * /api/reports/{id}/execute:
 *   post:
 *     summary: Execute a saved custom report with optional filter overrides
 *     tags: [Custom Report]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Report ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               filters:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/ReportFilter'
 *                 description: Override filters (replaces the saved filters for this execution)
 *     responses:
 *       200:
 *         description: Report execution results with data, totalCount, groupBy, and entityType
 *       404:
 *         description: Report not found
 */
router.post('/:id/execute', authenticateUser, customReportController.executeReport);

/**
 * @swagger
 * /api/reports/{id}/export/{format}:
 *   get:
 *     summary: Export a saved custom report in the specified format
 *     tags: [Custom Report]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Report ID
 *       - in: path
 *         name: format
 *         required: true
 *         schema:
 *           type: string
 *           enum: [csv, excel, pdf]
 *         description: Export format
 *     responses:
 *       200:
 *         description: Exported report data (CSV as text/csv, PDF as JSON with report metadata)
 *       404:
 *         description: Report not found
 */
router.get('/:id/export/:format', authenticateUser, customReportController.exportReport);

// ─── Report Builder Pro: saved report actions ────────────────

/**
 * @swagger
 * /api/reports/{id}/export:
 *   post:
 *     summary: Export a saved report via Report Builder Pro
 *     tags: [Custom Report]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Report ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               format:
 *                 type: string
 *                 enum: [csv, excel, pdf]
 *                 default: csv
 *                 description: Export format
 *     responses:
 *       200:
 *         description: Exported report (CSV as text/csv, others as JSON)
 *       404:
 *         description: Report not found
 */
router.post('/:id/export', authenticateUser, reportBuilderController.exportReport);

/**
 * @swagger
 * /api/reports/{id}/schedule:
 *   put:
 *     summary: Update the schedule configuration for a saved report
 *     tags: [Custom Report]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Report ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - schedule
 *             properties:
 *               schedule:
 *                 $ref: '#/components/schemas/ReportSchedule'
 *     responses:
 *       200:
 *         description: Report schedule updated
 *       404:
 *         description: Report not found
 */
router.put('/:id/schedule', authenticateUser, reportBuilderController.scheduleReport);

export default router;
