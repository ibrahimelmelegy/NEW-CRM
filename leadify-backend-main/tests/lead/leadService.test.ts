
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import leadService from '../../src/lead/leadService';
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
jest.mock('../../src/utils/emailHelper');

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
        save: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
    };

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
            expect(mockLeadData.$set).toHaveBeenCalledWith('users', [mockAdminUser.id], expect.anything());
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
                save: (jest.fn() as jest.Mock<any>).mockResolvedValue(true)
            };
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
});
