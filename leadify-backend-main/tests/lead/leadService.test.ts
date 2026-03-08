
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import leadService from '../../src/lead/leadService';
import { evaluateScore, DEFAULT_SCORING_RULES, ScoringRule } from '../../src/lead/leadService';
import Lead from '../../src/lead/leadModel';
import User from '../../src/user/userModel';
import LeadUsers from '../../src/lead/model/lead_UsersModel';
import notificationService from '../../src/notification/notificationService';
import { createActivityLog } from '../../src/activity-logs/activityService';
import { LeadPermissionsEnum } from '../../src/role/roleEnum';
import BaseError from '../../src/utils/error/base-http-exception';
import { ERRORS } from '../../src/utils/error/errors';

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------

// Mock Sequelize Models and external services
jest.mock('../../src/lead/leadModel');
jest.mock('../../src/user/userModel');
jest.mock('../../src/lead/model/lead_UsersModel');
jest.mock('../../src/notification/notificationService');
jest.mock('../../src/activity-logs/activityService');
jest.mock('../../src/activity-logs/model/leadActivities', () => ({
    LeadActivity: { destroy: jest.fn().mockImplementation(() => Promise.resolve(0)) }
}));
jest.mock('../../src/utils/emailHelper');
jest.mock('../../src/server', () => ({
    io: {
        emit: jest.fn()
    }
}));

// Mock Sequelize Transaction
const mockTransaction = {
    commit: jest.fn(),
    rollback: jest.fn(),
    afterCommit: jest.fn((cb: any) => cb()),
};

// We need to mock the db config to return our mock transaction
jest.mock('../../src/config/db', () => ({
    sequelize: {
        transaction: jest.fn(() => Promise.resolve(mockTransaction)),
    },
}));

