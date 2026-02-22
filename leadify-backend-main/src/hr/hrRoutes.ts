import express from 'express';
import hrController from './hrController';
import { authenticateUser } from '../middleware/authMiddleware';

/**
 * @swagger
 * tags:
 *   name: HR
 *   description: HR operations — attendance tracking, leave management
 */

const router = express.Router();

// ─── Attendance ───────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/hr/attendance:
 *   get:
 *     summary: List attendance records
 *     description: Returns paginated attendance records with optional date and status filters
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 30
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by specific date
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PRESENT, ABSENT, LATE, HALF_DAY, ON_LEAVE]
 *       - in: query
 *         name: searchKey
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated attendance list with user details
 *       500:
 *         description: Server error
 */
router.get('/attendance', authenticateUser, hrController.getAttendance);

/**
 * @swagger
 * /api/hr/attendance/check-in:
 *   post:
 *     summary: Check in (clock in)
 *     description: Records check-in time for the authenticated user
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Check-in recorded
 *       400:
 *         description: Already checked in today
 *       500:
 *         description: Server error
 */
router.post('/attendance/check-in', authenticateUser, hrController.checkIn);

/**
 * @swagger
 * /api/hr/attendance/check-out:
 *   post:
 *     summary: Check out (clock out)
 *     description: Records check-out time for the authenticated user
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Check-out recorded
 *       400:
 *         description: No active check-in found
 *       500:
 *         description: Server error
 */
router.post('/attendance/check-out', authenticateUser, hrController.checkOut);

/**
 * @swagger
 * /api/hr/attendance:
 *   post:
 *     summary: Create attendance record (manual)
 *     description: Manually create an attendance record for any user (admin use)
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - date
 *               - status
 *             properties:
 *               userId:
 *                 type: integer
 *               date:
 *                 type: string
 *                 format: date
 *               checkIn:
 *                 type: string
 *                 example: "09:00:00"
 *                 description: Time in HH:MM:SS format
 *               checkOut:
 *                 type: string
 *                 example: "17:00:00"
 *               status:
 *                 type: string
 *                 enum: [PRESENT, ABSENT, LATE, HALF_DAY, ON_LEAVE]
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Attendance record created
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/attendance', authenticateUser, hrController.createAttendance);

/**
 * @swagger
 * /api/hr/attendance/{id}:
 *   put:
 *     summary: Update attendance record
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *               date:
 *                 type: string
 *                 format: date
 *               checkIn:
 *                 type: string
 *                 example: "09:00:00"
 *               checkOut:
 *                 type: string
 *                 example: "17:00:00"
 *               status:
 *                 type: string
 *                 enum: [PRESENT, ABSENT, LATE, HALF_DAY, ON_LEAVE]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Attendance updated
 *       404:
 *         description: Record not found
 *       500:
 *         description: Server error
 */
router.put('/attendance/:id', authenticateUser, hrController.updateAttendance);

/**
 * @swagger
 * /api/hr/attendance/{id}:
 *   delete:
 *     summary: Delete attendance record
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Attendance deleted
 *       404:
 *         description: Record not found
 *       500:
 *         description: Server error
 */
router.delete('/attendance/:id', authenticateUser, hrController.deleteAttendance);

// ─── Leave Requests ───────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/hr/leave-requests:
 *   get:
 *     summary: List leave requests
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, CANCELLED]
 *       - in: query
 *         name: leaveType
 *         schema:
 *           type: string
 *           enum: [ANNUAL, SICK, PERSONAL, UNPAID, MATERNITY, EMERGENCY]
 *       - in: query
 *         name: searchKey
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated leave request list
 *       500:
 *         description: Server error
 */
router.get('/leave-requests', authenticateUser, hrController.getLeaveRequests);

/**
 * @swagger
 * /api/hr/leave-requests/{id}:
 *   get:
 *     summary: Get leave request by ID
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Leave request details
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.get('/leave-requests/:id', authenticateUser, hrController.getLeaveRequestById);

/**
 * @swagger
 * /api/hr/leave-requests:
 *   post:
 *     summary: Create leave request
 *     description: Submit a leave request for the authenticated user
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - leaveType
 *               - startDate
 *               - endDate
 *             properties:
 *               leaveType:
 *                 type: string
 *                 enum: [ANNUAL, SICK, PERSONAL, UNPAID, MATERNITY, EMERGENCY]
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Leave request created in PENDING status
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/leave-requests', authenticateUser, hrController.createLeaveRequest);

/**
 * @swagger
 * /api/hr/leave-requests/{id}/approve:
 *   patch:
 *     summary: Approve leave request
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Leave request approved
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.patch('/leave-requests/:id/approve', authenticateUser, hrController.approveLeaveRequest);

/**
 * @swagger
 * /api/hr/leave-requests/{id}/reject:
 *   patch:
 *     summary: Reject leave request
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Rejection reason
 *     responses:
 *       200:
 *         description: Leave request rejected
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.patch('/leave-requests/:id/reject', authenticateUser, hrController.rejectLeaveRequest);

/**
 * @swagger
 * /api/hr/leave-requests/{id}/cancel:
 *   patch:
 *     summary: Cancel leave request
 *     description: Cancel own leave request (before approval)
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Leave request cancelled
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.patch('/leave-requests/:id/cancel', authenticateUser, hrController.cancelLeaveRequest);

/**
 * @swagger
 * /api/hr/leave-requests/{id}:
 *   delete:
 *     summary: Delete leave request
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Leave request deleted
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.delete('/leave-requests/:id', authenticateUser, hrController.deleteLeaveRequest);

export default router;
