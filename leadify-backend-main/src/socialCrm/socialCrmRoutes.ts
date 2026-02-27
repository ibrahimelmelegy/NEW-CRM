import express from 'express';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { SocialCrmPermissionsEnum } from '../role/roleEnum';
import c from './socialCrmController';

const router = express.Router();

// Social Posts (must be before /:id to avoid route conflicts)
router.get('/posts', authenticateUser, HasPermission([SocialCrmPermissionsEnum.VIEW_SOCIAL_CRM]), c.getPosts);
router.post('/posts', authenticateUser, HasPermission([SocialCrmPermissionsEnum.CREATE_SOCIAL_CRM]), c.createPost);
router.put('/posts/:id', authenticateUser, HasPermission([SocialCrmPermissionsEnum.EDIT_SOCIAL_CRM]), c.updatePost);
router.delete('/posts/:id', authenticateUser, HasPermission([SocialCrmPermissionsEnum.DELETE_SOCIAL_CRM]), c.deletePost);

// Social Profiles
router.get('/', authenticateUser, HasPermission([SocialCrmPermissionsEnum.VIEW_SOCIAL_CRM]), c.getAll);
router.post('/', authenticateUser, HasPermission([SocialCrmPermissionsEnum.CREATE_SOCIAL_CRM]), c.create);
router.put('/:id', authenticateUser, HasPermission([SocialCrmPermissionsEnum.EDIT_SOCIAL_CRM]), c.update);
router.delete('/:id', authenticateUser, HasPermission([SocialCrmPermissionsEnum.DELETE_SOCIAL_CRM]), c.delete);

export default router;
