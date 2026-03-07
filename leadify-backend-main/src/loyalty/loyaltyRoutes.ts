import express from 'express';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { LoyaltyPermissionsEnum } from '../role/roleEnum';
import c from './loyaltyController';

const router = express.Router();

router.get('/', authenticateUser, HasPermission([LoyaltyPermissionsEnum.VIEW_LOYALTY]), c.getPrograms);
router.get('/programs', authenticateUser, HasPermission([LoyaltyPermissionsEnum.VIEW_LOYALTY]), c.getPrograms);
router.post('/programs', authenticateUser, HasPermission([LoyaltyPermissionsEnum.CREATE_LOYALTY]), c.createProgram);
router.put('/programs/:id', authenticateUser, HasPermission([LoyaltyPermissionsEnum.EDIT_LOYALTY]), c.updateProgram);
router.delete('/programs/:id', authenticateUser, HasPermission([LoyaltyPermissionsEnum.DELETE_LOYALTY]), c.deleteProgram);
router.get('/points', authenticateUser, HasPermission([LoyaltyPermissionsEnum.VIEW_LOYALTY]), c.getPointsHistory);
router.post('/points', authenticateUser, HasPermission([LoyaltyPermissionsEnum.MANAGE_POINTS]), c.addPoints);
router.get('/balance/:clientId/:programId', authenticateUser, HasPermission([LoyaltyPermissionsEnum.VIEW_LOYALTY]), c.getClientBalance);

export default router;
