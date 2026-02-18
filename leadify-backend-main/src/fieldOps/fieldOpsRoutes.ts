import express from 'express';
import fieldOpsController from './fieldOpsController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', authenticateUser, fieldOpsController.getCheckIns);
router.post('/', authenticateUser, fieldOpsController.createCheckIn);
router.get('/my-history', authenticateUser, fieldOpsController.getUserHistory);
router.get('/team-locations', authenticateUser, fieldOpsController.getTeamLocations);

export default router;
