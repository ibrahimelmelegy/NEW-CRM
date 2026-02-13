import express from 'express';
import messagingController from './messagingController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

// Send a message
router.post('/send', authenticateUser, messagingController.sendMessage);

// Get all conversations for the current user
router.get('/conversations', authenticateUser, messagingController.getConversations);

// Get messages for a specific contact
router.get('/messages/:contactPhone', authenticateUser, messagingController.getMessages);

// Mark messages from a contact as read
router.put('/read/:contactPhone', authenticateUser, messagingController.markAsRead);

// WhatsApp webhook (no auth - called by WhatsApp API)
router.get('/webhook', messagingController.webhook);
router.post('/webhook', messagingController.webhook);

export default router;
