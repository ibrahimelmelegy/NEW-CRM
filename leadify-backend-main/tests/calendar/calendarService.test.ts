
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock dependencies before imports
jest.mock('../../src/calendar/calendarEventModel');
jest.mock('../../src/user/userModel');
jest.mock('../../src/server', () => ({
    io: { emit: jest.fn() }
}));

import calendarService from '../../src/calendar/calendarService';
import CalendarEvent from '../../src/calendar/calendarEventModel';

describe('CalendarService', () => {
    const mockUserId = 1;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------------------------------
    // 1. getEvents
    // --------------------------------------------------------------------------
    describe('getEvents', () => {
        it('should return events without filters', async () => {
            const mockEvents = [
                { id: 1, title: 'Meeting', startDate: '2026-03-01T10:00:00Z' },
            ];
            (CalendarEvent.findAll as jest.Mock<any>).mockResolvedValue(mockEvents);

            const result = await calendarService.getEvents({});
            expect(result).toEqual(mockEvents);
        });

        it('should apply date range filter', async () => {
            (CalendarEvent.findAll as jest.Mock<any>).mockResolvedValue([]);

            await calendarService.getEvents({
                start: '2026-03-01',
                end: '2026-03-31',
            });

            const callArgs = (CalendarEvent.findAll as jest.Mock<any>).mock.calls[0][0] as any;
            const symbolKeys = Object.getOwnPropertySymbols(callArgs.where);
            expect(symbolKeys.length).toBeGreaterThan(0); // Op.or for date range
        });

        it('should apply userId filter', async () => {
            (CalendarEvent.findAll as jest.Mock<any>).mockResolvedValue([]);

            await calendarService.getEvents({ userId: 1 });

            const callArgs = (CalendarEvent.findAll as jest.Mock<any>).mock.calls[0][0] as any;
            expect(callArgs.where.userId).toBe(1);
        });

        it('should apply eventType filter', async () => {
            (CalendarEvent.findAll as jest.Mock<any>).mockResolvedValue([]);

            await calendarService.getEvents({ eventType: 'MEETING' });

            const callArgs = (CalendarEvent.findAll as jest.Mock<any>).mock.calls[0][0] as any;
            expect(callArgs.where.eventType).toBe('MEETING');
        });
    });

    // --------------------------------------------------------------------------
    // 2. createEvent
    // --------------------------------------------------------------------------
    describe('createEvent', () => {
        it('should create an event with userId', async () => {
            const mockEvent = { id: 1, title: 'New Meeting', userId: mockUserId };
            (CalendarEvent.create as jest.Mock<any>).mockResolvedValue(mockEvent);

            const result = await calendarService.createEvent(
                { title: 'New Meeting', startDate: '2026-03-15T10:00:00Z', endDate: '2026-03-15T11:00:00Z' },
                mockUserId
            );

            expect(result).toEqual(mockEvent);
            expect(CalendarEvent.create).toHaveBeenCalledWith(
                expect.objectContaining({ title: 'New Meeting', userId: mockUserId })
            );
        });
    });

    // --------------------------------------------------------------------------
    // 3. updateEvent
    // --------------------------------------------------------------------------
    describe('updateEvent', () => {
        it('should update an event', async () => {
            const mockEvent = {
                id: 1,
                title: 'Old Title',
                update: jest.fn().mockResolvedValue(true),
            };
            (CalendarEvent.findByPk as jest.Mock<any>).mockResolvedValue(mockEvent);

            await calendarService.updateEvent(1, { title: 'New Title' }, mockUserId);

            expect(mockEvent.update).toHaveBeenCalledWith({ title: 'New Title' });
        });

        it('should throw when event not found', async () => {
            (CalendarEvent.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await expect(calendarService.updateEvent(999, { title: 'X' }, mockUserId))
                .rejects.toThrow('Event not found');
        });
    });

    // --------------------------------------------------------------------------
    // 4. deleteEvent
    // --------------------------------------------------------------------------
    describe('deleteEvent', () => {
        it('should delete an event', async () => {
            const mockEvent = { id: 1, destroy: jest.fn().mockResolvedValue(true) };
            (CalendarEvent.findByPk as jest.Mock<any>).mockResolvedValue(mockEvent);

            const result = await calendarService.deleteEvent(1);

            expect(result).toEqual({ deleted: true });
            expect(mockEvent.destroy).toHaveBeenCalled();
        });

        it('should throw when event not found', async () => {
            (CalendarEvent.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await expect(calendarService.deleteEvent(999))
                .rejects.toThrow('Event not found');
        });
    });

    // --------------------------------------------------------------------------
    // 5. getEventById
    // --------------------------------------------------------------------------
    describe('getEventById', () => {
        it('should return event by id', async () => {
            const mockEvent = { id: 1, title: 'Meeting' };
            (CalendarEvent.findByPk as jest.Mock<any>).mockResolvedValue(mockEvent);

            const result = await calendarService.getEventById(1);
            expect(result).toEqual(mockEvent);
        });

        it('should throw when event not found', async () => {
            (CalendarEvent.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await expect(calendarService.getEventById(999))
                .rejects.toThrow('Event not found');
        });
    });

    // --------------------------------------------------------------------------
    // 6. getUpcomingEvents
    // --------------------------------------------------------------------------
    describe('getUpcomingEvents', () => {
        it('should return upcoming events for next 7 days', async () => {
            const mockEvents = [{ id: 1, title: 'Tomorrow Meeting' }];
            (CalendarEvent.findAll as jest.Mock<any>).mockResolvedValue(mockEvents);

            const result = await calendarService.getUpcomingEvents(mockUserId);

            expect(result).toEqual(mockEvents);
            expect(CalendarEvent.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        userId: mockUserId,
                        status: 'SCHEDULED',
                    }),
                    limit: 20,
                })
            );
        });
    });

    // --------------------------------------------------------------------------
    // 7. checkConflicts
    // --------------------------------------------------------------------------
    describe('checkConflicts', () => {
        it('should return conflicting events', async () => {
            const conflictingEvents = [{ id: 2, title: 'Overlap Meeting' }];
            (CalendarEvent.findAll as jest.Mock<any>).mockResolvedValue(conflictingEvents);

            const result = await calendarService.checkConflicts(
                mockUserId,
                '2026-03-15T10:00:00Z',
                '2026-03-15T11:00:00Z'
            );

            expect(result).toEqual(conflictingEvents);
        });

        it('should exclude a specific event when excludeId provided', async () => {
            (CalendarEvent.findAll as jest.Mock<any>).mockResolvedValue([]);

            await calendarService.checkConflicts(
                mockUserId,
                '2026-03-15T10:00:00Z',
                '2026-03-15T11:00:00Z',
                5
            );

            const callArgs = (CalendarEvent.findAll as jest.Mock<any>).mock.calls[0][0] as any;
            // When excludeId is provided, id should have Op.ne filter
            expect(callArgs.where.id).toBeDefined();
        });
    });

    // --------------------------------------------------------------------------
    // 8. updateAttendeeStatus
    // --------------------------------------------------------------------------
    describe('updateAttendeeStatus', () => {
        it('should update attendee status for a specific user', async () => {
            const mockEvent = {
                id: 1,
                attendees: [
                    { userId: 1, status: 'PENDING' },
                    { userId: 2, status: 'PENDING' },
                ],
                update: jest.fn().mockResolvedValue(true),
            };
            (CalendarEvent.findByPk as jest.Mock<any>).mockResolvedValue(mockEvent);

            await calendarService.updateAttendeeStatus(1, 1, 'ACCEPTED');

            expect(mockEvent.update).toHaveBeenCalledWith({
                attendees: [
                    { userId: 1, status: 'ACCEPTED' },
                    { userId: 2, status: 'PENDING' },
                ],
            });
        });

        it('should throw when event not found', async () => {
            (CalendarEvent.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await expect(calendarService.updateAttendeeStatus(999, 1, 'ACCEPTED'))
                .rejects.toThrow('Event not found');
        });
    });

    // --------------------------------------------------------------------------
    // 9. getAnalytics
    // --------------------------------------------------------------------------
    describe('getAnalytics', () => {
        it('should return analytics with distributions', async () => {
            const mockEvents = [
                { eventType: 'MEETING', status: 'COMPLETED', priority: 'HIGH', startDate: '2026-03-01T10:00:00Z', endDate: '2026-03-01T11:00:00Z' },
                { eventType: 'CALL', status: 'SCHEDULED', priority: 'MEDIUM', startDate: '2026-03-02T14:00:00Z', endDate: '2026-03-02T14:30:00Z' },
                { eventType: 'MEETING', status: 'CANCELLED', priority: 'LOW', startDate: '2026-03-03T09:00:00Z', endDate: '2026-03-03T10:00:00Z' },
            ];
            (CalendarEvent.findAll as jest.Mock<any>).mockResolvedValue(mockEvents);

            const result = await calendarService.getAnalytics(mockUserId);

            expect(result.totalEvents).toBe(3);
            expect(result.typeDistribution).toEqual({ MEETING: 2, CALL: 1 });
            expect(result.completedCount).toBe(1);
            expect(result.cancelledCount).toBe(1);
            expect(result.scheduledCount).toBe(1);
        });

        it('should handle empty events', async () => {
            (CalendarEvent.findAll as jest.Mock<any>).mockResolvedValue([]);

            const result = await calendarService.getAnalytics(mockUserId);

            expect(result.totalEvents).toBe(0);
            expect(result.meetingHoursPerWeek).toBe(0);
        });
    });
});
