import express from 'express';
import taskController from './taskController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Tasks & Reminders management - link tasks to any CRM record
 */

// ** --------------------- GET --------------------- **

/**
 * @swagger
 * /api/tasks/my:
 *   get:
 *     summary: Get tasks assigned to the current user
 *     tags: [Tasks]
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
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, IN_PROGRESS, COMPLETED, CANCELLED]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, URGENT]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, dueDate, priority, status, title, updatedAt]
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *     responses:
 *       200:
 *         description: Paginated list of user's tasks
 */
router.get('/my', authenticateUser, taskController.getMyTasks);

/**
 * @swagger
 * /api/tasks/stats:
 *   get:
 *     summary: Get task statistics (counts by status, overdue, due today)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Optional user ID to filter stats for a specific user
 *     responses:
 *       200:
 *         description: Task statistics
 */
router.get('/stats', authenticateUser, taskController.getTaskStats);

/**
 * @swagger
 * /api/tasks/overdue:
 *   get:
 *     summary: Get all overdue tasks
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of overdue tasks
 */
router.get('/overdue', authenticateUser, taskController.getOverdueTasks);

/**
 * @swagger
 * /api/tasks/entity/{entityType}/{entityId}:
 *   get:
 *     summary: Get tasks linked to a specific record (lead, deal, client, etc.)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *         description: Type of entity (lead, deal, client, opportunity, project, invoice, contract)
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the entity
 *     responses:
 *       200:
 *         description: List of tasks for the entity
 */
router.get('/entity/:entityType/:entityId', authenticateUser, taskController.getTasksByEntity);

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: List all tasks with filters and pagination
 *     tags: [Tasks]
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
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, IN_PROGRESS, COMPLETED, CANCELLED]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, URGENT]
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: integer
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *       - in: query
 *         name: entityId
 *         schema:
 *           type: string
 *       - in: query
 *         name: dueDateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dueDateTo
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, dueDate, priority, status, title, updatedAt]
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *     responses:
 *       200:
 *         description: Paginated list of tasks
 */
router.get('/', authenticateUser, taskController.getTasks);

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get a single task by ID (includes subtasks)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Task details with subtasks
 *       404:
 *         description: Task not found
 */
router.get('/:id', authenticateUser, taskController.getTaskById);

// ** --------------------- POST --------------------- **

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
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
 *               - assignedTo
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 500
 *                 example: "Follow up with client"
 *               description:
 *                 type: string
 *                 example: "Call the client to discuss proposal feedback"
 *               entityType:
 *                 type: string
 *                 example: "deal"
 *               entityId:
 *                 type: string
 *                 example: "abc-123"
 *               assignedTo:
 *                 type: integer
 *                 example: 3
 *               status:
 *                 type: string
 *                 enum: [PENDING, IN_PROGRESS, COMPLETED, CANCELLED]
 *                 default: PENDING
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *                 default: MEDIUM
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               reminderDate:
 *                 type: string
 *                 format: date-time
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["follow-up", "important"]
 *               recurringPattern:
 *                 type: string
 *                 example: "weekly"
 *               parentTaskId:
 *                 type: integer
 *                 description: ID of parent task (for subtasks)
 *     responses:
 *       201:
 *         description: Task created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', authenticateUser, taskController.createTask);

// ** --------------------- PUT --------------------- **

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Update a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [PENDING, IN_PROGRESS, COMPLETED, CANCELLED]
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *               assignedTo:
 *                 type: integer
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               reminderDate:
 *                 type: string
 *                 format: date-time
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               recurringPattern:
 *                 type: string
 *               parentTaskId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Task updated successfully
 *       404:
 *         description: Task not found
 */
router.put('/:id', authenticateUser, taskController.updateTask);

// ** --------------------- PATCH --------------------- **

/**
 * @swagger
 * /api/tasks/{id}/complete:
 *   patch:
 *     summary: Mark a task as completed
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Task marked as completed
 *       404:
 *         description: Task not found
 */
router.patch('/:id/complete', authenticateUser, taskController.completeTask);

// ** --------------------- DELETE --------------------- **

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete a task and its subtasks
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *       404:
 *         description: Task not found
 */
router.delete('/:id', authenticateUser, taskController.deleteTask);

export default router;
