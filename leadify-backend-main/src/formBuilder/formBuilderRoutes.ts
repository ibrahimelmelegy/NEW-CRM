import express from 'express';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { FormBuilderPermissionsEnum } from '../role/roleEnum';
import c from './formBuilderController';

const router = express.Router();

router.get('/', authenticateUser, HasPermission([FormBuilderPermissionsEnum.VIEW_FORMS]), c.getTemplates);
router.get('/templates', authenticateUser, HasPermission([FormBuilderPermissionsEnum.VIEW_FORMS]), c.getTemplates);
router.post('/templates', authenticateUser, HasPermission([FormBuilderPermissionsEnum.CREATE_FORMS]), c.createTemplate);
router.put('/templates/:id', authenticateUser, HasPermission([FormBuilderPermissionsEnum.EDIT_FORMS]), c.updateTemplate);
router.delete('/templates/:id', authenticateUser, HasPermission([FormBuilderPermissionsEnum.DELETE_FORMS]), c.deleteTemplate);
router.get('/templates/:id/analytics', authenticateUser, HasPermission([FormBuilderPermissionsEnum.VIEW_FORMS]), c.getFormAnalytics);
router.post('/templates/:id/submit', c.submitForm); // Public form submission — no auth
router.post('/templates/:id/view', c.trackFormView); // Public view tracking — no auth
router.get('/public/:token', c.getFormByToken); // Public form fetch by embed token — no auth
router.get('/submissions', authenticateUser, HasPermission([FormBuilderPermissionsEnum.VIEW_SUBMISSIONS]), c.getSubmissions);

export default router;
