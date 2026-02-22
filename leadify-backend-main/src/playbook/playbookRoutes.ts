import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware';
import playbookController from './playbookController';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Playbook
 *   description: Sales playbooks with stages, steps, and tips
 */

/**
 * @swagger
 * /api/playbook:
 *   get:
 *     summary: Get all playbooks
 *     tags: [Playbook]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of playbooks
 */
router.get('/', authenticateUser, playbookController.getPlaybooks);

/**
 * @swagger
 * /api/playbook/{id}:
 *   get:
 *     summary: Get a playbook by ID
 *     tags: [Playbook]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Playbook ID
 *     responses:
 *       200:
 *         description: Playbook details
 */
router.get('/:id', authenticateUser, playbookController.getPlaybook);

/**
 * @swagger
 * /api/playbook:
 *   post:
 *     summary: Create a new playbook
 *     tags: [Playbook]
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
 *               - stages
 *             properties:
 *               name:
 *                 type: string
 *                 description: Playbook name
 *               description:
 *                 type: string
 *                 description: Playbook description
 *               isActive:
 *                 type: boolean
 *                 description: Whether the playbook is active
 *               stages:
 *                 type: array
 *                 description: Ordered list of playbook stages
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                     - name
 *                     - description
 *                     - order
 *                     - steps
 *                     - tips
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Stage UUID
 *                     name:
 *                       type: string
 *                       description: Stage name
 *                     description:
 *                       type: string
 *                       description: Stage description
 *                     order:
 *                       type: integer
 *                       description: Stage order
 *                     steps:
 *                       type: array
 *                       items:
 *                         type: object
 *                         required:
 *                           - id
 *                           - title
 *                           - description
 *                           - estimatedMinutes
 *                         properties:
 *                           id:
 *                             type: string
 *                             description: Step UUID
 *                           title:
 *                             type: string
 *                             description: Step title
 *                           description:
 *                             type: string
 *                             description: Step description
 *                           estimatedMinutes:
 *                             type: integer
 *                             description: Estimated time in minutes
 *                           resources:
 *                             type: array
 *                             items:
 *                               type: string
 *                             description: Optional resource links
 *                     tips:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Tips for this stage
 *     responses:
 *       201:
 *         description: Playbook created successfully
 */
router.post('/', authenticateUser, playbookController.createPlaybook);

/**
 * @swagger
 * /api/playbook/{id}:
 *   put:
 *     summary: Update a playbook
 *     tags: [Playbook]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Playbook ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Playbook name
 *               description:
 *                 type: string
 *                 description: Playbook description
 *               isActive:
 *                 type: boolean
 *                 description: Whether the playbook is active
 *               stages:
 *                 type: array
 *                 description: Ordered list of playbook stages
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     order:
 *                       type: integer
 *                     steps:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           description:
 *                             type: string
 *                           estimatedMinutes:
 *                             type: integer
 *                           resources:
 *                             type: array
 *                             items:
 *                               type: string
 *                     tips:
 *                       type: array
 *                       items:
 *                         type: string
 *     responses:
 *       200:
 *         description: Playbook updated successfully
 */
router.put('/:id', authenticateUser, playbookController.updatePlaybook);

/**
 * @swagger
 * /api/playbook/{id}:
 *   delete:
 *     summary: Delete a playbook
 *     tags: [Playbook]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Playbook ID
 *     responses:
 *       200:
 *         description: Playbook deleted successfully
 */
router.delete('/:id', authenticateUser, playbookController.deletePlaybook);

export default router;
