import express from 'express';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { LiveChatPermissionsEnum } from '../role/roleEnum';
import c from './liveChatController';

const router = express.Router();

// ───────── Conversations ─────────────────────────────────────────────────
router.get('/conversations', authenticateUser, HasPermission([LiveChatPermissionsEnum.VIEW_CONVERSATIONS]), c.getConversations);
router.get('/conversations/:id', authenticateUser, HasPermission([LiveChatPermissionsEnum.VIEW_CONVERSATIONS]), c.getConversation);
router.post('/conversations', authenticateUser, HasPermission([LiveChatPermissionsEnum.CREATE_CONVERSATIONS]), c.createConversation);
router.put('/conversations/:id', authenticateUser, HasPermission([LiveChatPermissionsEnum.EDIT_CONVERSATIONS]), c.updateConversation);
router.delete('/conversations/:id', authenticateUser, HasPermission([LiveChatPermissionsEnum.DELETE_CONVERSATIONS]), c.deleteConversation);

// ───────── Messages ──────────────────────────────────────────────────────
router.get('/conversations/:conversationId/messages', authenticateUser, HasPermission([LiveChatPermissionsEnum.VIEW_CONVERSATIONS]), c.getMessages);
router.post('/messages', authenticateUser, HasPermission([LiveChatPermissionsEnum.SEND_MESSAGES]), c.sendMessage);
router.put('/conversations/:conversationId/read', authenticateUser, HasPermission([LiveChatPermissionsEnum.VIEW_CONVERSATIONS]), c.markAsRead);

// ───────── Agent Assignment ──────────────────────────────────────────────
router.put('/conversations/:id/assign', authenticateUser, HasPermission([LiveChatPermissionsEnum.EDIT_CONVERSATIONS]), c.assignAgent);
router.put('/conversations/:id/auto-assign', authenticateUser, HasPermission([LiveChatPermissionsEnum.EDIT_CONVERSATIONS]), c.autoAssign);
router.put('/conversations/:id/transfer', authenticateUser, HasPermission([LiveChatPermissionsEnum.EDIT_CONVERSATIONS]), c.transferConversation);

// ───────── Status Actions ────────────────────────────────────────────────
router.put('/conversations/:id/resolve', authenticateUser, HasPermission([LiveChatPermissionsEnum.EDIT_CONVERSATIONS]), c.resolveConversation);
router.put('/conversations/:id/close', authenticateUser, HasPermission([LiveChatPermissionsEnum.EDIT_CONVERSATIONS]), c.closeConversation);
router.put('/conversations/:id/rate', authenticateUser, HasPermission([LiveChatPermissionsEnum.VIEW_CONVERSATIONS]), c.rateConversation);

// ───────── Canned Responses ──────────────────────────────────────────────
router.get('/canned-responses', authenticateUser, HasPermission([LiveChatPermissionsEnum.VIEW_CONVERSATIONS]), c.getCannedResponses);

// ───────── Queue ─────────────────────────────────────────────────────────
router.get('/queue', authenticateUser, HasPermission([LiveChatPermissionsEnum.VIEW_CONVERSATIONS]), c.getWaitingQueue);
router.get('/queue/:id/position', authenticateUser, HasPermission([LiveChatPermissionsEnum.VIEW_CONVERSATIONS]), c.getQueuePosition);

// ───────── Unread & Metrics ──────────────────────────────────────────────
router.get('/unread-count', authenticateUser, HasPermission([LiveChatPermissionsEnum.VIEW_CONVERSATIONS]), c.getUnreadCount);
router.get('/metrics', authenticateUser, HasPermission([LiveChatPermissionsEnum.VIEW_CONVERSATIONS]), c.getMetrics);

export default router;
