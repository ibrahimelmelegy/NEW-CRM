import { Router } from 'express';
import sequenceController from './sequenceController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = Router();

// Sequence CRUD
router.get('/', authenticateUser, sequenceController.getSequences);
router.post('/', authenticateUser, sequenceController.createSequence);
router.put('/:id', authenticateUser, sequenceController.updateSequence);
router.delete('/:id', authenticateUser, sequenceController.deleteSequence);

// Enrollment routes
router.post('/:id/enroll', authenticateUser, sequenceController.enrollEntity);
router.patch('/enrollments/:id/advance', authenticateUser, sequenceController.advanceStep);
router.patch('/enrollments/:id/pause', authenticateUser, sequenceController.pauseEnrollment);
router.patch('/enrollments/:id/resume', authenticateUser, sequenceController.resumeEnrollment);
router.get('/:id/enrollments', authenticateUser, sequenceController.getEnrollments);
router.get('/:id/stats', authenticateUser, sequenceController.getStats);

export default router;
