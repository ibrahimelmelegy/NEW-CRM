import express from 'express';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import supportController from './supportController';
import { SupportPermissionsEnum } from '../role/roleEnum';

/**
 * @swagger
 * tags:
 *   name: Support
 *   description: Support ticket system — tickets, messages, CSAT, canned responses, categories, dashboard
 */

const router = express.Router();

// ─── Tickets ──────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/support/tickets:
 *   post:
 *     summary: Create a support ticket
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *             properties:
 *               subject:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *                 default: MEDIUM
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               clientId:
 *                 type: string
 *                 format: uuid
 *               source:
 *                 type: string
 *                 enum: [EMAIL, PORTAL, PHONE, CHAT]
 *                 default: PORTAL
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Ticket created with auto-generated ticket number
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/tickets', authenticateUser, HasPermission([SupportPermissionsEnum.CREATE_TICKETS]), supportController.createTicket);

/**
 * @swagger
 * /api/support/tickets:
 *   get:
 *     summary: List support tickets
 *     description: Returns paginated tickets with optional filters
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPEN, IN_PROGRESS, WAITING_CUSTOMER, RESOLVED, CLOSED]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, URGENT]
 *       - in: query
 *         name: searchKey
 *         schema:
 *           type: string
 *         description: Search by ticket number or subject
 *     responses:
 *       200:
 *         description: Paginated ticket list
 *       500:
 *         description: Server error
 */
router.get('/tickets', authenticateUser, HasPermission([SupportPermissionsEnum.VIEW_TICKETS]), supportController.getTickets);

/**
 * @swagger
 * /api/support/tickets/{id}:
 *   get:
 *     summary: Get ticket by ID
 *     description: Returns ticket with messages and assignment details
 *     tags: [Support]
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
 *         description: Ticket detail with messages
 *       404:
 *         description: Ticket not found
 *       500:
 *         description: Server error
 */
router.get('/tickets/:id', authenticateUser, HasPermission([SupportPermissionsEnum.VIEW_TICKETS]), supportController.getTicketById);

/**
 * @swagger
 * /api/support/tickets/{id}/assign:
 *   patch:
 *     summary: Assign ticket to a user
 *     tags: [Support]
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
 *               - userId
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: ID of user to assign
 *     responses:
 *       200:
 *         description: Ticket assigned
 *       404:
 *         description: Ticket not found
 *       500:
 *         description: Server error
 */
router.patch('/tickets/:id/assign', authenticateUser, HasPermission([SupportPermissionsEnum.ASSIGN_TICKETS]), supportController.assignTicket);

/**
 * @swagger
 * /api/support/tickets/{id}/resolve:
 *   patch:
 *     summary: Resolve a ticket
 *     description: Marks ticket as resolved and records resolution timestamp
 *     tags: [Support]
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
 *         description: Ticket resolved
 *       404:
 *         description: Ticket not found
 *       500:
 *         description: Server error
 */
router.patch('/tickets/:id/resolve', authenticateUser, HasPermission([SupportPermissionsEnum.RESOLVE_TICKETS]), supportController.resolveTicket);

/**
 * @swagger
 * /api/support/tickets/{id}/close:
 *   patch:
 *     summary: Close a ticket
 *     tags: [Support]
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
 *         description: Ticket closed
 *       404:
 *         description: Ticket not found
 *       500:
 *         description: Server error
 */
router.patch('/tickets/:id/close', authenticateUser, HasPermission([SupportPermissionsEnum.RESOLVE_TICKETS]), supportController.closeTicket);

/**
 * @swagger
 * /api/support/tickets/{id}/messages:
 *   post:
 *     summary: Add message to a ticket
 *     tags: [Support]
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
 *               - body
 *             properties:
 *               body:
 *                 type: string
 *               senderType:
 *                 type: string
 *                 enum: [AGENT, CUSTOMER]
 *                 default: AGENT
 *               isInternal:
 *                 type: boolean
 *                 default: false
 *                 description: Internal notes not visible to customer
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     url:
 *                       type: string
 *     responses:
 *       201:
 *         description: Message added to ticket
 *       404:
 *         description: Ticket not found
 *       500:
 *         description: Server error
 */
router.post('/tickets/:id/messages', authenticateUser, HasPermission([SupportPermissionsEnum.EDIT_TICKETS]), supportController.addMessage);

