import express from 'express';
import forecastController from './forecastController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', authenticateUser, forecastController.getForecasts);
router.get('/period', authenticateUser, forecastController.getByPeriod);
router.get('/user/:userId', authenticateUser, forecastController.getByUser);
router.post('/', authenticateUser, forecastController.create);
router.put('/:id', authenticateUser, forecastController.update);
router.post('/calculate', authenticateUser, forecastController.calculateFromPipeline);

export default router;
