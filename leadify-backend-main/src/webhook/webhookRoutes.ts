import express from 'express';
import webhookController from './webhookController';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { SettingsPermissionsEnum } from '../role/roleEnum';

/**
 * @swagger
 * tags:
 *   name: Webhook
 *   description: Outbound webhook management — create, update, test
 */

const router = express.Router();

/**
 * @swagger
 * /api/webhooks:
 *   get:
 *     summary: List webhooks
 *     tags: [Webhook]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of configured webhooks
 *       500:
 *         description: Server error
 */
router.get('/', authenticateUser, HasPermission([SettingsPermissionsEnum.VIEW_SETTINGS]), webhookController.getAll);

/**
 * @swagger
 * /api/webhooks:
 *   post:
 *     summary: Create a webhook
 *     tags: [Webhook]
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
 *               - url
 *               - events
 *             properties:
 *               name:
 *                 type: string
 *               url:
 *                 type: string
 *                 format: uri
 *               events:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Event names to subscribe to (e.g. lead:created, deal:updated)
 *               isActive:
 *                 type: boolean
 *                 default: true
 *               secret:
 *                 type: string
 *                 description: Signing secret (auto-generated if not provided)
 *     responses:
 *       201:
 *         description: Webhook created
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/', authenticateUser, HasPermission([SettingsPermissionsEnum.EDIT_SETTINGS]), webhookController.create);

/**
 * @swagger
 * /api/webhooks/{id}:
 *   put:
 *     summary: Update a webhook
 *     tags: [Webhook]
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
 *               url:
 *                 type: string
 *                 format: uri
 *               events:
 *                 type: array
 *                 items:
 *                   type: string
 *               isActive:
 *                 type: boolean
 *               secret:
 *                 type: string
 *     responses:
 *       200:
 *         description: Webhook updated
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.put('/:id', authenticateUser, HasPermission([SettingsPermissionsEnum.EDIT_SETTINGS]), webhookController.update);

/**
 * @swagger
 * /api/webhooks/{id}:
 *   delete:
 *     summary: Delete a webhook
 *     tags: [Webhook]
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
 *         description: Webhook deleted
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticateUser, HasPermission([SettingsPermissionsEnum.EDIT_SETTINGS]), webhookController.delete);

/**
 * @swagger
 * /api/webhooks/{id}/test:
 *   post:
 *     summary: Test a webhook
 *     description: Sends a test payload to the webhook URL
 *     tags: [Webhook]
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
 *         description: Test payload sent
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.post('/:id/test', authenticateUser, HasPermission([SettingsPermissionsEnum.EDIT_SETTINGS]), webhookController.test);

export default router;