/**
 * @swagger
 * /api/support/tickets/{id}/csat:
 *   post:
 *     summary: Submit CSAT rating
 *     description: Submit customer satisfaction rating for a resolved ticket
 *     tags: [Support]
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
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: CSAT rating submitted
 *       404:
 *         description: Ticket not found
 *       500:
 *         description: Server error
 */
router.post('/tickets/:id/csat', authenticateUser, HasPermission([SupportPermissionsEnum.VIEW_TICKETS]), supportController.submitCSAT);

// ─── Dashboard ────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/support/dashboard:
 *   get:
 *     summary: Get support dashboard
 *     description: Returns ticket statistics, SLA metrics, and agent performance data
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *       500:
 *         description: Server error
 */
router.get('/dashboard', authenticateUser, HasPermission([SupportPermissionsEnum.VIEW_TICKETS]), supportController.getDashboard);

/**
 * @swagger
 * /api/support/agent-workload:
 *   get:
 *     summary: Get agent workload
 *     description: Returns current workload for all support agents
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Agent workload data
 *       500:
 *         description: Server error
 */
router.get('/agent-workload', authenticateUser, HasPermission([SupportPermissionsEnum.VIEW_TICKETS]), supportController.getAgentWorkload);

/**
 * @swagger
 * /api/support/sla-breaches:
 *   get:
 *     summary: Get SLA breaches
 *     description: Returns all tickets that have breached their SLA deadline
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of breached tickets
 *       500:
 *         description: Server error
 */
router.get('/sla-breaches', authenticateUser, HasPermission([SupportPermissionsEnum.VIEW_TICKETS]), supportController.getSLABreaches);

/**
 * @swagger
 * /api/support/tickets/{id}/auto-assign:
 *   post:
 *     summary: Auto-assign ticket
 *     description: Automatically assigns ticket to agent with lowest workload
 *     tags: [Support]
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
 *         description: Ticket auto-assigned
 *       404:
 *         description: Ticket not found
 *       500:
 *         description: Server error
 */
router.post('/tickets/:id/auto-assign', authenticateUser, HasPermission([SupportPermissionsEnum.ASSIGN_TICKETS]), supportController.autoAssignTicket);

/**
 * @swagger
 * /api/support/tickets/{id}/escalate:
 *   patch:
 *     summary: Escalate a ticket
 *     description: Bumps priority, optionally reassigns, and adds escalation note
 *     tags: [Support]
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
 *               assignTo:
 *                 type: string
 *                 description: User ID to reassign to
 *               reason:
 *                 type: string
 *                 description: Escalation reason
 *     responses:
 *       200:
 *         description: Ticket escalated
 *       404:
 *         description: Ticket not found
 *       500:
 *         description: Server error
 */
router.patch('/tickets/:id/escalate', authenticateUser, HasPermission([SupportPermissionsEnum.ASSIGN_TICKETS]), supportController.escalateTicket);

/**
 * @swagger
 * /api/support/tickets/{id}/reopen:
 *   patch:
 *     summary: Reopen a resolved or closed ticket
 *     tags: [Support]
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
 *         description: Ticket reopened
 *       404:
 *         description: Ticket not found
 *       400:
 *         description: Ticket is not in a reopenable state
 *       500:
 *         description: Server error
 */
router.patch('/tickets/:id/reopen', authenticateUser, HasPermission([SupportPermissionsEnum.EDIT_TICKETS]), supportController.reopenTicket);

/**
 * @swagger
 * /api/support/sla-compliance:
 *   get:
 *     summary: Get SLA compliance report
 *     description: Detailed compliance rates by priority, breached tickets, and at-risk tickets
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: SLA compliance report
 *       500:
 *         description: Server error
 */
router.get('/sla-compliance', authenticateUser, HasPermission([SupportPermissionsEnum.VIEW_TICKETS]), supportController.getSLAComplianceReport);

// ─── Canned Responses ─────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/support/canned-responses:
 *   get:
 *     summary: List canned responses
 *     description: Returns pre-built response templates for quick ticket replies
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of canned responses
 *       500:
 *         description: Server error
 */
router.get('/canned-responses', authenticateUser, HasPermission([SupportPermissionsEnum.VIEW_TICKETS]), supportController.getCannedResponses);

