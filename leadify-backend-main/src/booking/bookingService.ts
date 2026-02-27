import { Op } from 'sequelize';
import { BookingSlot, Booking } from './bookingModel';
import User from '../user/userModel';
import Client from '../client/clientModel';
import { clampPagination } from '../utils/pagination';

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

  async createBooking(data: any, tenantId?: string) { return Booking.create({ ...data, tenantId }); }

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
}
export default new BookingService();
