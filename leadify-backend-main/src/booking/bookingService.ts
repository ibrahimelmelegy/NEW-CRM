import { Op } from 'sequelize';
import { BookingSlot, Booking } from './bookingModel';
import User from '../user/userModel';
import Client from '../client/clientModel';
import { clampPagination } from '../utils/pagination';
import { io } from '../server';

/** Convert "HH:MM" to total minutes since midnight */
function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/** Convert total minutes back to "HH:MM" */
function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60).toString().padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

class BookingService {
  async createSlot(data: any, tenantId?: string) { return BookingSlot.create({ ...data, tenantId }); }

  async getSlots(query: any, tenantId?: string) {
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.staffId) where.staffId = query.staffId;
    const slots = await BookingSlot.findAll({
      where,
      include: [{ model: User, as: 'staff', attributes: ['id', 'name'] }],
      order: [['dayOfWeek', 'ASC'], ['startTime', 'ASC']]
    });
    return slots;
  }

  async deleteSlot(id: number) {
    const slot = await BookingSlot.findByPk(id);
    if (!slot) return false;
    await slot.destroy();
    return true;
  }

  async createBooking(data: any, tenantId?: string) {
    const booking = await Booking.create({ ...data, tenantId });
    try { io.emit('booking:created', { id: booking.id, staffId: booking.staffId, date: booking.date, startTime: booking.startTime }); } catch {}
    return booking;
  }

  async getBookings(query: any, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.status) where.status = query.status;
    if (query.staffId) where.staffId = query.staffId;
    if (query.date) where.date = query.date;
    if (query.dateFrom && query.dateTo) where.date = { [Op.between]: [query.dateFrom, query.dateTo] };
    if (query.search) where[Op.or] = [
      { clientName: { [Op.iLike]: `%${query.search}%` } },
      { clientEmail: { [Op.iLike]: `%${query.search}%` } }
    ];

    const { rows, count } = await Booking.findAndCountAll({
      where,
      include: [
        { model: User, as: 'staff', attributes: ['id', 'name', 'email'] },
        { model: Client, as: 'client', attributes: ['id', 'name', 'email'] }
      ],
      order: [['date', 'DESC'], ['startTime', 'ASC']], limit, offset, distinct: true
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async updateBooking(id: number, data: any) {
    const booking = await Booking.findByPk(id);
    if (!booking) return null;
    await booking.update(data);
    return booking;
  }

  async deleteBooking(id: number) {
    const booking = await Booking.findByPk(id);
    if (!booking) return false;
    await booking.destroy();
    return true;
  }

  // ─── Business Logic ──────────────────────────────────────────────────────────

  /**
   * Check whether a staff member is available for a given date/time window.
   * Returns { available, conflicts } where conflicts lists overlapping bookings.
   */
  async checkAvailability(staffId: number, date: string, startTime: string, endTime: string) {
    const reqStart = timeToMinutes(startTime);
    const reqEnd = timeToMinutes(endTime);

    // Find all non-cancelled bookings for this staff on this date
    const existingBookings = await Booking.findAll({
      where: {
        staffId,
        date,
        status: { [Op.notIn]: ['CANCELLED'] }
      },
      order: [['startTime', 'ASC']]
    });

    // Detect time overlaps: two intervals overlap when each starts before the other ends
    const conflicts = existingBookings.filter(b => {
      const bStart = timeToMinutes(b.startTime);
      const bEnd = timeToMinutes(b.endTime);
      return reqStart < bEnd && bStart < reqEnd;
    });

    return { available: conflicts.length === 0, conflicts };
  }

  /**
   * Create a booking only if the staff member is available.
   * Throws an error with conflict details when overlapping bookings exist.
   */
  async createBookingWithValidation(data: any, tenantId?: string) {
    const { staffId, date, startTime, endTime } = data;
    if (!staffId || !date || !startTime || !endTime) {
      throw new Error('staffId, date, startTime, and endTime are required');
    }

    const { available, conflicts } = await this.checkAvailability(staffId, date, startTime, endTime);
    if (!available) {
      const conflictDetails = conflicts.map(c => ({
        id: c.id,
        startTime: c.startTime,
        endTime: c.endTime,
        clientName: c.clientName
      }));
      const err: any = new Error('Time slot is not available — conflicts with existing bookings');
      err.statusCode = 409;
      err.conflicts = conflictDetails;
      throw err;
    }

    const booking = await Booking.create({ ...data, tenantId });
    try { io.emit('booking:created', { id: booking.id, staffId: booking.staffId, date: booking.date, startTime: booking.startTime }); } catch {}
    return booking;
  }

  /**
   * Return available time slots for a staff member on a given date.
   * Business hours default to 09:00 – 17:00 (configurable via optional params).
   * Slots are produced in 30-minute increments that do not overlap existing bookings.
   */
  async getAvailableSlots(staffId: number, date: string, businessStart = '09:00', businessEnd = '17:00', slotDuration = 30) {
    const dayStart = timeToMinutes(businessStart);
    const dayEnd = timeToMinutes(businessEnd);

    // Fetch confirmed / active bookings for the staff on this date
    const existingBookings = await Booking.findAll({
      where: {
        staffId,
        date,
        status: { [Op.notIn]: ['CANCELLED'] }
      },
      order: [['startTime', 'ASC']]
    });

    const booked = existingBookings.map(b => ({
      start: timeToMinutes(b.startTime),
      end: timeToMinutes(b.endTime)
    }));

    const available: Array<{ startTime: string; endTime: string }> = [];
    let cursor = dayStart;

    while (cursor + slotDuration <= dayEnd) {
      const slotEnd = cursor + slotDuration;
      const hasConflict = booked.some(b => cursor < b.end && b.start < slotEnd);
      if (!hasConflict) {
        available.push({ startTime: minutesToTime(cursor), endTime: minutesToTime(slotEnd) });
      }
      cursor += slotDuration;
    }

    return { date, staffId, businessHours: { start: businessStart, end: businessEnd }, slotDuration, available };
  }

  /**
   * Cancel a booking by setting its status to CANCELLED.
   */
  async cancelBooking(id: number) {
    const booking = await Booking.findByPk(id);
    if (!booking) return null;
    if (booking.status === 'CANCELLED') return booking; // already cancelled
    await booking.update({ status: 'CANCELLED' });
    try { io.emit('booking:cancelled', { id: booking.id, staffId: booking.staffId, date: booking.date }); } catch {}
    return booking;
  }

  /**
   * Return upcoming (today and forward) bookings for a staff member, ordered chronologically.
   */
  async getUpcomingBookings(staffId: number, tenantId?: string) {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const where: any = {
      staffId,
      date: { [Op.gte]: today },
      status: { [Op.notIn]: ['CANCELLED'] }
    };
    if (tenantId) where.tenantId = tenantId;

    const bookings = await Booking.findAll({
      where,
      include: [
        { model: User, as: 'staff', attributes: ['id', 'name', 'email'] },
        { model: Client, as: 'client', attributes: ['id', 'name', 'email'] }
      ],
      order: [['date', 'ASC'], ['startTime', 'ASC']]
    });
    return bookings;
  }
}
export default new BookingService();
