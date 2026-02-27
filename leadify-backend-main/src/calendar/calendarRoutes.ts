import express from 'express';
import calendarController from './calendarController';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { CalendarPermissionsEnum } from '../role/roleEnum';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Calendar
 *   description: Calendar event management
 */

/**
 * @swagger
 * /api/calendar/upcoming:
 *   get:
 *     summary: Get upcoming events (next 7 days)
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Upcoming events
 */
router.get('/upcoming', authenticateUser, HasPermission([CalendarPermissionsEnum.VIEW_CALENDAR]), calendarController.getUpcomingEvents);

/**
 * @swagger
 * /api/calendar/today:
 *   get:
 *     summary: Get today's agenda
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Today's events
 */
router.get('/today', authenticateUser, HasPermission([CalendarPermissionsEnum.VIEW_CALENDAR]), calendarController.getTodayAgenda);

/**
 * @swagger
 * /api/calendar/conflicts:
 *   get:
 *     summary: Check for scheduling conflicts
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: excludeId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Conflicting events
 */
router.get('/conflicts', authenticateUser, HasPermission([CalendarPermissionsEnum.VIEW_CALENDAR]), calendarController.checkConflicts);

/**
 * @swagger
 * /api/calendar/analytics:
 *   get:
 *     summary: Get calendar analytics
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Calendar analytics data
 */
router.get('/analytics', authenticateUser, HasPermission([CalendarPermissionsEnum.VIEW_CALENDAR]), calendarController.getAnalytics);

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
 *           enum: [MEETING, CALL, TASK, REMINDER, BOOKING, FOLLOW_UP, DEADLINE, OTHER]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [SCHEDULED, COMPLETED, CANCELLED]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, URGENT]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of calendar events
 */
router.get('/', authenticateUser, HasPermission([CalendarPermissionsEnum.VIEW_CALENDAR]), calendarController.getEvents);

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
 *               eventType:
 *                 type: string
 *                 enum: [MEETING, CALL, TASK, REMINDER, BOOKING, FOLLOW_UP, DEADLINE, OTHER]
 *                 default: OTHER
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *                 default: MEDIUM
 *               location:
 *                 type: string
 *               meetingLink:
 *                 type: string
 *               attendees:
 *                 type: array
 *               recurrence:
 *                 type: object
 *               isPrivate:
 *                 type: boolean
 *               relatedEntityType:
 *                 type: string
 *               relatedEntityId:
 *                 type: string
 *               reminder:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Event created
 */
router.post('/', authenticateUser, HasPermission([CalendarPermissionsEnum.CREATE_CALENDAR]), calendarController.createEvent);

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
router.get('/:id', authenticateUser, HasPermission([CalendarPermissionsEnum.VIEW_CALENDAR]), calendarController.getEventById);

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
 *     responses:
 *       200:
 *         description: Event updated
 */
router.put('/:id', authenticateUser, HasPermission([CalendarPermissionsEnum.EDIT_CALENDAR]), calendarController.updateEvent);

/**
 * @swagger
 * /api/calendar/{id}/attendee:
 *   put:
 *     summary: Update attendee RSVP status
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
 *               status:
 *                 type: string
 *                 enum: [ACCEPTED, DECLINED]
 *     responses:
 *       200:
 *         description: Attendee status updated
 */
router.put('/:id/attendee', authenticateUser, HasPermission([CalendarPermissionsEnum.VIEW_CALENDAR]), calendarController.updateAttendeeStatus);

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
router.delete('/:id', authenticateUser, HasPermission([CalendarPermissionsEnum.DELETE_CALENDAR]), calendarController.deleteEvent);

export default router;
