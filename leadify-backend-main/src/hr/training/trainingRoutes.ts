import express from 'express';
import { authenticateUser, HasPermission } from '../../middleware/authMiddleware';
import { TrainingPermissionsEnum } from '../../role/roleEnum';
import controller from './trainingController';

const router = express.Router();

// Programs
router.get('/programs', authenticateUser, HasPermission([TrainingPermissionsEnum.VIEW_TRAINING]), controller.getPrograms);
router.get('/programs/:id', authenticateUser, HasPermission([TrainingPermissionsEnum.VIEW_TRAINING]), controller.getProgramById);
router.post('/programs', authenticateUser, HasPermission([TrainingPermissionsEnum.CREATE_TRAINING]), controller.createProgram);
router.put('/programs/:id', authenticateUser, HasPermission([TrainingPermissionsEnum.EDIT_TRAINING]), controller.updateProgram);
router.delete('/programs/:id', authenticateUser, HasPermission([TrainingPermissionsEnum.DELETE_TRAINING]), controller.deleteProgram);

// Program analytics
router.get('/programs/:programId/completion-rate', authenticateUser, HasPermission([TrainingPermissionsEnum.VIEW_TRAINING]), controller.getCompletionRate);
router.get('/programs/:programId/prerequisites', authenticateUser, HasPermission([TrainingPermissionsEnum.VIEW_TRAINING]), controller.checkPrerequisites);

// Dashboard
router.get('/dashboard', authenticateUser, HasPermission([TrainingPermissionsEnum.VIEW_TRAINING]), controller.getDashboard);

// Employee training history
router.get('/employees/:employeeId/history', authenticateUser, HasPermission([TrainingPermissionsEnum.VIEW_TRAINING]), controller.getEmployeeHistory);

// Enrollments
router.get('/enrollments', authenticateUser, HasPermission([TrainingPermissionsEnum.VIEW_TRAINING]), controller.getEnrollments);
router.post('/enrollments', authenticateUser, HasPermission([TrainingPermissionsEnum.CREATE_TRAINING]), controller.enroll);
router.post('/enrollments/with-capacity', authenticateUser, HasPermission([TrainingPermissionsEnum.CREATE_TRAINING]), controller.enrollWithCapacity);
router.put('/enrollments/:id', authenticateUser, HasPermission([TrainingPermissionsEnum.EDIT_TRAINING]), controller.updateEnrollment);
router.put('/enrollments/:id/complete', authenticateUser, HasPermission([TrainingPermissionsEnum.EDIT_TRAINING]), controller.completeTraining);
router.delete('/enrollments/:id', authenticateUser, HasPermission([TrainingPermissionsEnum.DELETE_TRAINING]), controller.deleteEnrollment);

export default router;
