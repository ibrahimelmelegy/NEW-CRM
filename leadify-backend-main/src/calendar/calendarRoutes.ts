import express from 'express';
import calendarController from './calendarController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', authenticateUser, calendarController.getEvents);
router.post('/', authenticateUser, calendarController.createEvent);
router.get('/:id', authenticateUser, calendarController.getEventById);
router.put('/:id', authenticateUser, calendarController.updateEvent);
router.delete('/:id', authenticateUser, calendarController.deleteEvent);

export default router;
