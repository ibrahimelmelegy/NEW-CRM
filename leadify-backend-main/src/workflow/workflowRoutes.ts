import express from 'express';
import workflowController from './workflowController';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { SettingsPermissionsEnum } from '../role/roleEnum';

const router = express.Router();

router.get('/', authenticateUser, HasPermission([SettingsPermissionsEnum.VIEW_SETTINGS]), workflowController.getAll);
router.get('/logs', authenticateUser, HasPermission([SettingsPermissionsEnum.VIEW_SETTINGS]), workflowController.getLogs);
router.get('/:id', authenticateUser, HasPermission([SettingsPermissionsEnum.VIEW_SETTINGS]), workflowController.getById);
router.post('/', authenticateUser, HasPermission([SettingsPermissionsEnum.EDIT_SETTINGS]), workflowController.create);
router.put('/:id', authenticateUser, HasPermission([SettingsPermissionsEnum.EDIT_SETTINGS]), workflowController.update);
router.delete('/:id', authenticateUser, HasPermission([SettingsPermissionsEnum.EDIT_SETTINGS]), workflowController.delete);

export default router;
