import express from 'express';
import notificationController from './notificationController';
import { authenticateUser } from '../middleware/authMiddleware';
import { validateQuery } from '../middleware/validation';
import { GetNotificationsInput } from './inputs/getNotificationsInput';

const router = express.Router();

//** --------------------- GET --------------------- */

/**
 * @swagger
 * /api/notification/:
 *   get:
 *     summary: Get all notifications
 *     tags: [Notification]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *         description: The page number for pagination
 *         example: "1"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *         description: The number of records per page
 *         example: "20"
 *       - in: query
 *         name: read
 *         schema:
 *           type: string
 *           enum: [read, unread]
 *         description: Filter by read status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by notification type
 *     responses:
 *       200:
 *         description: List of notifications
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Internal Server Error
 */
router.get('/', authenticateUser, validateQuery(GetNotificationsInput), notificationController.getNotifications);

/**
 * @swagger
 * /api/notification/unread-count:
 *   get:
 *     summary: Get unread notification count
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count
 */
router.get('/unread-count', authenticateUser, notificationController.getUnreadCount);

/**
 * @swagger
 * /api/notification/preferences:
 *   get:
 *     summary: Get notification preferences for authenticated user
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User notification preferences
 */
router.get('/preferences', authenticateUser, notificationController.getPreferences);

/**
 * @swagger
 * /api/notification/digest:
 *   get:
 *     summary: Get notification digest (unread grouped by type)
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: since
 *         schema:
 *           type: string
 *           format: date-time
 *         description: ISO date from which to compute the digest. Defaults to 24h ago.
 *     responses:
 *       200:
 *         description: Notification digest with grouped counts and latest messages
 */
router.get('/digest', authenticateUser, notificationController.getDigest);

//** --------------------- POST --------------------- */

/**
 * @swagger
 * /api/notification/push-subscription:
 *   post:
 *     summary: Register a browser push subscription
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - endpoint
 *               - keys
 *             properties:
 *               endpoint:
 *                 type: string
 *               keys:
 *                 type: object
 *                 properties:
 *                   p256dh:
 *                     type: string
 *                   auth:
 *                     type: string
 *     responses:
 *       201:
 *         description: Push subscription registered
 *       400:
 *         description: Invalid subscription data
 */
router.post('/push-subscription', authenticateUser, notificationController.registerPushSubscription);

//** --------------------- PUT --------------------- */

/**
 * @swagger
 * /api/notification/:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notifications updated successfully
 *       500:
 *         description: Internal server error
 */
router.put('/', authenticateUser, notificationController.updateNotificationsToRead);

// Alias: PUT /read-all (used by frontend composables)
router.put('/read-all', authenticateUser, notificationController.updateNotificationsToRead);

/**
 * @swagger
 * /api/notification/click/{id}:
 *   put:
 *     summary: Mark a notification as clicked
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the notification to update
 *     responses:
 *       200:
 *         description: Notification updated successfully
 *       400:
 *         description: Validation error
 *       607:
 *         description: Notification not found
 *       500:
 *         description: Internal server error
 */
router.put('/click/:id', authenticateUser, notificationController.updateNotificationToClicked);

/**
 * @swagger
 * /api/notification/read/{id}:
 *   put:
 *     summary: Mark a single notification as read
 *     tags: [Notification]
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
 *         description: Notification marked as read
 *       607:
 *         description: Notification not found
 */
router.put('/read/:id', authenticateUser, notificationController.markAsRead);

/**
 * @swagger
 * /api/notification/preferences:
 *   put:
 *     summary: Update notification preferences
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Partial notification preferences map
 *     responses:
 *       200:
 *         description: Preferences updated
 */
router.put('/preferences', authenticateUser, notificationController.updatePreferences);

//** --------------------- DELETE --------------------- */

/**
 * @swagger
 * /api/notification/push-subscription:
 *   delete:
 *     summary: Unregister a browser push subscription
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - endpoint
 *             properties:
 *               endpoint:
 *                 type: string
 *     responses:
 *       200:
 *         description: Push subscription removed
 */
router.delete('/push-subscription', authenticateUser, notificationController.unregisterPushSubscription);

/**
 * @swagger
 * /api/notification/cleanup:
 *   delete:
 *     summary: Delete notifications older than specified days
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: daysOld
 *         required: true
 *         schema:
 *           type: number
 *         description: Number of days. Notifications older than this will be deleted.
 *     responses:
 *       200:
 *         description: Old notifications deleted
 */
router.delete('/cleanup', authenticateUser, notificationController.deleteOldNotifications);

/**
 * @swagger
 * /api/notification/{id}:
 *   delete:
 *     summary: Delete a single notification
 *     tags: [Notification]
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
 *         description: Notification deleted
 *       607:
 *         description: Notification not found
 */
router.delete('/:id', authenticateUser, notificationController.deleteNotification);

export default router;
