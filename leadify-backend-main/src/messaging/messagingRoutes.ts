import express from 'express';
import messagingController from './messagingController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Messaging
 *   description: WhatsApp messaging and conversations
 */

/**
 * @swagger
 * /api/messaging/send:
 *   post:
 *     summary: Send a message to a contact
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contactPhone
 *               - content
 *             properties:
 *               contactPhone:
 *                 type: string
 *               contactName:
 *                 type: string
 *               content:
 *                 type: string
 *               provider:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent
 */
router.get('/', authenticateUser, messagingController.getConversations);
router.post('/send', authenticateUser, messagingController.sendMessage);

/**
 * @swagger
 * /api/messaging/conversations:
 *   get:
 *     summary: Get all conversations for the current user
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of conversations
 */
router.get('/conversations', authenticateUser, messagingController.getConversations);

/**
 * @swagger
 * /api/messaging/messages/{contactPhone}:
 *   get:
 *     summary: Get messages for a specific contact
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contactPhone
 *         required: true
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
 *         description: Paginated messages
 */
router.get('/messages/:contactPhone', authenticateUser, messagingController.getMessages);

/**
 * @swagger
 * /api/messaging/read/{contactPhone}:
 *   put:
 *     summary: Mark messages from a contact as read
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contactPhone
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Messages marked as read
 */
router.put('/read/:contactPhone', authenticateUser, messagingController.markAsRead);

/**
 * @swagger
 * /api/messaging/webhook:
 *   get:
 *     summary: WhatsApp webhook verification
 *     tags: [Messaging]
 *     parameters:
 *       - in: query
 *         name: hub.mode
 *         schema:
 *           type: string
 *       - in: query
 *         name: hub.verify_token
 *         schema:
 *           type: string
 *       - in: query
 *         name: hub.challenge
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Webhook verified
 *       403:
 *         description: Verification failed
 */
router.get('/webhook', messagingController.webhook);

/**
 * @swagger
 * /api/messaging/webhook:
 *   post:
 *     summary: WhatsApp incoming message webhook
 *     tags: [Messaging]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook received
 */
router.post('/webhook', messagingController.webhook);

export default router;
