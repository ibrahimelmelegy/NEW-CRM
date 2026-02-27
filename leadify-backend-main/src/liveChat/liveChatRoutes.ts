import express from 'express';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { LiveChatPermissionsEnum } from '../role/roleEnum';
import c from './liveChatController';

const router = express.Router();

router.get('/conversations', authenticateUser, HasPermission([LiveChatPermissionsEnum.VIEW_CONVERSATIONS]), c.getConversations);
router.post('/conversations', authenticateUser, HasPermission([LiveChatPermissionsEnum.CREATE_CONVERSATIONS]), c.createConversation);
router.put('/conversations/:id', authenticateUser, HasPermission([LiveChatPermissionsEnum.EDIT_CONVERSATIONS]), c.updateConversation);
router.delete('/conversations/:id', authenticateUser, HasPermission([LiveChatPermissionsEnum.DELETE_CONVERSATIONS]), c.deleteConversation);
router.get('/conversations/:conversationId/messages', authenticateUser, HasPermission([LiveChatPermissionsEnum.VIEW_CONVERSATIONS]), c.getMessages);
router.post('/messages', authenticateUser, HasPermission([LiveChatPermissionsEnum.SEND_MESSAGES]), c.sendMessage);

export default router;
