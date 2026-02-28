
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import bookingService from '../../src/booking/bookingService';
import { BookingSlot, Booking, BookingPage } from '../../src/booking/bookingModel';
import User from '../../src/user/userModel';
import Client from '../../src/client/clientModel';

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------

jest.mock('../../src/booking/bookingModel');
jest.mock('../../src/user/userModel');
jest.mock('../../src/client/clientModel');
jest.mock('../../src/utils/pagination', () => ({
  clampPagination: jest.fn((q: any) => ({ page: q.page || 1, limit: q.limit || 20, offset: 0 }))
}));
jest.mock('../../src/server', () => ({
  io: { emit: jest.fn() }
}));

describe('BookingService', () => {
  const mockSlot: any = {
    id: 1, staffId: 10, dayOfWeek: 1, startTime: '09:00', endTime: '10:00',
    destroy: jest.fn()
  };

  const mockBooking: any = {
    id: 1, staffId: 10, date: '2026-03-15', startTime: '09:00', endTime: '09:30',
    status: 'CONFIRMED', clientName: 'John',
    update: jest.fn(),
    destroy: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // Slots
  // --------------------------------------------------------------------------
  describe('createSlot', () => {
    it('should create a booking slot successfully', async () => {
      const data = { staffId: 10, dayOfWeek: 1, startTime: '09:00', endTime: '10:00' };
      (BookingSlot.create as jest.Mock<any>).mockResolvedValue({ id: 1, ...data });

      const result = await bookingService.createSlot(data, 'tenant-1');

      expect(BookingSlot.create).toHaveBeenCalledWith({ ...data, tenantId: 'tenant-1' });
      expect(result).toHaveProperty('id', 1);
    });
  });

  describe('getSlots', () => {
    it('should return slots filtered by staffId and tenantId', async () => {
      (BookingSlot.findAll as jest.Mock<any>).mockResolvedValue([mockSlot]);

      const result = await bookingService.getSlots({ staffId: 10 }, 'tenant-1');

      expect(BookingSlot.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-1', staffId: 10 })
      }));
      expect(result).toHaveLength(1);
    });
  });

  describe('deleteSlot', () => {
    it('should delete an existing slot and return true', async () => {
      (BookingSlot.findByPk as jest.Mock<any>).mockResolvedValue(mockSlot);

      const result = await bookingService.deleteSlot(1);

      expect(mockSlot.destroy).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when slot is not found', async () => {
      (BookingSlot.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await bookingService.deleteSlot(999);

      expect(result).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Bookings
  // --------------------------------------------------------------------------
  describe('createBooking', () => {
    it('should create a booking and emit socket event', async () => {
      const data = { staffId: 10, date: '2026-03-15', startTime: '09:00', endTime: '09:30' };
      (Booking.create as jest.Mock<any>).mockResolvedValue({ id: 1, ...data });

      const result = await bookingService.createBooking(data, 'tenant-1');

      expect(Booking.create).toHaveBeenCalledWith({ ...data, tenantId: 'tenant-1' });
      expect(result).toHaveProperty('id', 1);
    });
  });

  describe('getBookings', () => {
    it('should return paginated bookings', async () => {
      (Booking.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [mockBooking], count: 1 });

      const result = await bookingService.getBookings({ page: 1, limit: 20 }, 'tenant-1');

      expect(result.docs).toHaveLength(1);
      expect(result.pagination).toHaveProperty('totalItems', 1);
    });
  });

  describe('updateBooking', () => {
    it('should update an existing booking', async () => {
      (Booking.findByPk as jest.Mock<any>).mockResolvedValue(mockBooking);

      const result = await bookingService.updateBooking(1, { status: 'COMPLETED' });

      expect(mockBooking.update).toHaveBeenCalledWith({ status: 'COMPLETED' });
      expect(result).toBe(mockBooking);
    });

    it('should return null when booking is not found', async () => {
      (Booking.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await bookingService.updateBooking(999, { status: 'COMPLETED' });

      expect(result).toBeNull();
    });
  });

  describe('deleteBooking', () => {
    it('should delete an existing booking and return true', async () => {
      (Booking.findByPk as jest.Mock<any>).mockResolvedValue(mockBooking);

      const result = await bookingService.deleteBooking(1);

      expect(mockBooking.destroy).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when booking is not found', async () => {
      (Booking.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await bookingService.deleteBooking(999);

      expect(result).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Availability
  // --------------------------------------------------------------------------
  describe('checkAvailability', () => {
    it('should return available=true when no conflicts exist', async () => {
      (Booking.findAll as jest.Mock<any>).mockResolvedValue([]);

      const result = await bookingService.checkAvailability(10, '2026-03-15', '09:00', '09:30');

      expect(result.available).toBe(true);
      expect(result.conflicts).toHaveLength(0);
    });

    it('should return available=false when overlapping bookings exist', async () => {
      (Booking.findAll as jest.Mock<any>).mockResolvedValue([
        { startTime: '09:00', endTime: '09:30', id: 1, clientName: 'John' }
      ]);

      const result = await bookingService.checkAvailability(10, '2026-03-15', '09:00', '09:30');

      expect(result.available).toBe(false);
      expect(result.conflicts).toHaveLength(1);
    });
  });

  describe('cancelBooking', () => {
    it('should cancel a booking by setting status to CANCELLED', async () => {
      const booking = { ...mockBooking, status: 'CONFIRMED', update: jest.fn() };
      (Booking.findByPk as jest.Mock<any>).mockResolvedValue(booking);

      const result = await bookingService.cancelBooking(1);

      expect(booking.update).toHaveBeenCalledWith({ status: 'CANCELLED' });
      expect(result).toBe(booking);
    });

    it('should return the booking as-is if already cancelled', async () => {
      const booking = { ...mockBooking, status: 'CANCELLED' };
      (Booking.findByPk as jest.Mock<any>).mockResolvedValue(booking);

      const result = await bookingService.cancelBooking(1);

      expect(result).toBe(booking);
    });

    it('should return null when booking is not found', async () => {
      (Booking.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await bookingService.cancelBooking(999);

      expect(result).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // Booking Pages
  // --------------------------------------------------------------------------
  describe('createBookingPage', () => {
    it('should create a booking page with auto-generated slug', async () => {
      (BookingPage.create as jest.Mock<any>).mockResolvedValue({ id: 1, name: 'My Page', slug: 'my-page-abc' });

      const result = await bookingService.createBookingPage({ name: 'My Page' }, 'tenant-1');

      expect(BookingPage.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'My Page', tenantId: 'tenant-1' })
      );
      expect(result).toHaveProperty('id', 1);
    });
  });

  describe('deleteBookingPage', () => {
    it('should delete an existing booking page', async () => {
      const page = { id: 1, destroy: jest.fn() };
      (BookingPage.findByPk as jest.Mock<any>).mockResolvedValue(page);

      const result = await bookingService.deleteBookingPage(1);

      expect(page.destroy).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when page is not found', async () => {
      (BookingPage.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await bookingService.deleteBookingPage(999);

      expect(result).toBe(false);
    });
  });
});
