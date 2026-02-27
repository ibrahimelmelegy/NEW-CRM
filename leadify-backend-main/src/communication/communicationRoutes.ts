import express from 'express';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import communicationController from './communicationController';
import { CommunicationPermissionsEnum } from '../role/roleEnum';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Communication
 *   description: Activity logging, call logging, timelines, and stats
 */

// ─── Activities ──────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/communications/activities:
 *   post:
 *     summary: Log a new activity
 *     tags: [Communication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - contactId
 *               - contactType
 *               - subject
 *             properties:
 *               type:
 *                 type: string
 *                 description: Activity type (CALL, EMAIL, MEETING, NOTE, TASK)
 *               contactId:
 *                 type: string
 *                 description: Related contact ID
 *               contactType:
 *                 type: string
 *                 description: Contact type (lead, deal, contact, company)
 *               subject:
 *                 type: string
 *                 description: Activity subject line
 *               body:
 *                 type: string
 *                 description: Activity body / notes
 *               direction:
 *                 type: string
 *                 description: Direction (INBOUND, OUTBOUND)
 *               duration:
 *                 type: integer
 *                 description: Duration in seconds
 *               metadata:
 *                 type: object
 *                 description: Additional metadata
 *     responses:
 *       201:
 *         description: Activity logged successfully
 */
router.post('/activities', authenticateUser, HasPermission([CommunicationPermissionsEnum.LOG_ACTIVITIES]), communicationController.logActivity);

/**
 * @swagger
 * /api/communications/timeline/{contactType}/{contactId}:
 *   get:
 *     summary: Get activity timeline for a contact
 *     tags: [Communication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contactType
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact type (lead, deal, contact, company)
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact ID
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
 *         description: Paginated activity timeline
 */
router.get(
  '/timeline/:contactType/:contactId',
  authenticateUser,
  HasPermission([CommunicationPermissionsEnum.VIEW_ACTIVITIES]),
  communicationController.getTimeline
);

/**
 * @swagger
 * /api/communications/activities/{id}:
 *   put:
 *     summary: Update an activity
 *     tags: [Communication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Activity ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subject:
 *                 type: string
 *                 description: Activity subject line
 *               body:
 *                 type: string
 *                 description: Activity body / notes
 *               direction:
 *                 type: string
 *                 description: Direction (INBOUND, OUTBOUND)
 *               duration:
 *                 type: integer
 *                 description: Duration in seconds
 *               metadata:
 *                 type: object
 *                 description: Additional metadata
 *     responses:
 *       200:
 *         description: Activity updated successfully
 */
router.put('/activities/:id', authenticateUser, HasPermission([CommunicationPermissionsEnum.LOG_ACTIVITIES]), communicationController.updateActivity);

/**
 * @swagger
 * /api/communications/activities/{id}:
 *   delete:
 *     summary: Delete an activity
 *     tags: [Communication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Activity ID
 *     responses:
 *       200:
 *         description: Activity deleted successfully
 */
router.delete(
  '/activities/:id',
  authenticateUser,
  HasPermission([CommunicationPermissionsEnum.LOG_ACTIVITIES]),
  communicationController.deleteActivity
);

// ─── Calls ───────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/communications/calls:
 *   post:
 *     summary: Log a call activity with call details
 *     tags: [Communication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contactId
 *               - contactType
 *               - subject
 *               - phoneNumber
 *               - duration
 *               - outcome
 *             properties:
 *               contactId:
 *                 type: string
 *                 description: Related contact ID
 *               contactType:
 *                 type: string
 *                 description: Contact type (lead, deal, contact, company)
 *               subject:
 *                 type: string
 *                 description: Call subject
 *               body:
 *                 type: string
 *                 description: Call notes body
 *               direction:
 *                 type: string
 *                 description: Call direction (INBOUND, OUTBOUND)
 *               phoneNumber:
 *                 type: string
 *                 description: Phone number called
 *               duration:
 *                 type: integer
 *                 description: Call duration in seconds
 *               outcome:
 *                 type: string
 *                 description: Call outcome (ANSWERED, NO_ANSWER, BUSY, VOICEMAIL, FAILED)
 *               recordingUrl:
 *                 type: string
 *                 description: URL to call recording
 *               notes:
 *                 type: string
 *                 description: Additional call notes
 *               metadata:
 *                 type: object
 *                 description: Additional metadata
 *     responses:
 *       201:
 *         description: Call logged successfully
 */
router.post('/calls', authenticateUser, HasPermission([CommunicationPermissionsEnum.LOG_CALLS]), communicationController.logCall);

// ─── Call Logs ──────────────────────────────────────────────────────────────

router.get('/call-logs', authenticateUser, HasPermission([CommunicationPermissionsEnum.VIEW_ACTIVITIES]), communicationController.getCallLogs);

// ─── Meeting Notes ──────────────────────────────────────────────────────────

router.get('/meeting-notes', authenticateUser, HasPermission([CommunicationPermissionsEnum.VIEW_ACTIVITIES]), communicationController.getMeetingNotes);
router.post('/meeting-notes', authenticateUser, HasPermission([CommunicationPermissionsEnum.LOG_ACTIVITIES]), communicationController.createMeetingNote);
router.put('/meeting-notes/:id', authenticateUser, HasPermission([CommunicationPermissionsEnum.LOG_ACTIVITIES]), communicationController.updateMeetingNote);
router.delete('/meeting-notes/:id', authenticateUser, HasPermission([CommunicationPermissionsEnum.LOG_ACTIVITIES]), communicationController.deleteMeetingNote);

// ─── Call Analytics ─────────────────────────────────────────────────────────

router.get('/call-analytics', authenticateUser, HasPermission([CommunicationPermissionsEnum.VIEW_STATS]), communicationController.getCallAnalytics);

// ─── Participants Search ────────────────────────────────────────────────────

router.get('/participants/search', authenticateUser, HasPermission([CommunicationPermissionsEnum.VIEW_ACTIVITIES]), communicationController.searchParticipants);

// ─── Stats & Recent ──────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/communications/stats:
 *   get:
 *     summary: Get activity statistics
 *     tags: [Communication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: User ID (defaults to authenticated user)
 *       - in: query
 *         name: start
 *         schema:
 *           type: string
 *           format: date
 *         description: Date range start (ISO date)
 *       - in: query
 *         name: end
 *         schema:
 *           type: string
 *           format: date
 *         description: Date range end (ISO date)
 *     responses:
 *       200:
 *         description: Activity statistics
 */
router.get('/stats', authenticateUser, HasPermission([CommunicationPermissionsEnum.VIEW_STATS]), communicationController.getStats);

/**
 * @swagger
 * /api/communications/recent:
 *   get:
 *     summary: Get recent activities for the current user
 *     tags: [Communication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of recent activities to return
 *     responses:
 *       200:
 *         description: List of recent activities
 */
router.get('/recent', authenticateUser, HasPermission([CommunicationPermissionsEnum.VIEW_ACTIVITIES]), communicationController.getRecent);

export default router;
