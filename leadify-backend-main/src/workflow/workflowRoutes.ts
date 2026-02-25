import express from 'express';
import workflowController from './workflowController';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { SettingsPermissionsEnum } from '../role/roleEnum';

/**
 * @swagger
 * tags:
 *   name: Workflow
 *   description: Workflow automation — rules, triggers, conditions, actions, execution logs
 */

const router = express.Router();

// ── Rules CRUD ──

/**
 * @swagger
 * /api/workflows:
 *   get:
 *     summary: List workflow rules
 *     tags: [Workflow]
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
 *         name: entityType
 *         schema:
 *           type: string
 *           enum: [lead, deal, client, opportunity, invoice, contract, purchaseOrder, ticket, expense, task]
 *       - in: query
 *         name: triggerType
 *         schema:
 *           type: string
 *           enum: [ON_CREATE, ON_UPDATE, ON_DELETE, ON_FIELD_CHANGE, SCHEDULED, MANUAL]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name and description
 *     responses:
 *       200:
 *         description: Paginated workflow rules
 *       500:
 *         description: Server error
 */
router.get('/', authenticateUser, HasPermission([SettingsPermissionsEnum.VIEW_SETTINGS]), workflowController.getRules);

/**
 * @swagger
 * /api/workflows/rules:
 *   get:
 *     summary: List workflow rules (alias)
 *     tags: [Workflow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *       - in: query
 *         name: triggerType
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated workflow rules
 *       500:
 *         description: Server error
 */
router.get('/rules', authenticateUser, HasPermission([SettingsPermissionsEnum.VIEW_SETTINGS]), workflowController.getRules);

/**
 * @swagger
 * /api/workflows/rules/{id}:
 *   get:
 *     summary: Get workflow rule by ID
 *     tags: [Workflow]
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
 *         description: Workflow rule details
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.get('/rules/:id', authenticateUser, HasPermission([SettingsPermissionsEnum.VIEW_SETTINGS]), workflowController.getRuleById);

/**
 * @swagger
 * /api/workflows/rules:
 *   post:
 *     summary: Create workflow rule
 *     description: Create an automation rule with triggers, conditions, and actions
 *     tags: [Workflow]
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
 *               - triggerType
 *               - actions
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               entityType:
 *                 type: string
 *                 enum: [lead, deal, client, opportunity, invoice, contract, purchaseOrder, ticket, expense, task]
 *               triggerType:
 *                 type: string
 *                 enum: [ON_CREATE, ON_UPDATE, ON_DELETE, ON_FIELD_CHANGE, SCHEDULED, MANUAL]
 *               triggerField:
 *                 type: string
 *                 description: Field to watch (for ON_FIELD_CHANGE trigger)
 *               triggerValue:
 *                 type: string
 *               conditions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     field:
 *                       type: string
 *                     operator:
 *                       type: string
 *                       enum: [equals, not_equals, contains, greater_than, less_than, is_empty, is_not_empty, in, not_in]
 *                     value: {}
 *               conditionLogic:
 *                 type: string
 *                 enum: [AND, OR]
 *                 default: AND
 *               actions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [UPDATE_FIELD, CREATE_RECORD, SEND_EMAIL, SEND_NOTIFICATION, CREATE_TASK, WEBHOOK, ASSIGN_TO, DELAY]
 *                     field:
 *                       type: string
 *                     value:
 *                       type: string
 *                     to:
 *                       type: string
 *                     subject:
 *                       type: string
 *                     body:
 *                       type: string
 *                     url:
 *                       type: string
 *                     method:
 *                       type: string
 *               isActive:
 *                 type: boolean
 *                 default: true
 *               priority:
 *                 type: integer
 *                 default: 0
 *               graphData:
 *                 type: object
 *                 description: Visual node graph configuration
 *     responses:
 *       201:
 *         description: Workflow rule created
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/rules', authenticateUser, HasPermission([SettingsPermissionsEnum.EDIT_SETTINGS]), workflowController.createRule);

/**
 * @swagger
 * /api/workflows/rules/{id}:
 *   put:
 *     summary: Update workflow rule
 *     tags: [Workflow]
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
 *               triggerType:
 *                 type: string
 *                 enum: [ON_CREATE, ON_UPDATE, ON_DELETE, ON_FIELD_CHANGE, SCHEDULED, MANUAL]
 *               triggerField:
 *                 type: string
 *               conditions:
 *                 type: array
 *                 items:
 *                   type: object
 *               conditionLogic:
 *                 type: string
 *                 enum: [AND, OR]
 *               actions:
 *                 type: array
 *                 items:
 *                   type: object
 *               isActive:
 *                 type: boolean
 *               priority:
 *                 type: integer
 *               graphData:
 *                 type: object
 *     responses:
 *       200:
 *         description: Workflow rule updated
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.put('/rules/:id', authenticateUser, HasPermission([SettingsPermissionsEnum.EDIT_SETTINGS]), workflowController.updateRule);

/**
 * @swagger
 * /api/workflows/rules/{id}:
 *   delete:
 *     summary: Delete workflow rule
 *     tags: [Workflow]
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
 *         description: Rule deleted
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.delete('/rules/:id', authenticateUser, HasPermission([SettingsPermissionsEnum.EDIT_SETTINGS]), workflowController.deleteRule);

/**
 * @swagger
 * /api/workflows/rules/{id}/toggle:
 *   patch:
 *     summary: Toggle rule active/inactive
 *     tags: [Workflow]
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
 *         description: Rule toggled
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.patch('/rules/:id/toggle', authenticateUser, HasPermission([SettingsPermissionsEnum.EDIT_SETTINGS]), workflowController.toggleRule);

/**
 * @swagger
 * /api/workflows/rules/{id}/test:
 *   post:
 *     summary: Test rule with sample data
 *     description: Evaluate a rule against sample entity data without executing actions
 *     tags: [Workflow]
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
 *             description: Sample entity data matching the rule's entityType
 *     responses:
 *       200:
 *         description: Test evaluation result
 *       404:
 *         description: Rule not found
 *       500:
 *         description: Server error
 */
