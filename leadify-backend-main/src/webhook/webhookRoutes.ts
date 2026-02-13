import express from 'express';
import webhookController from './webhookController';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { SettingsPermissionsEnum } from '../role/roleEnum';

const router = express.Router();

router.get('/', authenticateUser, HasPermission([SettingsPermissionsEnum.VIEW_SETTINGS]), webhookController.getAll);
router.post('/', authenticateUser, HasPermission([SettingsPermissionsEnum.EDIT_SETTINGS]), webhookController.create);
router.put('/:id', authenticateUser, HasPermission([SettingsPermissionsEnum.EDIT_SETTINGS]), webhookController.update);
router.delete('/:id', authenticateUser, HasPermission([SettingsPermissionsEnum.EDIT_SETTINGS]), webhookController.delete);
router.post('/:id/test', authenticateUser, HasPermission([SettingsPermissionsEnum.EDIT_SETTINGS]), webhookController.test);

export default router;
