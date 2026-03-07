import { Router } from 'express';
import plannerController from './plannerController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateUser);

// Planner Tasks
router.get('/', plannerController.getTasksByDate);
router.get('/tasks', plannerController.getTasksByDate);
router.post('/tasks', plannerController.createTask);
router.patch('/tasks/:id', plannerController.updateTask);
router.patch('/tasks/:id/toggle', plannerController.toggleComplete);
router.delete('/tasks/:id', plannerController.deleteTask);
router.get('/stats', plannerController.getStats);

// Focus Sessions
router.post('/focus', plannerController.startFocus);
router.patch('/focus/:id/end', plannerController.endFocus);
router.get('/focus', plannerController.getFocusByDate);

// Daily Habits
router.get('/habits', plannerController.getHabits);
router.post('/habits', plannerController.createHabit);
router.patch('/habits/:id/toggle', plannerController.toggleHabit);
router.delete('/habits/:id', plannerController.deleteHabit);

export default router;