describe('LeadService', () => {
    // Test Data
    const mockAdminUser: any = {
        id: 1,
        email: 'admin@test.com',
        role: { permissions: [LeadPermissionsEnum.VIEW_GLOBAL_LEADS] },
    };

    const mockStandardUser: any = {
        id: 2,
        email: 'user@test.com',
        role: { permissions: [] },
    };

    const mockLeadData: any = {
        id: 'lead-123',
        name: 'Test Lead',
        email: 'lead@test.com',
        phone: '+123456789',
        status: 'NEW',
        users: [],
        // Mock instance methods
        $set: jest.fn(),
        set: jest.fn(),
        save: jest.fn(),
        toJSON: jest.fn(() => ({
            id: 'lead-123',
            name: 'Test Lead',
            email: 'lead@test.com',
            phone: '+123456789',
            status: 'NEW',
        }))
    };

    // save() returns the instance itself (like Sequelize does)
    mockLeadData.save.mockImplementation(() => Promise.resolve(mockLeadData));

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------------------------------
    // 1. createLead
    // --------------------------------------------------------------------------
    describe('createLead', () => {
        it('should create a lead successfully with default admin assignment', async () => {
            // Arrange
            const input = {
                name: 'New Lead',
                email: 'new@test.com',
            };

            (Lead.findOne as jest.Mock<any>).mockResolvedValue(null); // No duplicates
            (User.findAll as jest.Mock<any>).mockResolvedValue([mockAdminUser]); // Admin exists
            (Lead.create as jest.Mock<any>).mockResolvedValue(mockLeadData);

            // Act
            const result = await leadService.createLead(input, mockAdminUser.id);

            // Assert
            expect(result).toEqual(mockLeadData);
            expect(Lead.create).toHaveBeenCalledWith(
                expect.objectContaining({ name: 'New Lead' }),
                expect.anything()
            );
            // Verify assignment to admin (since no users were provided)
            expect(mockLeadData.$set).toHaveBeenCalledWith('users', [mockAdminUser.id], undefined);
            // Verify activity log
            expect(createActivityLog).toHaveBeenCalledWith('lead', 'create', expect.anything(), mockAdminUser.id, undefined, expect.any(String));
        });

        it('should throw ERRORS.EMAIL_ALREADY_EXISTS if email is duplicate', async () => {
            // Arrange
            const input = { email: 'exists@test.com' };
            (Lead.findOne as jest.Mock<any>).mockResolvedValue({ id: 'existing-id' }); // Duplicate found

            // Act & Assert
            await expect(leadService.createLead(input, mockAdminUser.id))
                .rejects
                .toThrow(new BaseError(ERRORS.EMAIL_ALREADY_EXISTS));
        });

        it('should throw ERRORS.PHONE_ALREADY_EXISTS if phone is duplicate', async () => {
            // Arrange
            const input = { phone: '+999999999' };
            // Return existing lead immediately. Implicitly assumes no email check (or email check passed/skipped)
            (Lead.findOne as jest.Mock<any>).mockResolvedValue({ id: 'existing-id' });

            // Act & Assert
            await expect(leadService.createLead(input, mockAdminUser.id))
                .rejects
                .toThrow(new BaseError(ERRORS.PHONE_ALREADY_EXISTS));
        });

        it('should throw USER_NOT_FOUND when no valid users exist', async () => {
            const input = { name: 'New Lead', users: [999] };
            (Lead.findOne as jest.Mock<any>).mockResolvedValue(null); // No duplicates
            (User.findAll as jest.Mock<any>).mockResolvedValue([]); // No users found

            await expect(leadService.createLead(input, mockAdminUser.id))
                .rejects
                .toThrow(new BaseError(ERRORS.USER_NOT_FOUND));
        });

        it('should add adminId to users array if not already included', async () => {
            const input = { name: 'New Lead', users: [5, 6] }; // adminId (1) not included
            (Lead.findOne as jest.Mock<any>).mockResolvedValue(null);
            (User.findAll as jest.Mock<any>).mockResolvedValue([{ id: 1 }, { id: 5 }, { id: 6 }]);
            (Lead.create as jest.Mock<any>).mockResolvedValue(mockLeadData);

            await leadService.createLead(input, mockAdminUser.id);

            // Users array should now include adminId
            expect(mockLeadData.$set).toHaveBeenCalledWith(
                'users',
                expect.arrayContaining([mockAdminUser.id, 5, 6]),
                undefined
            );
        });

        it('should send notification when multiple users are assigned', async () => {
            const input = { name: 'New Lead', users: [1, 5] };
            (Lead.findOne as jest.Mock<any>).mockResolvedValue(null);
            (User.findAll as jest.Mock<any>).mockResolvedValue([{ id: 1 }, { id: 5 }]);
            (Lead.create as jest.Mock<any>).mockResolvedValue(mockLeadData);

            await leadService.createLead(input, mockAdminUser.id);

            // Should send notification because multiple users (foundUsers.length !== 1)
            expect(notificationService.sendAssignLeadNotification).toHaveBeenCalled();
        });

        it('should emit lead:created socket event', async () => {
            const { io } = require('../../src/server');
            const input = { name: 'New Lead' };
            (Lead.findOne as jest.Mock<any>).mockResolvedValue(null);
            (User.findAll as jest.Mock<any>).mockResolvedValue([mockAdminUser]);
            (Lead.create as jest.Mock<any>).mockResolvedValue(mockLeadData);

            await leadService.createLead(input, mockAdminUser.id);

            expect(io.emit).toHaveBeenCalledWith('lead:created', mockLeadData);
        });

        it('should skip activity log when transaction is provided', async () => {
            const input = { name: 'New Lead' };
            (Lead.findOne as jest.Mock<any>).mockResolvedValue(null);
            (User.findAll as jest.Mock<any>).mockResolvedValue([mockAdminUser]);
            (Lead.create as jest.Mock<any>).mockResolvedValue(mockLeadData);

            await leadService.createLead(input, mockAdminUser.id, mockTransaction as any);

            // When transaction is provided, createActivityLog should NOT be called
            expect(createActivityLog).not.toHaveBeenCalled();
        });
    });

    // --------------------------------------------------------------------------
    // 2. updateLead
    // --------------------------------------------------------------------------
    describe('updateLead', () => {
        const updateInput = { name: 'Updated Name', users: [3] };

        it('should update lead successfully if user has permission', async () => {
            // Arrange
            // 1. Validate Access: Mock LeadUsers find for standard user
            (LeadUsers.findOne as jest.Mock<any>).mockResolvedValue({ userId: mockStandardUser.id, leadId: mockLeadData.id });

            // 2. LeadOrError: Find the lead (Ensure $set is present)
            const mockLeadInstance: any = {
                ...mockLeadData,
                $set: jest.fn(), // Explicitly re-mock
                set: jest.fn(),
                save: jest.fn(),
                toJSON: jest.fn(() => ({ id: 'lead-123', name: 'Updated Name' })),
            };
            mockLeadInstance.save.mockImplementation(() => Promise.resolve(mockLeadInstance));
            (Lead.findOne as jest.Mock<any>).mockResolvedValue(mockLeadInstance);

            // Act
            await leadService.updateLead(mockLeadData.id, updateInput, mockStandardUser);

            // Assert
            expect(mockLeadInstance.set).toHaveBeenCalledWith(updateInput);
            expect(mockLeadInstance.save).toHaveBeenCalled();
            expect(mockLeadInstance.$set).toHaveBeenCalled(); // Verifies usage

            // Check notification dispatch for new assigned user [3]
            expect(notificationService.sendAssignLeadNotification).toHaveBeenCalled();
        });

        it('should throw ACCESS_DENIED when standard user tries to update unassigned lead', async () => {
            // Arrange
            (LeadUsers.findOne as jest.Mock<any>).mockResolvedValue(null); // Not assigned

            // Act & Assert
            await expect(leadService.updateLead(mockLeadData.id, updateInput, mockStandardUser))
                .rejects
                .toThrow(new BaseError(ERRORS.ACCESS_DENIED));
        });

        it('should allow Admin (Global View) to update any lead', async () => {
            // Arrange
            (Lead.findOne as jest.Mock<any>).mockResolvedValue(mockLeadData);

            // Act
            await leadService.updateLead(mockLeadData.id, updateInput, mockAdminUser);

            // Assert
            // Should not throw access denied, and proceed to save
            expect(mockLeadData.save).toHaveBeenCalled();
        });

        it('should prevent update if new email collides with another lead', async () => {
            // Arrange
            (Lead.findOne as jest.Mock<any>).mockImplementation((query: any) => {
                // Mocking: First call (leadOrError) -> returns target lead
                // Second call (errorIfLeadWithExistEmail) -> returns A DIFFERENT lead
                if (query.where.id === 'lead-123') return Promise.resolve(mockLeadData); // The lead itself
                if (query.where.email === 'collision@test.com') return Promise.resolve({ id: 'other-lead' }); // Collision
                return Promise.resolve(null);
            });

            // Bypass access check or assume admin
            const collisionInput = { email: 'collision@test.com' };

            // Act & Assert
            await expect(leadService.updateLead('lead-123', collisionInput, mockAdminUser))
                .rejects
                .toThrow(new BaseError(ERRORS.EMAIL_ALREADY_EXISTS));
        });

        it('should prevent update if new phone collides with another lead', async () => {
            const mockLead: any = {
                ...mockLeadData,
                toJSON: jest.fn(() => ({ id: 'lead-123', name: 'Test' })),
                set: jest.fn(),
                save: jest.fn(),
                $set: jest.fn(),
            };
            let callCount = 0;
            (Lead.findOne as jest.Mock<any>).mockImplementation((query: any) => {
                callCount++;
                // First call: leadOrError returns the lead
                if (callCount === 1) return Promise.resolve(mockLead);
                // Second call: phone collision
                if (query.where.phone) return Promise.resolve({ id: 'other-lead' });
                return Promise.resolve(null);
            });

            await expect(leadService.updateLead('lead-123', { phone: '+collision' }, mockAdminUser))
                .rejects
                .toThrow(new BaseError(ERRORS.PHONE_ALREADY_EXISTS));
        });

        it('should emit lead:updated socket event on success', async () => {
            const { io } = require('../../src/server');
            const mockLead: any = {
                ...mockLeadData,
                users: [],
                toJSON: jest.fn(() => ({ id: 'lead-123' })),
                set: jest.fn(),
                save: jest.fn(),
                $set: jest.fn(),
            };
            mockLead.save.mockImplementation(() => Promise.resolve(mockLead));
            (Lead.findOne as jest.Mock<any>).mockResolvedValue(mockLead);

            await leadService.updateLead('lead-123', { name: 'Updated' }, mockAdminUser);

            expect(io.emit).toHaveBeenCalledWith('lead:updated', expect.anything());
        });
    });

    // --------------------------------------------------------------------------
    // 3. validateLeadAccess (Direct Test)
    // --------------------------------------------------------------------------
    describe('validateLeadAccess', () => {
        it('should return void for Admin with Global View', async () => {
            await expect(leadService.validateLeadAccess('any-id', mockAdminUser))
                .resolves.not.toThrow();
        });

        it('should throw ACCESS_DENIED for standard user not assigned', async () => {
            (LeadUsers.findOne as jest.Mock<any>).mockResolvedValue(null);
            await expect(leadService.validateLeadAccess('any-id', mockStandardUser))
                .rejects.toThrow(new BaseError(ERRORS.ACCESS_DENIED));
        });

        it('should return void for standard user who IS assigned', async () => {
            (LeadUsers.findOne as jest.Mock<any>).mockResolvedValue({ userId: mockStandardUser.id });
            await expect(leadService.validateLeadAccess('any-id', mockStandardUser))
                .resolves.not.toThrow();
        });
    });

    // --------------------------------------------------------------------------
    // 4. leadOrError
    // --------------------------------------------------------------------------
    describe('leadOrError', () => {
        it('should return the lead when found', async () => {
            (Lead.findOne as jest.Mock<any>).mockResolvedValue(mockLeadData);

            const result = await leadService.leadOrError({ id: 'lead-123' });

            expect(result).toEqual(mockLeadData);
            expect(Lead.findOne).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id: 'lead-123' } })
            );
        });

        it('should throw LEAD_NOT_FOUND when lead does not exist', async () => {
            (Lead.findOne as jest.Mock<any>).mockResolvedValue(null);

            await expect(leadService.leadOrError({ id: 'nonexistent' }))
                .rejects.toThrow(new BaseError(ERRORS.LEAD_NOT_FOUND));
        });

        it('should pass joined tables to findOne include', async () => {
            const joinedTables = [{ model: User, as: 'users' }];
            (Lead.findOne as jest.Mock<any>).mockResolvedValue(mockLeadData);

            await leadService.leadOrError({ id: 'lead-123' }, joinedTables);

            expect(Lead.findOne).toHaveBeenCalledWith(
                expect.objectContaining({ include: joinedTables })
            );
        });
    });

    // --------------------------------------------------------------------------
    // 5. leadById
    // --------------------------------------------------------------------------
    describe('leadById', () => {
        it('should return lead with users for admin', async () => {
            const leadWithUsers: any = { ...mockLeadData, users: [{ id: 1, name: 'Admin' }] };
            (Lead.findByPk as jest.Mock<any>).mockResolvedValue(leadWithUsers);

            const result = await leadService.leadById('lead-123', mockAdminUser);

            expect(result).toEqual(leadWithUsers);
            expect(Lead.findByPk).toHaveBeenCalledWith('lead-123', expect.objectContaining({
                include: expect.arrayContaining([
                    expect.objectContaining({ model: User, as: 'users' })
                ])
            }));
        });

        it('should throw LEAD_NOT_FOUND when lead does not exist', async () => {
            (Lead.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await expect(leadService.leadById('nonexistent', mockAdminUser))
                .rejects.toThrow(new BaseError(ERRORS.LEAD_NOT_FOUND));
        });

        it('should validate access before fetching lead', async () => {
            (LeadUsers.findOne as jest.Mock<any>).mockResolvedValue(null); // Not assigned

            await expect(leadService.leadById('lead-123', mockStandardUser))
                .rejects.toThrow(new BaseError(ERRORS.ACCESS_DENIED));
        });

        it('should allow assigned standard user to view lead', async () => {
            (LeadUsers.findOne as jest.Mock<any>).mockResolvedValue({ userId: mockStandardUser.id });
            const leadWithUsers: any = { ...mockLeadData, users: [{ id: 2 }] };
            (Lead.findByPk as jest.Mock<any>).mockResolvedValue(leadWithUsers);

            const result = await leadService.leadById('lead-123', mockStandardUser);

            expect(result).toEqual(leadWithUsers);
        });
    });

    // --------------------------------------------------------------------------
    // 6. deleteLead
    // --------------------------------------------------------------------------
    describe('deleteLead', () => {
        it('should delete lead successfully for admin', async () => {
            const mockLead: any = {
                id: 'lead-123',
                destroy: jest.fn(),
            };
            (Lead.findByPk as jest.Mock<any>).mockResolvedValue(mockLead);
            (Lead as any).sequelize = { query: jest.fn().mockImplementation(() => Promise.resolve([[], 0])) };

            await leadService.deleteLead('lead-123', mockAdminUser);

            expect(mockLead.destroy).toHaveBeenCalled();
        });

        it('should throw LEAD_NOT_FOUND if lead does not exist', async () => {
            (Lead.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await expect(leadService.deleteLead('nonexistent', mockAdminUser))
                .rejects.toThrow(new BaseError(ERRORS.LEAD_NOT_FOUND));
        });

        it('should throw ACCESS_DENIED for unassigned standard user', async () => {
            (LeadUsers.findOne as jest.Mock<any>).mockResolvedValue(null);

            await expect(leadService.deleteLead('lead-123', mockStandardUser))
                .rejects.toThrow(new BaseError(ERRORS.ACCESS_DENIED));
        });

        it('should allow assigned standard user to delete lead', async () => {
            (LeadUsers.findOne as jest.Mock<any>).mockResolvedValue({ userId: mockStandardUser.id });
            const mockLead: any = { id: 'lead-123', destroy: jest.fn() };
            (Lead.findByPk as jest.Mock<any>).mockResolvedValue(mockLead);
            (Lead as any).sequelize = { query: jest.fn().mockImplementation(() => Promise.resolve([[], 0])) };

            await leadService.deleteLead('lead-123', mockStandardUser);

            expect(mockLead.destroy).toHaveBeenCalled();
        });
    });

    // --------------------------------------------------------------------------
    // 7. getLeads
    // --------------------------------------------------------------------------
    describe('getLeads', () => {
        it('should return paginated leads for admin', async () => {
            const mockRows = [mockLeadData];
            (Lead.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: mockRows, count: 1 });

            const result = await leadService.getLeads({ page: 1, limit: 10 } as any, mockAdminUser);

            expect(result.docs).toEqual(mockRows);
            expect(result.pagination.totalItems).toBe(1);
            expect(result.pagination.totalPages).toBe(1);
            expect(result.pagination.page).toBe(1);
            expect(result.pagination.limit).toBe(10);
        });

        it('should enforce userId filter for non-admin user', async () => {
            (Lead.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            await leadService.getLeads({ page: 1, limit: 10 } as any, mockStandardUser);

            expect(Lead.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    include: expect.arrayContaining([
                        expect.objectContaining({
                            required: true,
                            where: { id: mockStandardUser.id }
                        })
                    ])
                })
            );
        });

        it('should apply search filter', async () => {
            (Lead.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            await leadService.getLeads({ page: 1, limit: 10, searchKey: 'acme' } as any, mockAdminUser);

            const callArgs = (Lead.findAndCountAll as jest.Mock<any>).mock.calls[0][0] as any;
            const symbolKeys = Object.getOwnPropertySymbols(callArgs.where);
            expect(symbolKeys.length).toBeGreaterThan(0); // Op.or symbol present
        });

        it('should handle multiple pages correctly', async () => {
            (Lead.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 50 });

            const result = await leadService.getLeads({ page: 3, limit: 10 } as any, mockAdminUser);

            expect(Lead.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    limit: 10,
                    offset: 20, // (3-1)*10
                })
            );
            expect(result.pagination.totalPages).toBe(5); // 50/10
        });

        it('should filter by status array', async () => {
            (Lead.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            await leadService.getLeads({ page: 1, limit: 10, status: ['NEW', 'CONTACTED'] } as any, mockAdminUser);

            const callArgs = (Lead.findAndCountAll as jest.Mock<any>).mock.calls[0][0] as any;
            expect(callArgs.where.status).toBeDefined();
        });

        it('should filter by date range', async () => {
            (Lead.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            await leadService.getLeads({
                page: 1,
                limit: 10,
                fromDate: '2025-01-01',
                toDate: '2025-12-31'
            } as any, mockAdminUser);

            const callArgs = (Lead.findAndCountAll as jest.Mock<any>).mock.calls[0][0] as any;
            expect(callArgs.where.createdAt).toBeDefined();
        });

        it('should use default pagination when no page/limit provided', async () => {
            (Lead.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            const result = await leadService.getLeads({} as any, mockAdminUser);

            expect(result.pagination.page).toBe(1);
            expect(result.pagination.limit).toBeGreaterThan(0);
        });
    });

    // --------------------------------------------------------------------------
    // 8. calculateScore / evaluateScore
    // --------------------------------------------------------------------------
    describe('calculateScore', () => {
        it('should score a lead with email, phone, and company', () => {
            const lead = {
                email: 'test@test.com',
                phone: '+1234',
                companyName: 'ACME',
            };

            const score = leadService.calculateScore(lead);

            // email=10, phone=10, company=10 = 30
            expect(score).toBe(30);
        });

        it('should score a referral source higher than cold call', () => {
            const referralLead = { email: 'a@b.com', leadSource: 'REFERRAL' };
            const coldCallLead = { email: 'a@b.com', leadSource: 'COLD_CALL' };

            const referralScore = leadService.calculateScore(referralLead);
            const coldCallScore = leadService.calculateScore(coldCallLead);

            expect(referralScore).toBeGreaterThan(coldCallScore);
        });

        it('should cap score at 100', () => {
            const lead = {
                email: 'a@b.com',
                phone: '+1',
                companyName: 'Corp',
                leadSource: 'REFERRAL',
                notes: 'Some notes',
                users: [1, 2],
                budget: 100000,
            };

            const score = leadService.calculateScore(lead);

            expect(score).toBeLessThanOrEqual(100);
        });

        it('should return 0 for empty lead', () => {
            const score = leadService.calculateScore({});
            expect(score).toBe(0);
        });

        it('should use budget tiers correctly (group: only highest counts)', () => {
            const lead = { budget: 60000 }; // > 50000 and > 10000
            const score = leadService.calculateScore(lead);
            // Should use the 50k+ tier (20 points), not sum both
            expect(score).toBe(20);
        });

        it('should accept custom rules', () => {
            const customRules: ScoringRule[] = [
                { field: 'priority', condition: 'equals', value: 'HIGH', points: 50 },
            ];

            const score = leadService.calculateScore({ priority: 'HIGH' }, customRules);
            expect(score).toBe(50);
        });
    });

    describe('evaluateScore (exported function)', () => {
        it('should handle "exists" condition for arrays', () => {
            const rules: ScoringRule[] = [
                { field: 'assignedUsers', condition: 'exists', points: 10 },
            ];

            expect(evaluateScore({ assignedUsers: [1, 2] }, rules)).toBe(10);
            expect(evaluateScore({ assignedUsers: [] }, rules)).toBe(0);
        });

        it('should handle "contains" condition for strings', () => {
            const rules: ScoringRule[] = [
                { field: 'notes', condition: 'contains', value: 'urgent', points: 15 },
            ];

            expect(evaluateScore({ notes: 'This is urgent business' }, rules)).toBe(15);
            expect(evaluateScore({ notes: 'Normal business' }, rules)).toBe(0);
        });

        it('should handle "contains" condition for arrays', () => {
            const rules: ScoringRule[] = [
                { field: 'tags', condition: 'contains', value: 'VIP', points: 20 },
            ];

            expect(evaluateScore({ tags: ['VIP', 'Enterprise'] }, rules)).toBe(20);
            expect(evaluateScore({ tags: ['Standard'] }, rules)).toBe(0);
        });

        it('should handle "greater_than" condition', () => {
            const rules: ScoringRule[] = [
                { field: 'budget', condition: 'greater_than', value: 1000, points: 10 },
            ];

            expect(evaluateScore({ budget: 2000 }, rules)).toBe(10);
            expect(evaluateScore({ budget: 500 }, rules)).toBe(0);
            expect(evaluateScore({ budget: 'not-a-number' }, rules)).toBe(0);
        });

        it('should handle unknown condition gracefully', () => {
            const rules: ScoringRule[] = [
                { field: 'name', condition: 'unknown_condition' as any, points: 10 },
            ];

            expect(evaluateScore({ name: 'Test' }, rules)).toBe(0);
        });

        it('should use grouped rules correctly (highest wins)', () => {
            const rules: ScoringRule[] = [
                { field: 'source', condition: 'equals', value: 'REFERRAL', points: 25, group: 'src' },
                { field: 'source', condition: 'equals', value: 'WEBSITE', points: 15, group: 'src' },
            ];

            // Only REFERRAL matches, so 25
            expect(evaluateScore({ source: 'REFERRAL' }, rules)).toBe(25);
        });
    });

    // --------------------------------------------------------------------------
    // 9. errorIfLeadWithExistEmail
    // --------------------------------------------------------------------------
    describe('errorIfLeadWithExistEmail', () => {
        it('should throw when email exists', async () => {
            (Lead.findOne as jest.Mock<any>).mockResolvedValue({ id: 'existing' });

            await expect(leadService.errorIfLeadWithExistEmail('exists@test.com'))
                .rejects.toThrow(new BaseError(ERRORS.EMAIL_ALREADY_EXISTS));
        });

        it('should not throw when email is unique', async () => {
            (Lead.findOne as jest.Mock<any>).mockResolvedValue(null);

            await expect(leadService.errorIfLeadWithExistEmail('unique@test.com'))
                .resolves.not.toThrow();
        });

        it('should exclude current lead id from duplicate check', async () => {
            (Lead.findOne as jest.Mock<any>).mockResolvedValue(null);

            await leadService.errorIfLeadWithExistEmail('test@test.com', 'lead-123');

            expect(Lead.findOne).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        email: 'test@test.com',
                        id: expect.anything(), // Op.ne: 'lead-123'
                    })
                })
            );
        });
    });

    // --------------------------------------------------------------------------
    // 10. errorIfLeadWithExistPhone
    // --------------------------------------------------------------------------
    describe('errorIfLeadWithExistPhone', () => {
        it('should throw when phone exists', async () => {
            (Lead.findOne as jest.Mock<any>).mockResolvedValue({ id: 'existing' });

            await expect(leadService.errorIfLeadWithExistPhone('+123'))
                .rejects.toThrow(new BaseError(ERRORS.PHONE_ALREADY_EXISTS));
        });

        it('should not throw when phone is unique', async () => {
            (Lead.findOne as jest.Mock<any>).mockResolvedValue(null);

            await expect(leadService.errorIfLeadWithExistPhone('+999'))
                .resolves.not.toThrow();
        });
    });
});