router.post('/rules/:id/test', authenticateUser, HasPermission([SettingsPermissionsEnum.EDIT_SETTINGS]), workflowController.testRule);

/**
 * @swagger
 * /api/workflows/rules/{id}/execute:
 *   post:
 *     summary: Manually execute a rule
 *     tags: [Workflow]
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
 *         description: Rule executed
 *       404:
 *         description: Rule not found
 *       500:
 *         description: Server error
 */
router.post('/rules/:id/execute', authenticateUser, HasPermission([SettingsPermissionsEnum.EDIT_SETTINGS]), workflowController.manualExecute);

/**
 * @swagger
 * /api/workflows/templates:
 *   get:
 *     summary: Get workflow templates
 *     description: Returns pre-built workflow templates for common automation scenarios
 *     tags: [Workflow]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of workflow templates
 *       500:
 *         description: Server error
 */
router.get('/templates', authenticateUser, workflowController.getTemplates);

/**
 * @swagger
 * /api/workflows/executions:
 *   get:
 *     summary: List execution logs
 *     description: Returns paginated workflow execution history
 *     tags: [Workflow]
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
 *         name: workflowRuleId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [SUCCESS, PARTIAL, FAILED]
 *     responses:
 *       200:
 *         description: Paginated execution logs
 *       500:
 *         description: Server error
 */
router.get('/executions', authenticateUser, HasPermission([SettingsPermissionsEnum.VIEW_SETTINGS]), workflowController.getExecutions);

/**
 * @swagger
 * /api/workflows/executions/{runId}:
 *   get:
 *     summary: Get execution detail
 *     tags: [Workflow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: runId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Execution detail with action results
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.get('/executions/:runId', authenticateUser, HasPermission([SettingsPermissionsEnum.VIEW_SETTINGS]), workflowController.getExecutionDetail);

/**
 * @swagger
 * /api/workflows/rules/{id}/executions:
 *   get:
 *     summary: Get executions for a specific rule
 *     tags: [Workflow]
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
 *         description: Execution history for the rule
 *       404:
 *         description: Rule not found
 *       500:
 *         description: Server error
 */
router.get(
  '/rules/:id/executions',
  authenticateUser,
  HasPermission([SettingsPermissionsEnum.VIEW_SETTINGS]),
  workflowController.getExecutionsForRule
);

export default router;
