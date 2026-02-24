import express from 'express';
import timeTrackingController from './timeTrackingController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Time Tracking
 *   description: Time entry tracking and weekly summaries
 */

/**
 * @swagger
 * /api/time-tracking/start:
 *   post:
 *     summary: Start a new timer
 *     tags: [Time Tracking]
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
 *               entityId:
 *                 type: string
 *               entityName:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Timer started
 */
router.post('/start', authenticateUser, timeTrackingController.startTimer);

/**
 * @swagger
 * /api/time-tracking/stop:
 *   post:
 *     summary: Stop the currently running timer
 *     tags: [Time Tracking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Timer stopped
 */
router.post('/stop', authenticateUser, timeTrackingController.stopTimer);

/**
 * @swagger
 * /api/time-tracking/running:
 *   get:
 *     summary: Get the currently running timer
 *     tags: [Time Tracking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Running timer or null
 */
router.get('/running', authenticateUser, timeTrackingController.getRunningTimer);

/**
 * @swagger
 * /api/time-tracking/entries:
 *   get:
 *     summary: Get time entries with filtering
 *     tags: [Time Tracking]
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
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Paginated time entries
 */
router.get('/entries', authenticateUser, timeTrackingController.getEntries);

/**
 * @swagger
 * /api/time-tracking/entries:
 *   post:
 *     summary: Create a manual time entry
 *     tags: [Time Tracking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - startTime
 *               - endTime
 *             properties:
 *               entityType:
 *                 type: string
 *               entityId:
 *                 type: string
 *               entityName:
 *                 type: string
 *               description:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Manual entry created
 */
router.post('/entries', authenticateUser, timeTrackingController.createManualEntry);

/**
 * @swagger
 * /api/time-tracking/entries/{id}:
 *   put:
 *     summary: Update a time entry
 *     tags: [Time Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               entityType:
 *                 type: string
 *               entityId:
 *                 type: string
 *               entityName:
 *                 type: string
 *               description:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Entry updated
 */
router.put('/entries/:id', authenticateUser, timeTrackingController.updateEntry);

/**
 * @swagger
 * /api/time-tracking/entries/{id}:
 *   delete:
 *     summary: Delete a time entry
 *     tags: [Time Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Entry deleted
 */
router.delete('/entries/:id', authenticateUser, timeTrackingController.deleteEntry);

/**
 * @swagger
 * /api/time-tracking/weekly:
 *   get:
 *     summary: Get weekly time summary
 *     tags: [Time Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: weekStart
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date of the week (ISO date)
 *     responses:
 *       200:
 *         description: Weekly summary with daily totals
 */
router.get('/weekly', authenticateUser, timeTrackingController.getWeeklySummary);

export default router;
