import { Router } from 'express';
import approvalController from './approvalController';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { ApprovalPermissionsEnum } from '../role/roleEnum';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Approval
 *   description: Approval workflows and approval requests
 */

// Workflow routes

/**
 * @swagger
 * /api/approvals/workflows:
 *   get:
 *     summary: Get all approval workflows
 *     tags: [Approval]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of approval workflows
 */
router.get('/workflows', authenticateUser, HasPermission([ApprovalPermissionsEnum.MANAGE_WORKFLOWS]), approvalController.getWorkflows);

/**
 * @swagger
 * /api/approvals/workflows:
 *   post:
 *     summary: Create a new approval workflow
 *     tags: [Approval]
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
 *               - entityType
 *               - steps
 *             properties:
 *               name:
 *                 type: string
 *                 description: Workflow name
 *               description:
 *                 type: string
 *                 description: Workflow description
 *               entityType:
 *                 type: string
 *                 description: Entity type this workflow applies to
 *               steps:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - order
 *                     - approverUserId
 *                     - approverName
 *                     - required
 *                   properties:
 *                     order:
 *                       type: integer
 *                       description: Step order (0-based)
 *                     approverUserId:
 *                       type: integer
 *                       description: User ID of the approver
 *                     approverName:
 *                       type: string
 *                       description: Display name of the approver
 *                     required:
 *                       type: boolean
 *                       description: Whether this step is required
 *               isActive:
 *                 type: boolean
 *                 description: Whether the workflow is active
 *     responses:
 *       201:
 *         description: Workflow created
 */
router.post('/workflows', authenticateUser, HasPermission([ApprovalPermissionsEnum.MANAGE_WORKFLOWS]), approvalController.createWorkflow);

/**
 * @swagger
 * /api/approvals/workflows/{id}:
 *   put:
 *     summary: Update an approval workflow
 *     tags: [Approval]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Workflow ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Workflow name
 *               description:
 *                 type: string
 *                 description: Workflow description
 *               entityType:
 *                 type: string
 *                 description: Entity type this workflow applies to
 *               steps:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     order:
 *                       type: integer
 *                     approverUserId:
 *                       type: integer
 *                     approverName:
 *                       type: string
 *                     required:
 *                       type: boolean
 *               isActive:
 *                 type: boolean
 *                 description: Whether the workflow is active
 *     responses:
 *       200:
 *         description: Workflow updated
 */
router.put('/workflows/:id', authenticateUser, HasPermission([ApprovalPermissionsEnum.MANAGE_WORKFLOWS]), approvalController.updateWorkflow);

/**
 * @swagger
 * /api/approvals/workflows/{id}:
 *   delete:
 *     summary: Delete an approval workflow
 *     tags: [Approval]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Workflow ID
 *     responses:
 *       200:
 *         description: Workflow deleted
 */
router.delete('/workflows/:id', authenticateUser, HasPermission([ApprovalPermissionsEnum.MANAGE_WORKFLOWS]), approvalController.deleteWorkflow);

// Request routes

/**
 * @swagger
 * /api/approvals/requests:
 *   get:
 *     summary: Get approval requests
 *     tags: [Approval]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, CANCELLED]
 *         description: Filter by request status
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *         description: Filter by entity type
 *       - in: query
 *         name: requesterId
 *         schema:
 *           type: integer
 *         description: Filter by requester user ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Paginated list of approval requests
 */
router.get('/requests', authenticateUser, HasPermission([ApprovalPermissionsEnum.VIEW_APPROVALS]), approvalController.getRequests);

/**
 * @swagger
 * /api/approvals/requests/pending:
 *   get:
 *     summary: Get pending approvals for the current user
 *     tags: [Approval]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending approval requests assigned to the current user
 */
router.get('/requests/pending', authenticateUser, HasPermission([ApprovalPermissionsEnum.VIEW_APPROVALS]), approvalController.getPendingApprovals);

/**
 * @swagger
 * /api/approvals/requests:
 *   post:
 *     summary: Create a new approval request
 *     tags: [Approval]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - workflowId
 *               - entityType
 *               - entityId
 *               - title
 *             properties:
 *               workflowId:
 *                 type: integer
 *                 description: ID of the approval workflow to use
 *               entityType:
 *                 type: string
 *                 description: Type of entity being approved
 *               entityId:
 *                 type: integer
 *                 description: ID of the entity being approved
 *               title:
 *                 type: string
 *                 description: Title of the approval request
 *               description:
 *                 type: string
 *                 description: Description of the approval request
 *     responses:
 *       201:
 *         description: Approval request created
 */
router.post('/requests', authenticateUser, HasPermission([ApprovalPermissionsEnum.CREATE_APPROVALS]), approvalController.createRequest);

/**
 * @swagger
 * /api/approvals/requests/{id}/approve:
 *   post:
 *     summary: Approve the current step of an approval request
 *     tags: [Approval]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Approval request ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment:
 *                 type: string
 *                 description: Optional approval comment
 *     responses:
 *       200:
 *         description: Step approved
 */
router.post('/requests/:id/approve', authenticateUser, HasPermission([ApprovalPermissionsEnum.APPROVE_REQUESTS]), approvalController.approveStep);

/**
 * @swagger
 * /api/approvals/requests/{id}/reject:
 *   post:
 *     summary: Reject the current step of an approval request
 *     tags: [Approval]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Approval request ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment:
 *                 type: string
 *                 description: Optional rejection comment
 *     responses:
 *       200:
 *         description: Step rejected
 */
router.post('/requests/:id/reject', authenticateUser, HasPermission([ApprovalPermissionsEnum.REJECT_REQUESTS]), approvalController.rejectStep);

/**
 * @swagger
 * /api/approvals/requests/{id}/cancel:
 *   post:
 *     summary: Cancel an approval request
 *     tags: [Approval]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Approval request ID
 *     responses:
 *       200:
 *         description: Request cancelled
 */
router.post('/requests/:id/cancel', authenticateUser, HasPermission([ApprovalPermissionsEnum.CREATE_APPROVALS]), approvalController.cancelRequest);

export default router;
