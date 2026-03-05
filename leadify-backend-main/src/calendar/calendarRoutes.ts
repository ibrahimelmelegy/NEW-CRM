import express from 'express';
import calendarController from './calendarController';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { CalendarPermissionsEnum } from '../role/roleEnum';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Calendar
 *   description: Calendar event management and external calendar sync
 */

// ═══════════════════════════════════════════════════════════════════════════════
// SYNC ROUTES (must be before parameterized routes)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/calendar/sync/status:
 *   get:
 *     summary: Get sync status for all providers
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sync status for Google and Outlook
 */
router.get('/sync/status', authenticateUser, HasPermission([CalendarPermissionsEnum.VIEW_CALENDAR]), calendarController.getSyncStatus);

/**
 * @swagger
 * /api/calendar/sync/google/auth:
 *   get:
 *     summary: Initiate Google Calendar OAuth
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OAuth URL to redirect user to
 */
router.get('/sync/google/auth', authenticateUser, HasPermission([CalendarPermissionsEnum.EDIT_CALENDAR]), calendarController.initiateGoogleAuth);

/**
 * @swagger
 * /api/calendar/sync/google/callback:
 *   get:
 *     summary: Handle Google Calendar OAuth callback
 *     tags: [Calendar]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Redirects to frontend
 */
router.get('/sync/google/callback', calendarController.handleGoogleCallback);

/**
 * @swagger
 * /api/calendar/sync/outlook/auth:
 *   get:
 *     summary: Initiate Outlook Calendar OAuth
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OAuth URL to redirect user to
 */
router.get('/sync/outlook/auth', authenticateUser, HasPermission([CalendarPermissionsEnum.EDIT_CALENDAR]), calendarController.initiateOutlookAuth);

/**
 * @swagger
 * /api/calendar/sync/outlook/callback:
 *   get:
 *     summary: Handle Outlook Calendar OAuth callback
 *     tags: [Calendar]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Redirects to frontend
 */
router.get('/sync/outlook/callback', calendarController.handleOutlookCallback);

/**
 * @swagger
 * /api/calendar/sync/now:
 *   post:
 *     summary: Trigger manual sync
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               provider:
 *                 type: string
 *                 enum: [google, outlook]
 *                 description: If omitted, syncs all connected providers
 *     responses:
 *       200:
 *         description: Sync results
 */
router.post('/sync/now', authenticateUser, HasPermission([CalendarPermissionsEnum.EDIT_CALENDAR]), calendarController.syncNow);

/**
 * @swagger
 * /api/calendar/sync/{provider}/disconnect:
 *   post:
 *     summary: Disconnect a calendar provider
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [google, outlook]
 *     responses:
 *       200:
 *         description: Provider disconnected
 */
router.post(
  '/sync/:provider/disconnect',
  authenticateUser,
  HasPermission([CalendarPermissionsEnum.EDIT_CALENDAR]),
  calendarController.disconnectProvider
);

/**
 * @swagger
 * /api/calendar/sync/{provider}/auto-sync:
 *   put:
 *     summary: Toggle auto-sync for a provider
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [google, outlook]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Auto-sync toggled
 */
router.put('/sync/:provider/auto-sync', authenticateUser, HasPermission([CalendarPermissionsEnum.EDIT_CALENDAR]), calendarController.toggleAutoSync);

/**
 * @swagger
 * /api/calendar/sync/{provider}/push:
 *   post:
 *     summary: Push a CRM event to external calendar
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [google, outlook]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *             properties:
 *               eventId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Event pushed to external calendar
 */
router.post('/sync/:provider/push', authenticateUser, HasPermission([CalendarPermissionsEnum.EDIT_CALENDAR]), calendarController.pushEventToProvider);

// ═══════════════════════════════════════════════════════════════════════════════
// CALENDAR EVENT ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/calendar/upcoming:
 *   get:
 *     summary: Get upcoming events (next 7 days)
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
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
 * /api/calendar/entity/{entityType}/{entityId}:
 *   get:
 *     summary: Get events linked to a CRM entity
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [lead, deal, client, opportunity, project]
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Events for the entity
 */
router.get(
  '/entity/:entityType/:entityId',
  authenticateUser,
  HasPermission([CalendarPermissionsEnum.VIEW_CALENDAR]),
  calendarController.getEventsForEntity
);

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
 *       - in: query
 *         name: end
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
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
