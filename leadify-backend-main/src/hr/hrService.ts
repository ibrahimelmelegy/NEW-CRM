import { Op } from 'sequelize';
import { clampPagination } from '../utils/pagination';
import Attendance from './attendanceModel';
import LeaveRequest from './leaveRequestModel';
import User from '../user/userModel';

class HRService {
  // Attendance
  async getAttendance(query: any) {
    const { page, limit, offset } = clampPagination(query, 30);
    const { userId, date, startDate, endDate, status, searchKey, sortBy, sort } = query;
    const where: any = {};
    if (userId) where.userId = userId;
    if (date) where.date = date;
    if (status) where.status = status;
    if (startDate && endDate) where.date = { [Op.between]: [startDate, endDate] };

    const { rows, count } = await Attendance.findAndCountAll({
      where,
      include: [{ model: User, attributes: ['id', 'name', 'profilePicture'] }],
      order: [
        ['date', 'DESC'],
        ['checkIn', 'ASC']
      ],
      limit,
      offset
    });

    return {
      docs: rows,
      pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) }
    };
  }

  async checkIn(userId: number) {
    const today = new Date().toISOString().split('T')[0];
    let record = await Attendance.findOne({ where: { userId, date: today } });
    if (record && record.checkIn) throw new Error('Already checked in today');

    const now = new Date().toTimeString().split(' ')[0]!;
    if (!record) {
      record = await Attendance.create({ userId, date: today, checkIn: now, status: 'PRESENT' });
    } else {
      await record.update({ checkIn: now, status: 'PRESENT' });
    }
    return record;
  }

  async checkOut(userId: number) {
    const today = new Date().toISOString().split('T')[0];
    const record = await Attendance.findOne({ where: { userId, date: today } });
    if (!record || !record.checkIn) throw new Error('No check-in found for today');
    if (record.checkOut) throw new Error('Already checked out today');

    const now = new Date().toTimeString().split(' ')[0]!;
    await record.update({ checkOut: now });
    return record;
  }

  async createAttendance(data: any) {
    return Attendance.create(data);
  }

  async updateAttendance(id: number, data: any) {
    const record = await Attendance.findByPk(id);
    if (!record) throw new Error('Attendance record not found');
    return record.update(data);
  }

  async deleteAttendance(id: number) {
    const record = await Attendance.findByPk(id);
    if (!record) throw new Error('Attendance record not found');
    await record.destroy();
    return { deleted: true };
  }

  // Leave Requests
  async getLeaveRequestById(id: number) {
    const request = await LeaveRequest.findByPk(id, {
      include: [{ model: User, attributes: ['id', 'name', 'profilePicture'] }]
    });
    if (!request) throw new Error('Leave request not found');
    return request;
  }

  async getLeaveRequests(query: any) {
    const { page, limit, offset } = clampPagination(query, 20);
    const { userId, status, leaveType, searchKey, sortBy, sort } = query;
    const where: any = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;
    if (leaveType) where.leaveType = leaveType;

    const { rows, count } = await LeaveRequest.findAndCountAll({
      where,
      include: [{ model: User, attributes: ['id', 'name', 'profilePicture'] }],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    return {
      docs: rows,
      pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) }
    };
  }

  async createLeaveRequest(data: any, userId: number) {
    return LeaveRequest.create({ ...data, userId });
  }

  async approveLeaveRequest(id: number, approvedBy: number) {
    const request = await LeaveRequest.findByPk(id);
    if (!request) throw new Error('Leave request not found');
    if (request.status !== 'PENDING') throw new Error('Request is not pending');
    return request.update({ status: 'APPROVED', approvedBy });
  }

  async rejectLeaveRequest(id: number, rejectionReason: string) {
    const request = await LeaveRequest.findByPk(id);
    if (!request) throw new Error('Leave request not found');
    if (request.status !== 'PENDING') throw new Error('Request is not pending');
    return request.update({ status: 'REJECTED', rejectionReason });
  }

  async cancelLeaveRequest(id: number, userId: number) {
    const request = await LeaveRequest.findByPk(id);
    if (!request) throw new Error('Leave request not found');
    if (request.userId !== userId) throw new Error('Unauthorized');
    if (request.status !== 'PENDING') throw new Error('Only pending requests can be cancelled');
    return request.update({ status: 'CANCELLED' });
  }

  async deleteLeaveRequest(id: number) {
    const request = await LeaveRequest.findByPk(id);
    if (!request) throw new Error('Leave request not found');
    await request.destroy();
    return { deleted: true };
  }
}

export default new HRService();
