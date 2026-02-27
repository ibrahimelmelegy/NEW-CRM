import express from 'express';
import { authenticateUser, HasPermission } from '../../middleware/authMiddleware';
import { TrainingPermissionsEnum } from '../../role/roleEnum';
import controller from './trainingController';

const router = express.Router();

router.get('/programs', authenticateUser, HasPermission([TrainingPermissionsEnum.VIEW_TRAINING]), controller.getPrograms);
router.post('/programs', authenticateUser, HasPermission([TrainingPermissionsEnum.CREATE_TRAINING]), controller.createProgram);
router.put('/programs/:id', authenticateUser, HasPermission([TrainingPermissionsEnum.EDIT_TRAINING]), controller.updateProgram);
router.delete('/programs/:id', authenticateUser, HasPermission([TrainingPermissionsEnum.DELETE_TRAINING]), controller.deleteProgram);

router.get('/enrollments', authenticateUser, HasPermission([TrainingPermissionsEnum.VIEW_TRAINING]), controller.getEnrollments);
router.post('/enrollments', authenticateUser, HasPermission([TrainingPermissionsEnum.CREATE_TRAINING]), controller.enroll);
router.put('/enrollments/:id', authenticateUser, HasPermission([TrainingPermissionsEnum.EDIT_TRAINING]), controller.updateEnrollment);
router.delete('/enrollments/:id', authenticateUser, HasPermission([TrainingPermissionsEnum.DELETE_TRAINING]), controller.deleteEnrollment);

export default router;
