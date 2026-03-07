import { Router } from 'express';
import virtualOfficeController from './virtualOfficeController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateUser);

router.get('/', virtualOfficeController.getRooms);
router.get('/rooms', virtualOfficeController.getRooms);
router.post('/rooms', virtualOfficeController.createRoom);
router.patch('/rooms/:id', virtualOfficeController.updateRoom);
router.delete('/rooms/:id', virtualOfficeController.deleteRoom);

export default router;
