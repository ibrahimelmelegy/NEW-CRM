import express from 'express';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { SocialCrmPermissionsEnum } from '../role/roleEnum';
import c from './socialCrmController';

const router = express.Router();

router.get('/', authenticateUser, HasPermission([SocialCrmPermissionsEnum.VIEW_SOCIAL_CRM]), c.getAll);
router.post('/', authenticateUser, HasPermission([SocialCrmPermissionsEnum.CREATE_SOCIAL_CRM]), c.create);
router.put('/:id', authenticateUser, HasPermission([SocialCrmPermissionsEnum.EDIT_SOCIAL_CRM]), c.update);
router.delete('/:id', authenticateUser, HasPermission([SocialCrmPermissionsEnum.DELETE_SOCIAL_CRM]), c.delete);

export default router;
