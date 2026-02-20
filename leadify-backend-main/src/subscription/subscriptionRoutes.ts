import { Router } from 'express';
import subscriptionController from './subscriptionController';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { SubscriptionPermissionsEnum } from '../role/roleEnum';

const router = Router();

// Plan routes
router.get('/plans', authenticateUser, HasPermission([SubscriptionPermissionsEnum.VIEW_SUBSCRIPTIONS]), subscriptionController.getPlans);
router.post('/plans', authenticateUser, HasPermission([SubscriptionPermissionsEnum.MANAGE_PLANS]), subscriptionController.createPlan);
router.put('/plans/:id', authenticateUser, HasPermission([SubscriptionPermissionsEnum.MANAGE_PLANS]), subscriptionController.updatePlan);
router.delete('/plans/:id', authenticateUser, HasPermission([SubscriptionPermissionsEnum.MANAGE_PLANS]), subscriptionController.deletePlan);

// Metrics (must come before /:id to avoid conflict)
router.get('/metrics', authenticateUser, HasPermission([SubscriptionPermissionsEnum.VIEW_METRICS]), subscriptionController.getMetrics);

// Process auto-renewals (admin/cron)
router.post('/process-renewals', authenticateUser, HasPermission([SubscriptionPermissionsEnum.MANAGE_PLANS]), subscriptionController.processRenewals);

// Subscription routes
router.post('/', authenticateUser, HasPermission([SubscriptionPermissionsEnum.CREATE_SUBSCRIPTIONS]), subscriptionController.createSubscription);
router.get('/', authenticateUser, HasPermission([SubscriptionPermissionsEnum.VIEW_SUBSCRIPTIONS]), subscriptionController.getSubscriptions);
router.get('/:id', authenticateUser, HasPermission([SubscriptionPermissionsEnum.VIEW_SUBSCRIPTIONS]), subscriptionController.getSubscriptionById);
router.patch('/:id/cancel', authenticateUser, HasPermission([SubscriptionPermissionsEnum.CANCEL_SUBSCRIPTIONS]), subscriptionController.cancelSubscription);
router.patch('/:id/change-plan', authenticateUser, HasPermission([SubscriptionPermissionsEnum.EDIT_SUBSCRIPTIONS]), subscriptionController.changePlan);

export default router;
