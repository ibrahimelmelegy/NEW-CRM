import { Router } from 'express';
import reviewController from './reviewController';
import { authenticateUser } from '../../middleware/authMiddleware';

const router = Router();

// ─── Product Reviews ─────────────────────────────────────────────────────────

router.get('/', authenticateUser, reviewController.getReviews);
router.get('/stats/:productId', authenticateUser, reviewController.getProductReviewStats);
router.get('/:id', authenticateUser, reviewController.getReviewById);
router.post('/', authenticateUser, reviewController.createReview);
router.patch('/:id/approve', authenticateUser, reviewController.approveReview);
router.patch('/:id/reject', authenticateUser, reviewController.rejectReview);
router.patch('/:id/respond', authenticateUser, reviewController.respondToReview);
router.delete('/:id', authenticateUser, reviewController.deleteReview);

export default router;
