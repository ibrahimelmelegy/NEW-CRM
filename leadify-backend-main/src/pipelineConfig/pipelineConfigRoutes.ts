import express from 'express';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validation';
import { SettingsPermissionsEnum } from '../role/roleEnum';
import pipelineConfigController from './pipelineConfigController';
import { CreateStageInput } from './inputs/createStageInput';
import { UpdateStageInput } from './inputs/updateStageInput';
import { ReorderStagesInput } from './inputs/reorderStagesInput';

/**
 * @swagger
 * tags:
 *   name: Pipeline Config
 *   description: Pipeline stage configuration — create, update, reorder stages
 */

const router = express.Router();

/**
 * @swagger
 * /api/pipeline-config:
 *   get:
 *     summary: List pipeline stages
 *     description: Returns all pipeline stages, optionally filtered by entity type
 *     tags: [Pipeline Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *         description: Filter stages by entity type (e.g. deal, lead)
 *     responses:
 *       200:
 *         description: List of pipeline stages
 *       500:
 *         description: Server error
 */
router.get('/', authenticateUser, HasPermission([SettingsPermissionsEnum.VIEW_SETTINGS]), pipelineConfigController.getStages);

/**
 * @swagger
 * /api/pipeline-config:
 *   post:
 *     summary: Create a pipeline stage
 *     tags: [Pipeline Config]
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
 *             properties:
 *               name:
 *                 type: string
 *               color:
 *                 type: string
 *               probability:
 *                 type: number
 *                 description: Win probability percentage (0-100)
 *               entityType:
 *                 type: string
 *                 description: Entity type this stage belongs to (e.g. deal, lead)
 *               isDefault:
 *                 type: boolean
 *                 default: false
 *               isWon:
 *                 type: boolean
 *                 default: false
 *               isLost:
 *                 type: boolean
 *                 default: false
 *               order:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Stage created
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post(
  '/',
  authenticateUser,
  HasPermission([SettingsPermissionsEnum.EDIT_SETTINGS]),
  validateBody(CreateStageInput),
  pipelineConfigController.createStage
);

/**
 * @swagger
 * /api/pipeline-config/{id}:
 *   put:
 *     summary: Update a pipeline stage
 *     tags: [Pipeline Config]
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
 *               color:
 *                 type: string
 *               probability:
 *                 type: number
 *               isDefault:
 *                 type: boolean
 *               isWon:
 *                 type: boolean
 *               isLost:
 *                 type: boolean
 *               order:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Stage updated
 *       404:
 *         description: Stage not found
 *       500:
 *         description: Server error
 */
router.put(
  '/:id',
  authenticateUser,
  HasPermission([SettingsPermissionsEnum.EDIT_SETTINGS]),
  validateBody(UpdateStageInput),
  pipelineConfigController.updateStage
);

/**
 * @swagger
 * /api/pipeline-config/{id}:
 *   delete:
 *     summary: Delete a pipeline stage
 *     tags: [Pipeline Config]
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
 *         description: Stage deleted
 *       404:
 *         description: Stage not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticateUser, HasPermission([SettingsPermissionsEnum.EDIT_SETTINGS]), pipelineConfigController.deleteStage);

/**
 * @swagger
 * /api/pipeline-config/reorder:
 *   post:
 *     summary: Reorder pipeline stages
 *     description: Sets the display order of stages for an entity type
 *     tags: [Pipeline Config]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - entityType
 *               - stageIds
 *             properties:
 *               entityType:
 *                 type: string
 *                 description: Entity type (e.g. deal, lead)
 *               stageIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Ordered array of stage IDs
 *     responses:
 *       200:
 *         description: Stages reordered
 *       500:
 *         description: Server error
 */
router.post(
  '/reorder',
  authenticateUser,
  HasPermission([SettingsPermissionsEnum.EDIT_SETTINGS]),
  validateBody(ReorderStagesInput),
  pipelineConfigController.reorderStages
);

export default router;
