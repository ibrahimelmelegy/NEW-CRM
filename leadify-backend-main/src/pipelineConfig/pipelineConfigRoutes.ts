import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware';
import pipelineConfigController from './pipelineConfigController';

const router = express.Router();

router.get('/', authenticateUser, pipelineConfigController.getStages);
router.post('/', authenticateUser, pipelineConfigController.createStage);
router.put('/:id', authenticateUser, pipelineConfigController.updateStage);
router.delete('/:id', authenticateUser, pipelineConfigController.deleteStage);
router.post('/reorder', authenticateUser, pipelineConfigController.reorderStages);

export default router;
