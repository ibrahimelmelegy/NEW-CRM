import express from 'express';
import forecastController from './forecastController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Forecasting
 *   description: Sales forecasting and pipeline predictions
 */

/**
 * @swagger
 * /api/forecasting:
 *   get:
 *     summary: Get all forecasts with optional filters
 *     tags: [Forecasting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [monthly, quarterly, yearly]
 *         description: Filter by forecast period
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Paginated list of forecasts
 */
router.get('/', authenticateUser, forecastController.getForecasts);

/**
 * @swagger
 * /api/forecasting/period:
 *   get:
 *     summary: Get forecasts by period and date range
 *     tags: [Forecasting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         required: true
 *         schema:
 *           type: string
 *           enum: [monthly, quarterly, yearly]
 *         description: Forecast period type
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the range
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the range
 *     responses:
 *       200:
 *         description: List of forecasts within the date range
 *       400:
 *         description: Missing required query params (period, startDate, endDate)
 */
router.get('/period', authenticateUser, forecastController.getByPeriod);

/**
 * @swagger
 * /api/forecasting/user/{userId}:
 *   get:
 *     summary: Get all forecasts for a specific user
 *     tags: [Forecasting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     responses:
 *       200:
 *         description: List of forecasts for the user
 */
router.get('/user/:userId', authenticateUser, forecastController.getByUser);

/**
 * @swagger
 * /api/forecasting:
 *   post:
 *     summary: Create a new forecast
 *     tags: [Forecasting]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - period
 *               - startDate
 *               - endDate
 *             properties:
 *               period:
 *                 type: string
 *                 enum: [monthly, quarterly, yearly]
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               target:
 *                 type: number
 *                 default: 0
 *               predicted:
 *                 type: number
 *                 default: 0
 *               actual:
 *                 type: number
 *                 default: 0
 *               closedWon:
 *                 type: number
 *                 default: 0
 *               closedLost:
 *                 type: number
 *                 default: 0
 *               pipeline:
 *                 type: number
 *                 default: 0
 *     responses:
 *       201:
 *         description: Forecast created successfully
 */
router.post('/', authenticateUser, forecastController.create);

/**
 * @swagger
 * /api/forecasting/{id}:
 *   put:
 *     summary: Update an existing forecast
 *     tags: [Forecasting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Forecast ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               period:
 *                 type: string
 *                 enum: [monthly, quarterly, yearly]
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               target:
 *                 type: number
 *               predicted:
 *                 type: number
 *               actual:
 *                 type: number
 *               closedWon:
 *                 type: number
 *               closedLost:
 *                 type: number
 *               pipeline:
 *                 type: number
 *     responses:
 *       200:
 *         description: Forecast updated successfully
 */
router.put('/:id', authenticateUser, forecastController.update);

/**
 * @swagger
 * /api/forecasting/calculate:
 *   post:
 *     summary: Calculate forecast from current pipeline deals
 *     tags: [Forecasting]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - period
 *             properties:
 *               period:
 *                 type: string
 *                 enum: [monthly, quarterly, yearly]
 *                 description: The period to calculate the forecast for
 *     responses:
 *       200:
 *         description: Forecast calculated from pipeline
 *       400:
 *         description: Missing required period field
 */
router.post('/calculate', authenticateUser, forecastController.calculateFromPipeline);

/**
 * @swagger
 * /api/forecasting/historical-comparison:
 *   get:
 *     summary: Get historical comparison between current and previous period
 *     tags: [Forecasting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         required: true
 *         schema:
 *           type: string
 *           enum: [monthly, quarterly, yearly]
 *         description: Forecast period type
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Current period start date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Current period end date
 *     responses:
 *       200:
 *         description: Comparison data with growth percentages
 *       400:
 *         description: Missing required parameters
 */
router.get('/historical-comparison', authenticateUser, forecastController.getHistoricalComparison);

/**
 * @swagger
 * /api/forecasting/scenario:
 *   post:
 *     summary: Project revenue based on what-if scenarios
 *     tags: [Forecasting]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               winRateAdjustment:
 *                 type: number
 *                 description: Percentage adjustment to win rate (e.g., 10 for +10%)
 *                 default: 0
 *               dealValueAdjustment:
 *                 type: number
 *                 description: Percentage adjustment to deal values (e.g., -5 for -5%)
 *                 default: 0
 *     responses:
 *       200:
 *         description: Projected revenue based on adjustments
 */
router.post('/scenario', authenticateUser, forecastController.getScenarioProjection);

/**
 * @swagger
 * /api/forecasting/team-breakdown:
 *   get:
 *     summary: Get forecast breakdown by team member
 *     tags: [Forecasting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         required: true
 *         schema:
 *           type: string
 *           enum: [monthly, quarterly, yearly]
 *         description: Forecast period type
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the range
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the range
 *     responses:
 *       200:
 *         description: Per-user forecast breakdown
 *       400:
 *         description: Missing required parameters
 */
router.get('/team-breakdown', authenticateUser, forecastController.getTeamBreakdown);

export default router;
