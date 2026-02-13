import express from 'express';
import customFieldController from './customFieldController';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { SettingsPermissionsEnum } from '../role/roleEnum';

const router = express.Router();

// Field definitions — admin only
router.get('/fields/:entityType', authenticateUser, customFieldController.getFields);
router.post('/fields', authenticateUser, HasPermission([SettingsPermissionsEnum.EDIT_SETTINGS]), customFieldController.createField);
router.put('/fields/:id', authenticateUser, HasPermission([SettingsPermissionsEnum.EDIT_SETTINGS]), customFieldController.updateField);
router.delete('/fields/:id', authenticateUser, HasPermission([SettingsPermissionsEnum.EDIT_SETTINGS]), customFieldController.deleteField);
router.put('/fields/reorder', authenticateUser, HasPermission([SettingsPermissionsEnum.EDIT_SETTINGS]), customFieldController.reorderFields);

// Field values — per entity
router.get('/values/:entityType/:entityId', authenticateUser, customFieldController.getValues);
router.put('/values/:entityType/:entityId', authenticateUser, customFieldController.saveValues);

export default router;
