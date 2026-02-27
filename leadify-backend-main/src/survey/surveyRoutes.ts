import express from 'express';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { SurveyPermissionsEnum } from '../role/roleEnum';
import c from './surveyController';

const router = express.Router();

router.get('/', authenticateUser, HasPermission([SurveyPermissionsEnum.VIEW_SURVEYS]), c.getAll);
router.get('/:id', authenticateUser, HasPermission([SurveyPermissionsEnum.VIEW_SURVEYS]), c.getById);
router.post('/', authenticateUser, HasPermission([SurveyPermissionsEnum.CREATE_SURVEYS]), c.create);
router.put('/:id', authenticateUser, HasPermission([SurveyPermissionsEnum.EDIT_SURVEYS]), c.update);
router.delete('/:id', authenticateUser, HasPermission([SurveyPermissionsEnum.DELETE_SURVEYS]), c.delete);
router.post('/:id/respond', c.submitResponse); // Public survey response — no auth
router.get('/:id/responses', authenticateUser, HasPermission([SurveyPermissionsEnum.VIEW_RESPONSES]), c.getResponses);

export default router;
