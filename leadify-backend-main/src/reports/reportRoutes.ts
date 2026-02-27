import express from 'express';
import reportController from './reportController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Report Builder
 *   description: Saved report CRUD, execution, and CSV export
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ReportConfig:
 *       type: object
 *       required:
 *         - entityType
 *       properties:
 *         entityType:
 *           type: string
 *           enum: [LEAD, DEAL, OPPORTUNITY, CLIENT]
 *           description: The entity type to report on
 *         columns:
 *           type: array
 *           items:
 *             type: string
 *           description: Columns to include in the report
 *         filters:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *               operator:
 *                 type: string
 *                 enum: [equals, contains, greaterThan, lessThan, between, in]
 *               value:
 *                 oneOf:
 *                   - type: string
 *                   - type: number
 *                   - type: array
 *                     items:
 *                       type: string
 *         groupBy:
 *           type: string
 *           description: Field to group results by
 *         sortBy:
 *           type: string
 *           description: Field to sort by
 *         sortOrder:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: ASC
 *     SavedReport:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         entityType:
 *           type: string
 *         config:
 *           $ref: '#/components/schemas/ReportConfig'
 *         userId:
 *           type: integer
 */

/**
 * @swagger
 * /api/report-builder:
 *   get:
 *     summary: Get all saved reports for the authenticated user
 *     tags: [Report Builder]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of saved reports
 */
router.get('/', authenticateUser, reportController.getReports);

/**
 * @swagger
 * /api/report-builder:
 *   post:
 *     summary: Create a new saved report
 *     tags: [Report Builder]
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
 *               - config
 *             properties:
 *               name:
 *                 type: string
 *                 description: Report name
 *               entityType:
 *                 type: string
 *                 enum: [LEAD, DEAL, OPPORTUNITY, CLIENT]
 *                 description: Entity type for the report
 *               config:
 *                 type: object
 *                 description: Report configuration (columns, filters, groupBy, chartType, sortBy, sortOrder)
 *                 properties:
 *                   columns:
 *                     type: array
 *                     items:
 *                       type: string
 *                   filters:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         field:
 *                           type: string
 *                         operator:
 *                           type: string
 *                         value: {}
 *                   groupBy:
 *                     type: string
 *                   chartType:
 *                     type: string
 *                   sortBy:
 *                     type: string
 *                   sortOrder:
 *                     type: string
 *                     enum: [ASC, DESC]
 *     responses:
 *       201:
 *         description: Report created
 */
router.post('/', authenticateUser, reportController.createReport);

/**
 * @swagger
 * /api/report-builder/{id}:
 *   put:
 *     summary: Update a saved report
 *     tags: [Report Builder]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *               entityType:
 *                 type: string
 *                 enum: [LEAD, DEAL, OPPORTUNITY, CLIENT]
 *               config:
 *                 type: object
 *                 properties:
 *                   columns:
 *                     type: array
 *                     items:
 *                       type: string
 *                   filters:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         field:
 *                           type: string
 *                         operator:
 *                           type: string
 *                         value: {}
 *                   groupBy:
 *                     type: string
 *                   chartType:
 *                     type: string
 *                   sortBy:
 *                     type: string
 *                   sortOrder:
 *                     type: string
 *                     enum: [ASC, DESC]
 *     responses:
 *       200:
 *         description: Report updated
 */
router.put('/:id', authenticateUser, reportController.updateReport);

/**
 * @swagger
 * /api/report-builder/{id}:
 *   delete:
 *     summary: Delete a saved report
 *     tags: [Report Builder]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Report deleted
 */
router.delete('/:id', authenticateUser, reportController.deleteReport);

/**
 * @swagger
 * /api/report-builder/execute:
 *   post:
 *     summary: Execute a report configuration and return results
 *     tags: [Report Builder]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - entityType
 *             properties:
 *               entityType:
 *                 type: string
 *                 enum: [LEAD, DEAL, OPPORTUNITY, CLIENT]
 *                 description: Entity type to query
 *               columns:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Columns to include
 *               filters:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     field:
 *                       type: string
 *                     operator:
 *                       type: string
 *                       enum: [equals, contains, greaterThan, lessThan, between, in]
 *                     value:
 *                       oneOf:
 *                         - type: string
 *                         - type: number
 *                         - type: array
 *                           items:
 *                             type: string
 *               groupBy:
 *                 type: string
 *                 description: Field to group results by
 *               sortBy:
 *                 type: string
 *                 description: Field to sort by
 *               sortOrder:
 *                 type: string
 *                 enum: [ASC, DESC]
 *                 default: ASC
 *     responses:
 *       200:
 *         description: Report execution results
 */
router.post('/execute', authenticateUser, reportController.executeReport);

/**
 * @swagger
 * /api/report-builder/export-csv:
 *   post:
 *     summary: Execute a report and export results as CSV
 *     tags: [Report Builder]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - entityType
 *             properties:
 *               entityType:
 *                 type: string
 *                 enum: [LEAD, DEAL, OPPORTUNITY, CLIENT]
 *                 description: Entity type to query
 *               columns:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Columns to include
 *               filters:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     field:
 *                       type: string
 *                     operator:
 *                       type: string
 *                       enum: [equals, contains, greaterThan, lessThan, between, in]
 *                     value:
 *                       oneOf:
 *                         - type: string
 *                         - type: number
 *                         - type: array
 *                           items:
 *                             type: string
 *               groupBy:
 *                 type: string
 *               sortBy:
 *                 type: string
 *               sortOrder:
 *                 type: string
 *                 enum: [ASC, DESC]
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 */
router.post('/export-csv', authenticateUser, reportController.exportCSV);

/**
 * @swagger
 * /api/report-builder/export-excel:
 *   post:
 *     summary: Execute a report and export results as Excel
 *     tags: [Report Builder]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReportConfig'
 *     responses:
 *       200:
 *         description: Excel file download
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.post('/export-excel', authenticateUser, reportController.exportExcel);

/**
 * @swagger
 * /api/report-builder/analytics:
 *   get:
 *     summary: Get analytics for an entity type with optional date range
 *     tags: [Report Builder]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [LEAD, DEAL, OPPORTUNITY, CLIENT]
 *         description: Entity type to analyze
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the range
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the range
 *     responses:
 *       200:
 *         description: Analytics data including totals, distributions, and timelines
 *       400:
 *         description: Missing required entityType
 */
router.get('/analytics', authenticateUser, reportController.getAnalytics);

export default router;
