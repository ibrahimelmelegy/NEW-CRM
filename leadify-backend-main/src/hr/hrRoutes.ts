import express from 'express';
import hrController from './hrController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

// Attendance
router.get('/attendance', authenticateUser, hrController.getAttendance);
router.post('/attendance/check-in', authenticateUser, hrController.checkIn);
router.post('/attendance/check-out', authenticateUser, hrController.checkOut);
router.post('/attendance', authenticateUser, hrController.createAttendance);
router.put('/attendance/:id', authenticateUser, hrController.updateAttendance);
router.delete('/attendance/:id', authenticateUser, hrController.deleteAttendance);

// Leave Requests
router.get('/leave-requests', authenticateUser, hrController.getLeaveRequests);
router.get('/leave-requests/:id', authenticateUser, hrController.getLeaveRequestById);
router.post('/leave-requests', authenticateUser, hrController.createLeaveRequest);
router.patch('/leave-requests/:id/approve', authenticateUser, hrController.approveLeaveRequest);
router.patch('/leave-requests/:id/reject', authenticateUser, hrController.rejectLeaveRequest);
router.patch('/leave-requests/:id/cancel', authenticateUser, hrController.cancelLeaveRequest);
router.delete('/leave-requests/:id', authenticateUser, hrController.deleteLeaveRequest);

export default router;
