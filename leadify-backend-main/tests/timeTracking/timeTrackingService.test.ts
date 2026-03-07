
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import timeTrackingService from '../../src/timeTracking/timeTrackingService';
import TimeEntry from '../../src/timeTracking/timeEntryModel';

// Mock model
jest.mock('../../src/timeTracking/timeEntryModel');

describe('TimeTrackingService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------------------------------
    // 1. startTimer
    // --------------------------------------------------------------------------
    describe('startTimer', () => {
        it('should create a new time entry when no running timer exists', async () => {
            (TimeEntry.findOne as jest.Mock<any>).mockResolvedValue(null); // No running timer
            const mockEntry = {
                id: 'entry-1',
                userId: 1,
                entityType: 'lead',
                entityId: 'lead-5',
                description: 'Working on lead',
                startTime: expect.any(Date),
            };
            (TimeEntry.create as jest.Mock<any>).mockResolvedValue(mockEntry);

            const result = await timeTrackingService.startTimer(1, {
                entityType: 'lead',
                entityId: 'lead-5',
                description: 'Working on lead',
            });

            expect(TimeEntry.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 1,
                    entityType: 'lead',
                    entityId: 'lead-5',
                    description: 'Working on lead',
                })
            );
            expect(result).toEqual(mockEntry);
        });

        it('should stop existing running timer before starting a new one', async () => {
            const mockRunningTimer: any = {
                id: 'entry-old',
                userId: 1,
                startTime: new Date('2026-03-08T09:00:00Z'),
                endTime: null,
                update: jest.fn().mockImplementation(() => Promise.resolve()),
            };
            // First call returns running timer (for startTimer check),
            // second call returns the same running timer (for stopTimer),
            // third call returns null (for the re-check in startTimer after stopTimer)
            (TimeEntry.findOne as jest.Mock<any>)
                .mockResolvedValueOnce(mockRunningTimer) // startTimer check
                .mockResolvedValueOnce(mockRunningTimer); // stopTimer lookup

            const mockNewEntry = { id: 'entry-new', userId: 1 };
            (TimeEntry.create as jest.Mock<any>).mockResolvedValue(mockNewEntry);

            const result = await timeTrackingService.startTimer(1, { description: 'New task' });

            // Verify the old timer was stopped
            expect(mockRunningTimer.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    endTime: expect.any(Date),
                    duration: expect.any(Number),
                })
            );
            // Verify new timer was created
            expect(TimeEntry.create).toHaveBeenCalled();
        });
    });

    // --------------------------------------------------------------------------
    // 2. stopTimer
    // --------------------------------------------------------------------------
    describe('stopTimer', () => {
        it('should stop a running timer and calculate duration', async () => {
            const startTime = new Date('2026-03-08T09:00:00Z');
            const mockEntry: any = {
                id: 'entry-1',
                userId: 1,
                startTime,
                endTime: null,
                update: jest.fn().mockImplementation(() => Promise.resolve()),
            };
            (TimeEntry.findOne as jest.Mock<any>).mockResolvedValue(mockEntry);

            const result = await timeTrackingService.stopTimer(1);

            expect(mockEntry.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    endTime: expect.any(Date),
                    duration: expect.any(Number),
                })
            );
        });

        it('should throw when no running timer exists', async () => {
            (TimeEntry.findOne as jest.Mock<any>).mockResolvedValue(null);

            await expect(timeTrackingService.stopTimer(1))
                .rejects.toThrow('No running timer');
        });
    });

    // --------------------------------------------------------------------------
    // 3. getRunningTimer
    // --------------------------------------------------------------------------
    describe('getRunningTimer', () => {
        it('should return running timer for user', async () => {
            const mockEntry = { id: 'entry-1', userId: 1, endTime: null };
            (TimeEntry.findOne as jest.Mock<any>).mockResolvedValue(mockEntry);

            const result = await timeTrackingService.getRunningTimer(1);

            expect(TimeEntry.findOne).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { userId: 1, endTime: null },
                })
            );
            expect(result).toEqual(mockEntry);
        });

        it('should return null when no running timer', async () => {
            (TimeEntry.findOne as jest.Mock<any>).mockResolvedValue(null);

            const result = await timeTrackingService.getRunningTimer(1);

            expect(result).toBeNull();
        });
    });

    // --------------------------------------------------------------------------
    // 4. createManualEntry
    // --------------------------------------------------------------------------
    describe('createManualEntry', () => {
        it('should create a manual time entry with calculated duration', async () => {
            const data = {
                entityType: 'deal',
                entityId: 'deal-1',
                entityName: 'Big Deal',
                description: 'Follow-up call',
                startTime: '2026-03-08T09:00:00Z',
                endTime: '2026-03-08T10:30:00Z',
            };
            const mockEntry = { id: 'entry-1', userId: 1, duration: 5400, ...data };
            (TimeEntry.create as jest.Mock<any>).mockResolvedValue(mockEntry);

            const result = await timeTrackingService.createManualEntry(1, data);

            expect(TimeEntry.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 1,
                    entityType: 'deal',
                    duration: 5400, // 1.5 hours in seconds
                })
            );
        });
    });

    // --------------------------------------------------------------------------
    // 5. updateEntry
    // --------------------------------------------------------------------------
    describe('updateEntry', () => {
        it('should update an existing time entry', async () => {
            const mockEntry: any = {
                id: 'entry-1',
                userId: 1,
                update: jest.fn().mockImplementation(() => Promise.resolve({ id: 'entry-1', description: 'Updated' })),
            };
            (TimeEntry.findOne as jest.Mock<any>).mockResolvedValue(mockEntry);

            await timeTrackingService.updateEntry('entry-1', 1, { description: 'Updated' });

            expect(TimeEntry.findOne).toHaveBeenCalledWith({
                where: { id: 'entry-1', userId: 1 },
            });
            expect(mockEntry.update).toHaveBeenCalledWith({ description: 'Updated' });
        });

        it('should recalculate duration when both startTime and endTime are updated', async () => {
            const mockEntry: any = {
                id: 'entry-1',
                userId: 1,
                update: jest.fn().mockImplementation(() => Promise.resolve()),
            };
            (TimeEntry.findOne as jest.Mock<any>).mockResolvedValue(mockEntry);

            const data = {
                startTime: '2026-03-08T09:00:00Z',
                endTime: '2026-03-08T11:00:00Z',
            };
            await timeTrackingService.updateEntry('entry-1', 1, data);

            expect(mockEntry.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    duration: 7200, // 2 hours in seconds
                })
            );
        });

        it('should throw when entry not found or not owned by user', async () => {
            (TimeEntry.findOne as jest.Mock<any>).mockResolvedValue(null);

            await expect(timeTrackingService.updateEntry('entry-1', 99, {}))
                .rejects.toThrow('Time entry not found');
        });
    });

    // --------------------------------------------------------------------------
    // 6. deleteEntry
    // --------------------------------------------------------------------------
    describe('deleteEntry', () => {
        it('should delete an existing time entry', async () => {
            const mockEntry: any = {
                id: 'entry-1',
                userId: 1,
                destroy: jest.fn().mockImplementation(() => Promise.resolve()),
            };
            (TimeEntry.findOne as jest.Mock<any>).mockResolvedValue(mockEntry);

            await timeTrackingService.deleteEntry('entry-1', 1);

            expect(mockEntry.destroy).toHaveBeenCalled();
        });

        it('should throw when entry not found', async () => {
            (TimeEntry.findOne as jest.Mock<any>).mockResolvedValue(null);

            await expect(timeTrackingService.deleteEntry('nonexistent', 1))
                .rejects.toThrow('Time entry not found');
        });
    });

    // --------------------------------------------------------------------------
    // 7. getWeeklySummary
    // --------------------------------------------------------------------------
    describe('getWeeklySummary', () => {
        it('should return entries grouped by day with totals', async () => {
            const mockEntries = [
                { startTime: new Date('2026-03-02T09:00:00Z'), duration: 3600 },
                { startTime: new Date('2026-03-02T14:00:00Z'), duration: 1800 },
                { startTime: new Date('2026-03-03T10:00:00Z'), duration: 7200 },
            ];
            (TimeEntry.findAll as jest.Mock<any>).mockResolvedValue(mockEntries);

            const result = await timeTrackingService.getWeeklySummary(1, '2026-03-02');

            expect(result.entries).toEqual(mockEntries);
            expect(result.dailyTotals['2026-03-02']).toBe(5400); // 3600 + 1800
            expect(result.dailyTotals['2026-03-03']).toBe(7200);
            expect(result.totalSeconds).toBe(12600); // 5400 + 7200
        });

        it('should return empty totals when no entries exist', async () => {
            (TimeEntry.findAll as jest.Mock<any>).mockResolvedValue([]);

            const result = await timeTrackingService.getWeeklySummary(1, '2026-03-02');

            expect(result.entries).toEqual([]);
            expect(result.totalSeconds).toBe(0);
        });
    });
});
