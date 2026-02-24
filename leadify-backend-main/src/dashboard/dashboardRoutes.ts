import express from 'express';
import dashboardController from './dashboardController';
import { authenticateUser } from '../middleware/authMiddleware';

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Custom dashboards — widgets, analytics, executive summary, pipeline, revenue
 */

const router = express.Router();

// Predefined analytics endpoints (must come before /:id routes)

/**
 * @swagger
 * /api/dashboards/executive-summary:
 *   get:
 *     summary: Get executive summary
 *     description: Returns high-level KPIs and business metrics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Executive summary data
 *       500:
 *         description: Server error
 */
router.get('/executive-summary', authenticateUser, dashboardController.getExecutiveSummary);

/**
 * @swagger
 * /api/dashboards/pipeline:
 *   get:
 *     summary: Get pipeline analytics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dateRange
 *         schema:
 *           type: string
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           default: monthly
 *     responses:
 *       200:
 *         description: Pipeline analytics data
 *       500:
 *         description: Server error
 */
router.get('/pipeline', authenticateUser, dashboardController.getPipeline);

/**
 * @swagger
 * /api/dashboards/revenue:
 *   get:
 *     summary: Get revenue analytics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dateRange
 *         schema:
 *           type: string
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           default: monthly
 *     responses:
 *       200:
 *         description: Revenue analytics data
 *       500:
 *         description: Server error
 */
router.get('/revenue', authenticateUser, dashboardController.getRevenue);

/**
 * @swagger
 * /api/dashboards/team-performance:
 *   get:
 *     summary: Get team performance
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dateRange
 *         schema:
 *           type: string
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           default: monthly
 *     responses:
 *       200:
 *         description: Team performance metrics
 *       500:
 *         description: Server error
 */
router.get('/team-performance', authenticateUser, dashboardController.getTeamPerformance);

/**
 * @swagger
 * /api/dashboards/analytics-summary:
 *   get:
 *     summary: Get analytics summary
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Analytics summary
 *       500:
 *         description: Server error
 */
router.get('/analytics-summary', authenticateUser, dashboardController.getAnalyticsSummary);

/**
 * @swagger
 * /api/dashboards/lead-sources:
 *   get:
 *     summary: Get lead source breakdown
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Lead sources data
 *       500:
 *         description: Server error
 */
router.get('/lead-sources', authenticateUser, dashboardController.getLeadSources);

/**
 * @swagger
 * /api/dashboards/win-loss:
 *   get:
 *     summary: Get win/loss analysis
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Win/loss ratio data
 *       500:
 *         description: Server error
 */
router.get('/win-loss', authenticateUser, dashboardController.getWinLoss);

/**
 * @swagger
 * /api/dashboards/avg-deal-size:
 *   get:
 *     summary: Get average deal size
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Average deal size data
 *       500:
 *         description: Server error
 */
router.get('/avg-deal-size', authenticateUser, dashboardController.getAvgDealSize);

/**
 * @swagger
 * /api/dashboards/conversion-funnel:
 *   get:
 *     summary: Get conversion funnel
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Conversion funnel data
 *       500:
 *         description: Server error
 */
router.get('/conversion-funnel', authenticateUser, dashboardController.getConversionFunnel);

// Widget data

/**
 * @swagger
 * /api/dashboards/widget-data:
 *   post:
 *     summary: Get widget data
 *     description: Fetch dynamic data for a dashboard widget based on configuration
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               entityType:
 *                 type: string
 *               metric:
 *                 type: string
 *                 enum: [count, sum, avg]
 *               field:
 *                 type: string
 *               groupBy:
 *                 type: string
 *               chartType:
 *                 type: string
 *                 enum: [bar, line, pie, doughnut, area]
 *               filters:
 *                 type: array
 *                 items:
 *                   type: object
 *               dateRange:
 *                 type: string
 *                 enum: [today, this_week, this_month, this_quarter, this_year, custom]
 *               customDateFrom:
 *                 type: string
 *                 format: date
 *               customDateTo:
 *                 type: string
 *                 format: date
 *               limit:
 *                 type: integer
 *               color:
 *                 type: string
 *     responses:
 *       200:
 *         description: Widget data
 *       500:
 *         description: Server error
 */
router.post('/widget-data', authenticateUser, dashboardController.getWidgetData);

// CRUD

/**
 * @swagger
 * /api/dashboards:
 *   get:
 *     summary: List dashboards
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of dashboards
 *       500:
 *         description: Server error
 */
router.get('/', authenticateUser, dashboardController.getDashboards);

/**
 * @swagger
 * /api/dashboards/{id}:
 *   get:
 *     summary: Get dashboard by ID
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Dashboard with widgets and layout
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.get('/:id', authenticateUser, dashboardController.getDashboardById);

/**
 * @swagger
 * /api/dashboards:
 *   post:
 *     summary: Create a dashboard
 *     tags: [Dashboard]
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
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               widgets:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     type:
 *                       type: string
 *                       enum: [stat_card, chart, table, pipeline_funnel, activity_feed, task_list, leaderboard]
 *                     title:
 *                       type: string
 *                     config:
 *                       type: object
 *               layout:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     widgetId:
 *                       type: string
 *                     x:
 *                       type: integer
 *                     y:
 *                       type: integer
 *                     w:
 *                       type: integer
 *                     h:
 *                       type: integer
 *               isDefault:
 *                 type: boolean
 *               isShared:
 *                 type: boolean
 *               role:
 *                 type: string
 *     responses:
 *       201:
 *         description: Dashboard created
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/', authenticateUser, dashboardController.createDashboard);

/**
 * @swagger
 * /api/dashboards/{id}:
 *   put:
 *     summary: Update a dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               widgets:
 *                 type: array
 *                 items:
 *                   type: object
 *               layout:
 *                 type: array
 *                 items:
 *                   type: object
 *               isDefault:
 *                 type: boolean
 *               isShared:
 *                 type: boolean
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: Dashboard updated
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.put('/:id', authenticateUser, dashboardController.updateDashboard);

/**
 * @swagger
 * /api/dashboards/{id}:
 *   delete:
 *     summary: Delete a dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Dashboard deleted
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticateUser, dashboardController.deleteDashboard);

/**
 * @swagger
 * /api/dashboards/{id}/default:
 *   patch:
 *     summary: Set dashboard as default
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Dashboard set as default
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.patch('/:id/default', authenticateUser, dashboardController.setDefault);

export default router;