/**
 * @swagger
 * /api/support/canned-responses:
 *   post:
 *     summary: Create canned response
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - body
 *             properties:
 *               title:
 *                 type: string
 *               body:
 *                 type: string
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: Canned response created
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post(
  '/canned-responses',
  authenticateUser,
  HasPermission([SupportPermissionsEnum.MANAGE_CANNED_RESPONSES]),
  supportController.createCannedResponse
);

/**
 * @swagger
 * /api/support/canned-responses/{id}:
 *   put:
 *     summary: Update canned response
 *     tags: [Support]
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
 *               title:
 *                 type: string
 *               body:
 *                 type: string
 *               category:
 *                 type: string
 *     responses:
 *       200:
 *         description: Canned response updated
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.put(
  '/canned-responses/:id',
  authenticateUser,
  HasPermission([SupportPermissionsEnum.MANAGE_CANNED_RESPONSES]),
  supportController.updateCannedResponse
);

/**
 * @swagger
 * /api/support/canned-responses/{id}:
 *   delete:
 *     summary: Delete canned response
 *     tags: [Support]
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
 *         description: Canned response deleted
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.delete(
  '/canned-responses/:id',
  authenticateUser,
  HasPermission([SupportPermissionsEnum.MANAGE_CANNED_RESPONSES]),
  supportController.deleteCannedResponse
);

// ─── Categories ───────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/support/categories:
 *   get:
 *     summary: List ticket categories
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of categories (hierarchical)
 *       500:
 *         description: Server error
 */
router.get('/categories', authenticateUser, HasPermission([SupportPermissionsEnum.VIEW_TICKETS]), supportController.getCategories);

/**
 * @swagger
 * /api/support/categories:
 *   post:
 *     summary: Create ticket category
 *     tags: [Support]
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
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               parentId:
 *                 type: string
 *                 format: uuid
 *                 description: Parent category for hierarchical nesting
 *     responses:
 *       201:
 *         description: Category created
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/categories', authenticateUser, HasPermission([SupportPermissionsEnum.EDIT_TICKETS]), supportController.createCategory);

/**
 * @swagger
 * /api/support/categories/{id}:
 *   put:
 *     summary: Update ticket category
 *     tags: [Support]
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
 *               parentId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Category updated
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.put('/categories/:id', authenticateUser, HasPermission([SupportPermissionsEnum.EDIT_TICKETS]), supportController.updateCategory);

/**
 * @swagger
 * /api/support/categories/{id}:
 *   delete:
 *     summary: Delete ticket category
 *     tags: [Support]
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
 *         description: Category deleted
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.delete('/categories/:id', authenticateUser, HasPermission([SupportPermissionsEnum.EDIT_TICKETS]), supportController.deleteCategory);

// ─── SLA Configuration ────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/support/sla-configs:
 *   get:
 *     summary: Get SLA configurations
 *     description: Returns SLA time targets by priority
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of SLA configs
 *       500:
 *         description: Server error
 */
router.get('/sla-configs', authenticateUser, HasPermission([SupportPermissionsEnum.VIEW_TICKETS]), supportController.getSLAConfigs);

/**
 * @swagger
 * /api/support/sla-configs:
 *   post:
 *     summary: Create SLA configuration
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - priority
 *               - responseTimeHours
 *               - resolutionTimeHours
 *             properties:
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *               responseTimeHours:
 *                 type: integer
 *                 description: Target response time in hours
 *               resolutionTimeHours:
 *                 type: integer
 *                 description: Target resolution time in hours
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: SLA config created
 *       500:
 *         description: Server error
 */
router.post('/sla-configs', authenticateUser, HasPermission([SupportPermissionsEnum.EDIT_TICKETS]), supportController.createSLAConfig);

/**
 * @swagger
 * /api/support/sla-configs/{id}:
 *   put:
 *     summary: Update SLA configuration
 *     tags: [Support]
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
 *               responseTimeHours:
 *                 type: integer
 *               resolutionTimeHours:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: SLA config updated
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.put('/sla-configs/:id', authenticateUser, HasPermission([SupportPermissionsEnum.EDIT_TICKETS]), supportController.updateSLAConfig);

/**
 * @swagger
 * /api/support/sla-configs/{id}:
 *   delete:
 *     summary: Delete SLA configuration
 *     tags: [Support]
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
 *         description: SLA config deleted
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.delete('/sla-configs/:id', authenticateUser, HasPermission([SupportPermissionsEnum.EDIT_TICKETS]), supportController.deleteSLAConfig);

export default router;
