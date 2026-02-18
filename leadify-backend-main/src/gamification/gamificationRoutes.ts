import { Router } from 'express';
import gamificationController from './gamificationController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticateUser, gamificationController.getLeaderboard);
router.get('/my-points', authenticateUser, gamificationController.getMyPoints);
router.post('/award', authenticateUser, gamificationController.awardPoints);
router.get('/achievements', authenticateUser, gamificationController.getAchievements);
router.post('/achievements', authenticateUser, gamificationController.createAchievement);
router.delete('/achievements/:id', authenticateUser, gamificationController.deleteAchievement);
router.get('/achievements/me', authenticateUser, gamificationController.getMyAchievements);
router.get('/challenges', authenticateUser, gamificationController.getChallenges);

export default router;
