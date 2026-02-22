import { Router } from 'express';
import subscriptionController from './subscriptionController';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { SubscriptionPermissionsEnum } from '../role/roleEnum';

/**
 * @swagger
 * tags:
 *   name: Subscription
 *   description: Subscription management — plans, billing cycles, renewals, metrics
 */

const router = Router();

// ─── Plan routes ──────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/subscriptions/plans:
 *   get:
 *     summary: List subscription plans
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of plans
 *       500:
 *         description: Server error
 */
router.get('/plans', authenticateUser, HasPermission([SubscriptionPermissionsEnum.VIEW_SUBSCRIPTIONS]), subscriptionController.getPlans);

/**
 * @swagger
 * /api/subscriptions/plans:
 *   post:
 *     summary: Create subscription plan
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - billingCycle
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               billingCycle:
 *                 type: string
 *                 enum: [MONTHLY, QUARTERLY, ANNUAL]
 *               price:
 *                 type: number
 *               currency:
 *                 type: string
 *                 default: SAR
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *               trialDays:
 *                 type: integer
 *                 default: 0
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Plan created
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/plans', authenticateUser, HasPermission([SubscriptionPermissionsEnum.MANAGE_PLANS]), subscriptionController.createPlan);

/**
 * @swagger
 * /api/subscriptions/plans/{id}:
 *   put:
 *     summary: Update subscription plan
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               billingCycle:
 *                 type: string
 *                 enum: [MONTHLY, QUARTERLY, ANNUAL]
 *               price:
 *                 type: number
 *               currency:
 *                 type: string
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *               trialDays:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Plan updated
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.put('/plans/:id', authenticateUser, HasPermission([SubscriptionPermissionsEnum.MANAGE_PLANS]), subscriptionController.updatePlan);

/**
 * @swagger
 * /api/subscriptions/plans/{id}:
 *   delete:
 *     summary: Delete subscription plan
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Plan deleted
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.delete('/plans/:id', authenticateUser, HasPermission([SubscriptionPermissionsEnum.MANAGE_PLANS]), subscriptionController.deletePlan);

// ─── Metrics ──────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/subscriptions/metrics:
 *   get:
 *     summary: Get subscription metrics
 *     description: Returns MRR, churn rate, active subscriptions count, and other KPIs
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription metrics
 *       500:
 *         description: Server error
 */
router.get('/metrics', authenticateUser, HasPermission([SubscriptionPermissionsEnum.VIEW_METRICS]), subscriptionController.getMetrics);

/**
 * @swagger
 * /api/subscriptions/process-renewals:
 *   post:
 *     summary: Process auto-renewals
 *     description: Trigger automatic renewal processing for eligible subscriptions
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Renewals processed
 *       500:
 *         description: Server error
 */
router.post('/process-renewals', authenticateUser, HasPermission([SubscriptionPermissionsEnum.MANAGE_PLANS]), subscriptionController.processRenewals);

// ─── Subscription routes ──────────────────────────────────────────────────────

/**
 * @swagger
 * /api/subscriptions:
 *   post:
 *     summary: Create a subscription
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clientId
 *               - planId
 *               - startDate
 *               - currentPeriodStart
 *               - currentPeriodEnd
 *             properties:
 *               clientId:
 *                 type: string
 *                 format: uuid
 *               planId:
 *                 type: string
 *                 format: uuid
 *               status:
 *                 type: string
 *                 enum: [TRIAL, ACTIVE, PAST_DUE, CANCELLED, EXPIRED]
 *               startDate:
 *                 type: string
 *                 format: date
 *               currentPeriodStart:
 *                 type: string
 *                 format: date
 *               currentPeriodEnd:
 *                 type: string
 *                 format: date
 *               nextBillingDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Subscription created
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/', authenticateUser, HasPermission([SubscriptionPermissionsEnum.CREATE_SUBSCRIPTIONS]), subscriptionController.createSubscription);

/**
 * @swagger
 * /api/subscriptions:
 *   get:
 *     summary: List subscriptions
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of subscriptions with plan and client info
 *       500:
 *         description: Server error
 */
router.get('/', authenticateUser, HasPermission([SubscriptionPermissionsEnum.VIEW_SUBSCRIPTIONS]), subscriptionController.getSubscriptions);

/**
 * @swagger
 * /api/subscriptions/{id}:
 *   get:
 *     summary: Get subscription by ID
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Subscription details with plan and client
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.get('/:id', authenticateUser, HasPermission([SubscriptionPermissionsEnum.VIEW_SUBSCRIPTIONS]), subscriptionController.getSubscriptionById);

/**
 * @swagger
 * /api/subscriptions/{id}/cancel:
 *   patch:
 *     summary: Cancel a subscription
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Subscription cancelled
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.patch('/:id/cancel', authenticateUser, HasPermission([SubscriptionPermissionsEnum.CANCEL_SUBSCRIPTIONS]), subscriptionController.cancelSubscription);

/**
 * @swagger
 * /api/subscriptions/{id}/change-plan:
 *   patch:
 *     summary: Change subscription plan
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPlanId
 *             properties:
 *               newPlanId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Plan changed
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.patch('/:id/change-plan', authenticateUser, HasPermission([SubscriptionPermissionsEnum.EDIT_SUBSCRIPTIONS]), subscriptionController.changePlan);

export default router;
