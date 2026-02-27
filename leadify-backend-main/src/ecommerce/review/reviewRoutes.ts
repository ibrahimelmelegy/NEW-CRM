import { Router } from 'express';
import reviewController from './reviewController';
import { authenticateUser, HasPermission } from '../../middleware/authMiddleware';
import { EcReviewPermissionsEnum } from '../../role/roleEnum';

const router = Router();

// ─── Product Reviews ─────────────────────────────────────────────────────────

router.get('/', authenticateUser, HasPermission([EcReviewPermissionsEnum.VIEW_EC_REVIEWS]), reviewController.getReviews);
router.get('/stats/:productId', authenticateUser, HasPermission([EcReviewPermissionsEnum.VIEW_EC_REVIEWS]), reviewController.getProductReviewStats);
router.get('/:id', authenticateUser, HasPermission([EcReviewPermissionsEnum.VIEW_EC_REVIEWS]), reviewController.getReviewById);
router.post('/', authenticateUser, HasPermission([EcReviewPermissionsEnum.CREATE_EC_REVIEWS]), reviewController.createReview);
router.patch('/:id/approve', authenticateUser, HasPermission([EcReviewPermissionsEnum.MODERATE_EC_REVIEWS]), reviewController.approveReview);
router.patch('/:id/reject', authenticateUser, HasPermission([EcReviewPermissionsEnum.MODERATE_EC_REVIEWS]), reviewController.rejectReview);
router.patch('/:id/respond', authenticateUser, HasPermission([EcReviewPermissionsEnum.RESPOND_EC_REVIEWS]), reviewController.respondToReview);
router.delete('/:id', authenticateUser, HasPermission([EcReviewPermissionsEnum.DELETE_EC_REVIEWS]), reviewController.deleteReview);

export default router;
