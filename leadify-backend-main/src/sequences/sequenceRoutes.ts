import { Router } from 'express';
import sequenceController from './sequenceController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Sequence
 *   description: Automated sequences and enrollment management
 */

// Sequence CRUD

/**
 * @swagger
 * /api/sequences:
 *   get:
 *     summary: Get all sequences with pagination and search
 *     tags: [Sequence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: searchKey
 *         schema:
 *           type: string
 *         description: Search by name or description
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Paginated list of sequences
 */
router.get('/', authenticateUser, sequenceController.getSequences);

/**
 * @swagger
 * /api/sequences:
 *   post:
 *     summary: Create a new sequence
 *     tags: [Sequence]
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
 *               steps:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     order:
 *                       type: integer
 *                     type:
 *                       type: string
 *                     subject:
 *                       type: string
 *                     body:
 *                       type: string
 *                     delayDays:
 *                       type: integer
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Sequence created successfully
 */
router.post('/', authenticateUser, sequenceController.createSequence);

/**
 * @swagger
 * /api/sequences/{id}:
 *   put:
 *     summary: Update an existing sequence
 *     tags: [Sequence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Sequence ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               steps:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     order:
 *                       type: integer
 *                     type:
 *                       type: string
 *                     subject:
 *                       type: string
 *                     body:
 *                       type: string
 *                     delayDays:
 *                       type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Sequence updated successfully
 */
router.put('/:id', authenticateUser, sequenceController.updateSequence);

/**
 * @swagger
 * /api/sequences/{id}:
 *   delete:
 *     summary: Delete a sequence and its enrollments
 *     tags: [Sequence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Sequence ID
 *     responses:
 *       200:
 *         description: Sequence deleted successfully
 */
router.delete('/:id', authenticateUser, sequenceController.deleteSequence);

// Enrollment routes

/**
 * @swagger
 * /api/sequences/{id}/enroll:
 *   post:
 *     summary: Enroll an entity into a sequence
 *     tags: [Sequence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Sequence ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - entityType
 *               - entityId
 *             properties:
 *               entityType:
 *                 type: string
 *                 description: Type of entity to enroll (e.g. lead, contact)
 *               entityId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the entity to enroll
 *     responses:
 *       201:
 *         description: Entity enrolled successfully
 */
router.post('/:id/enroll', authenticateUser, sequenceController.enrollEntity);

/**
 * @swagger
 * /api/sequences/enrollments/{id}/advance:
 *   patch:
 *     summary: Advance an enrollment to the next step
 *     tags: [Sequence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Enrollment ID
 *     responses:
 *       200:
 *         description: Enrollment advanced to next step
 */
router.patch('/enrollments/:id/advance', authenticateUser, sequenceController.advanceStep);

/**
 * @swagger
 * /api/sequences/enrollments/{id}/pause:
 *   patch:
 *     summary: Pause an active enrollment
 *     tags: [Sequence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Enrollment ID
 *     responses:
 *       200:
 *         description: Enrollment paused successfully
 */
router.patch('/enrollments/:id/pause', authenticateUser, sequenceController.pauseEnrollment);

/**
 * @swagger
 * /api/sequences/enrollments/{id}/resume:
 *   patch:
 *     summary: Resume a paused enrollment
 *     tags: [Sequence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Enrollment ID
 *     responses:
 *       200:
 *         description: Enrollment resumed successfully
 */
router.patch('/enrollments/:id/resume', authenticateUser, sequenceController.resumeEnrollment);

/**
 * @swagger
 * /api/sequences/{id}/enrollments:
 *   get:
 *     summary: Get all enrollments for a sequence
 *     tags: [Sequence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Sequence ID
 *     responses:
 *       200:
 *         description: List of enrollments for the sequence
 */
router.get('/:id/enrollments', authenticateUser, sequenceController.getEnrollments);

/**
 * @swagger
 * /api/sequences/{id}/stats:
 *   get:
 *     summary: Get statistics for a sequence
 *     tags: [Sequence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Sequence ID
 *     responses:
 *       200:
 *         description: Sequence statistics (total, active, paused, completed, cancelled enrollments)
 */
router.get('/:id/stats', authenticateUser, sequenceController.getStats);

export default router;
