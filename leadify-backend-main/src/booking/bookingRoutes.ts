import express from 'express';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { BookingPermissionsEnum } from '../role/roleEnum';
import c from './bookingController';

const router = express.Router();

router.get('/slots', authenticateUser, HasPermission([BookingPermissionsEnum.VIEW_BOOKINGS]), c.getSlots);
router.post('/slots', authenticateUser, HasPermission([BookingPermissionsEnum.MANAGE_SLOTS]), c.createSlot);
router.delete('/slots/:id', authenticateUser, HasPermission([BookingPermissionsEnum.MANAGE_SLOTS]), c.deleteSlot);
router.get('/availability', authenticateUser, HasPermission([BookingPermissionsEnum.VIEW_BOOKINGS]), c.checkAvailability);
router.get('/available-slots', authenticateUser, HasPermission([BookingPermissionsEnum.VIEW_BOOKINGS]), c.getAvailableSlots);
router.get('/upcoming', authenticateUser, HasPermission([BookingPermissionsEnum.VIEW_BOOKINGS]), c.getUpcomingBookings);
router.get('/', authenticateUser, HasPermission([BookingPermissionsEnum.VIEW_BOOKINGS]), c.getBookings);
router.post('/', authenticateUser, HasPermission([BookingPermissionsEnum.CREATE_BOOKINGS]), c.createBooking);
router.post('/validated', authenticateUser, HasPermission([BookingPermissionsEnum.CREATE_BOOKINGS]), c.createBookingWithValidation);
router.put('/:id', authenticateUser, HasPermission([BookingPermissionsEnum.EDIT_BOOKINGS]), c.updateBooking);
router.put('/:id/cancel', authenticateUser, HasPermission([BookingPermissionsEnum.EDIT_BOOKINGS]), c.cancelBooking);
router.delete('/:id', authenticateUser, HasPermission([BookingPermissionsEnum.DELETE_BOOKINGS]), c.deleteBooking);

export default router;
