import express from 'express';
import calendarController from './calendarController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Calendar
 *   description: Calendar event management
 */

/**
 * @swagger
 * /api/calendar:
 *   get:
 *     summary: Get calendar events with filtering
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Range start date
 *       - in: query
 *         name: end
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Range end date
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Filter by user ID
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
 *           enum: [MEETING, CALL, TASK, REMINDER, OTHER]
 *     responses:
 *       200:
 *         description: List of calendar events
 */
router.get('/', authenticateUser, calendarController.getEvents);

/**
 * @swagger
 * /api/calendar:
 *   post:
 *     summary: Create a new calendar event
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - startDate
 *               - endDate
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               allDay:
 *                 type: boolean
 *                 default: false
 *               color:
 *                 type: string
 *                 description: Hex color code (e.g. #ff0000)
 *               eventType:
 *                 type: string
 *                 enum: [MEETING, CALL, TASK, REMINDER, OTHER]
 *                 default: OTHER
 *               location:
 *                 type: string
 *               recurrence:
 *                 type: string
 *     responses:
 *       201:
 *         description: Event created
 */
router.post('/', authenticateUser, calendarController.createEvent);

/**
 * @swagger
 * /api/calendar/{id}:
 *   get:
 *     summary: Get a calendar event by ID
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Event details
 */
router.get('/:id', authenticateUser, calendarController.getEventById);

/**
 * @swagger
 * /api/calendar/{id}:
 *   put:
 *     summary: Update a calendar event
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               allDay:
 *                 type: boolean
 *               color:
 *                 type: string
 *               eventType:
 *                 type: string
 *                 enum: [MEETING, CALL, TASK, REMINDER, OTHER]
 *               location:
 *                 type: string
 *               recurrence:
 *                 type: string
 *     responses:
 *       200:
 *         description: Event updated
 */
router.put('/:id', authenticateUser, calendarController.updateEvent);

/**
 * @swagger
 * /api/calendar/{id}:
 *   delete:
 *     summary: Delete a calendar event
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Event deleted
 */
router.delete('/:id', authenticateUser, calendarController.deleteEvent);

export default router;
