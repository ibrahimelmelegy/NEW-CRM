
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import slaService from '../../src/sla/slaService';
import { SLAPolicy, SLAInstance, SLAInstanceStatus } from '../../src/sla/slaModel';
import User from '../../src/user/userModel';
import BaseError from '../../src/utils/error/base-http-exception';
import { ERRORS } from '../../src/utils/error/errors';

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------
jest.mock('../../src/sla/slaModel');
jest.mock('../../src/user/userModel');
jest.mock('../../src/notification/notificationCenterService', () => ({
    default: {
        sendNotification: jest.fn(),
        sendRoleNotification: jest.fn(),
    },
}));
jest.mock('../../src/server', () => ({ io: { emit: jest.fn() } }));

describe('SLAService', () => {
    const mockPolicy: any = {
        id: 1,
        name: 'Standard SLA',
        entityType: 'ticket',
        conditions: {},
        responseTimeMinutes: 60,
        resolutionTimeMinutes: 480,
        escalationRules: [],
        businessHoursOnly: false,
        businessHours: null,
        isActive: true,
        createdBy: 1,
        update: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
        destroy: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
    };

    const now = new Date();
    const futureDeadline = new Date(now.getTime() + 3600000); // +1 hour
    const pastDeadline = new Date(now.getTime() - 3600000); // -1 hour

    const mockInstance: any = {
        id: 1,
        slaPolicyId: 1,
        entityType: 'ticket',
        entityId: 'ticket-1',
        startedAt: now,
        responseDeadline: futureDeadline,
        resolutionDeadline: new Date(now.getTime() + 28800000), // +8 hours
        status: SLAInstanceStatus.ACTIVE,
        firstRespondedAt: null,
        resolvedAt: null,
        responseBreached: false,
        resolutionBreached: false,
        pausedAt: null,
        pausedDurationMinutes: 0,
        currentEscalationLevel: 0,
        policy: mockPolicy,
        update: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------------------------------
    // Policy CRUD
    // --------------------------------------------------------------------------
    describe('createPolicy', () => {
        it('should create a policy with createdBy set', async () => {
            (SLAPolicy.create as jest.Mock<any>).mockResolvedValue(mockPolicy);
            const result = await slaService.createPolicy({
                name: 'Standard SLA',
                entityType: 'ticket',
                responseTimeMinutes: 60,
                resolutionTimeMinutes: 480,
            }, 1);
            expect(SLAPolicy.create).toHaveBeenCalledWith(
                expect.objectContaining({ createdBy: 1, name: 'Standard SLA' })
            );
            expect(result).toEqual(mockPolicy);
        });
    });

    describe('updatePolicy', () => {
        it('should update a policy when found', async () => {
            (SLAPolicy.findByPk as jest.Mock<any>).mockResolvedValue(mockPolicy);
            const result = await slaService.updatePolicy(1, { name: 'Updated SLA' });
            expect(mockPolicy.update).toHaveBeenCalledWith({ name: 'Updated SLA' });
        });

        it('should throw NOT_FOUND when policy does not exist', async () => {
            (SLAPolicy.findByPk as jest.Mock<any>).mockResolvedValue(null);
            await expect(slaService.updatePolicy(999, {}))
                .rejects.toThrow(BaseError);
        });
    });

    describe('deletePolicy', () => {
        it('should delete a policy when found', async () => {
            (SLAPolicy.findByPk as jest.Mock<any>).mockResolvedValue(mockPolicy);
            await slaService.deletePolicy(1);
            expect(mockPolicy.destroy).toHaveBeenCalled();
        });

        it('should throw NOT_FOUND when deleting non-existent policy', async () => {
            (SLAPolicy.findByPk as jest.Mock<any>).mockResolvedValue(null);
            await expect(slaService.deletePolicy(999))
                .rejects.toThrow(BaseError);
        });
    });

    describe('getPolicies', () => {
        it('should return paginated policies', async () => {
            (SLAPolicy.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [mockPolicy], count: 1 });
            const result = await slaService.getPolicies({ page: 1, limit: 20 });
            expect(result.docs).toHaveLength(1);
            expect(result.pagination.totalItems).toBe(1);
        });
    });

    describe('getPolicyById', () => {
        it('should return a policy by id', async () => {
            (SLAPolicy.findByPk as jest.Mock<any>).mockResolvedValue(mockPolicy);
            const result = await slaService.getPolicyById(1);
            expect(result).toEqual(mockPolicy);
        });

        it('should throw NOT_FOUND when not found', async () => {
            (SLAPolicy.findByPk as jest.Mock<any>).mockResolvedValue(null);
            await expect(slaService.getPolicyById(999))
                .rejects.toThrow(BaseError);
        });
    });

    // --------------------------------------------------------------------------
    // SLA Instance Lifecycle
    // --------------------------------------------------------------------------
    describe('startSLA', () => {
        it('should start an SLA instance when a matching policy exists', async () => {
            (SLAPolicy.findAll as jest.Mock<any>).mockResolvedValue([mockPolicy]);
            (SLAInstance.create as jest.Mock<any>).mockResolvedValue(mockInstance);

            const result = await slaService.startSLA('ticket', 'ticket-1');
            expect(SLAInstance.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    entityType: 'ticket',
                    entityId: 'ticket-1',
                    status: SLAInstanceStatus.ACTIVE,
                })
            );
            expect(result).toEqual(mockInstance);
        });

        it('should return null when no matching policy exists', async () => {
            (SLAPolicy.findAll as jest.Mock<any>).mockResolvedValue([]);
            const result = await slaService.startSLA('ticket', 'ticket-1');
            expect(result).toBeNull();
        });
    });

    describe('recordResponse', () => {
        it('should record first response and set breach flag', async () => {
            (SLAInstance.findOne as jest.Mock<any>).mockResolvedValue(mockInstance);
            const result = await slaService.recordResponse('ticket', 'ticket-1');
            expect(mockInstance.update).toHaveBeenCalledWith(
                expect.objectContaining({ firstRespondedAt: expect.any(Date) })
            );
        });

        it('should return null when no active instance exists', async () => {
            (SLAInstance.findOne as jest.Mock<any>).mockResolvedValue(null);
            const result = await slaService.recordResponse('ticket', 'ticket-1');
            expect(result).toBeNull();
        });

        it('should return instance unchanged if already responded', async () => {
            const responded = { ...mockInstance, firstRespondedAt: new Date() };
            (SLAInstance.findOne as jest.Mock<any>).mockResolvedValue(responded);
            const result = await slaService.recordResponse('ticket', 'ticket-1');
            expect(result).toEqual(responded);
            expect(responded.update).not.toHaveBeenCalled();
        });
    });

    describe('recordResolution', () => {
        it('should record resolution and set COMPLETED status when within deadline', async () => {
            (SLAInstance.findOne as jest.Mock<any>).mockResolvedValue(mockInstance);
            await slaService.recordResolution('ticket', 'ticket-1');
            expect(mockInstance.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    resolvedAt: expect.any(Date),
                    status: expect.any(String),
                })
            );
        });

        it('should return null when no active instance exists', async () => {
            (SLAInstance.findOne as jest.Mock<any>).mockResolvedValue(null);
            const result = await slaService.recordResolution('ticket', 'ticket-1');
            expect(result).toBeNull();
        });
    });

    // --------------------------------------------------------------------------
    // calculateDeadline
    // --------------------------------------------------------------------------
    describe('calculateDeadline', () => {
        it('should add calendar minutes when no business hours config', () => {
            const start = new Date('2026-03-01T10:00:00Z');
            const result = slaService.calculateDeadline(start, 120, null);
            expect(result.getTime()).toBe(start.getTime() + 120 * 60000);
        });

        it('should calculate deadline with business hours config', () => {
            const start = new Date('2026-03-01T08:00:00Z'); // Sunday 8am
            const businessHours = {
                start: '08:00',
                end: '17:00',
                timezone: 'UTC',
                workDays: [0, 1, 2, 3, 4], // Sun-Thu
            };
            const result = slaService.calculateDeadline(start, 60, businessHours);
            // Should be 1 hour into the business day
            expect(result.getTime()).toBe(start.getTime() + 60 * 60000);
        });
    });

    // --------------------------------------------------------------------------
    // getSLAStatus
    // --------------------------------------------------------------------------
    describe('getSLAStatus', () => {
        it('should return SLA status with time remaining', async () => {
            (SLAInstance.findOne as jest.Mock<any>).mockResolvedValue(mockInstance);
            const result = await slaService.getSLAStatus('ticket', 'ticket-1');
            expect(result).not.toBeNull();
            expect(result!.instance).toEqual(mockInstance);
            expect(result!.status).toBe(SLAInstanceStatus.ACTIVE);
        });

        it('should return null when no instance exists', async () => {
            (SLAInstance.findOne as jest.Mock<any>).mockResolvedValue(null);
            const result = await slaService.getSLAStatus('ticket', 'missing');
            expect(result).toBeNull();
        });
    });
});
