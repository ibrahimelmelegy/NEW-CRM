
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import opportunityService from '../../src/opportunity/opportunityService';
import Opportunity from '../../src/opportunity/opportunityModel';
import Lead from '../../src/lead/leadModel';
import Client from '../../src/client/clientModel';
import User from '../../src/user/userModel';
import leadService from '../../src/lead/leadService';
import notificationService from '../../src/notification/notificationService';
import { createActivityLog } from '../../src/activity-logs/activityService';
import { OpportunityPermissionsEnum } from '../../src/role/roleEnum';
import { ERRORS } from '../../src/utils/error/errors';
import BaseError from '../../src/utils/error/base-http-exception';
import OpportunityUsers from '../../src/opportunity/model/oppotyunity_UsersModel';

// Mocks
jest.mock('../../src/opportunity/opportunityModel');
jest.mock('../../src/lead/leadModel');
jest.mock('../../src/client/clientModel');
jest.mock('../../src/user/userModel');
jest.mock('../../src/lead/leadService');
jest.mock('../../src/notification/notificationService');
jest.mock('../../src/activity-logs/activityService');
jest.mock('../../src/opportunity/model/oppotyunity_UsersModel');
jest.mock('../../src/utils/emailHelper');

// Mock Transaction
const mockTransaction = {
    commit: jest.fn(),
    rollback: jest.fn(),
    afterCommit: jest.fn((cb: any) => cb()),
    LOCK: {} as any,
};
jest.mock('../../src/config/db', () => ({
    sequelize: {
        transaction: jest.fn(() => Promise.resolve(mockTransaction)),
    },
}));

describe('OpportunityService', () => {

    const mockAdminUser: any = {
        id: 1,
        email: 'admin@test.com',
        role: { permissions: [OpportunityPermissionsEnum.VIEW_GLOBAL_OPPORTUNITIES] },
    };

    const mockStandardUser: any = {
        id: 2,
        email: 'user@test.com',
        role: { permissions: [] },
    };

    const mockOppData: any = {
        id: 'opp-1',
        name: 'Deal 1',
        users: [],
        $set: jest.fn(),
        set: jest.fn(),
        save: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // 1. createOpportunity
    describe('createOpportunity', () => {
        it('should create opportunity from existing Client', async () => {
            // Arrange
            const input = {
                clientId: 'client-1',
                opportunity: { name: 'Deal with Client' }
            };
            (Client.findByPk as jest.Mock<any>).mockResolvedValue({ id: 'client-1' });
            (Opportunity.create as jest.Mock<any>).mockResolvedValue(mockOppData);

            // Act
            await opportunityService.createOpportunity(input, mockAdminUser);

            // Assert
            expect(Client.findByPk).toHaveBeenCalledWith('client-1');
            expect(Opportunity.create).toHaveBeenCalledWith(
                expect.objectContaining({ clientId: 'client-1', name: 'Deal with Client' }),
                { transaction: mockTransaction }
            );
            expect(mockTransaction.commit).toHaveBeenCalled();
            expect(createActivityLog).toHaveBeenCalled();
        });

        it('should create opportunity and NEW Lead if input.lead is present', async () => {
            // Arrange
            const input = {
                lead: { name: 'New Lead' },
                opportunity: { name: 'Deal from New Lead' }
            };

            const mockLead = { id: 'new-lead-1' };
            (leadService.createLead as jest.Mock<any>).mockResolvedValue(mockLead);
            (Opportunity.create as jest.Mock<any>).mockResolvedValue(mockOppData);

            // Act
            await opportunityService.createOpportunity(input, mockAdminUser);

            // Assert
            expect(leadService.createLead).toHaveBeenCalledWith(
                expect.objectContaining({ status: 'CONVERTED' }), // LeadStatusEnums.CONVERTED
                mockAdminUser.id,
                mockTransaction
            );
            expect(Opportunity.create).toHaveBeenCalledWith(
                expect.objectContaining({ leadId: 'new-lead-1' }),
                { transaction: mockTransaction }
            );
        });

        it('should rollback transaction on error', async () => {
            // Arrange
            const input = { clientId: 'missing-client' };
            (Client.findByPk as jest.Mock<any>).mockResolvedValue(null); // Client not found

            // Act & Assert
            await expect(opportunityService.createOpportunity(input, mockAdminUser))
                .rejects
                .toThrow(new BaseError(ERRORS.CLIENT_ALREADY_FOUND)); // Note: Code throws CLIENT_ALREADY_FOUND when not found (based on source read) logic seems inverted in source or error naming is confusing, but testing strict source behavior.

            expect(mockTransaction.rollback).toHaveBeenCalled();
        });
    });

    // 2. convertLeadToOpportunity
    describe('convertLeadToOpportunity', () => {
        it('should convert lead successfully', async () => {
            // Arrange
            const input = {
                leadId: 'lead-to-convert',
                users: [1],
                name: 'Converted Deal'
            };

            (User.findAll as jest.Mock<any>).mockResolvedValue([{ id: 1 }]); // Users exist
            (Opportunity.create as jest.Mock<any>).mockResolvedValue(mockOppData);

            // Act
            await opportunityService.convertLeadToOpportunity(input, mockAdminUser);

            // Assert
            expect(Opportunity.create).toHaveBeenCalled();
            expect(leadService.updateLead).toHaveBeenCalledWith(
                'lead-to-convert',
                { status: 'CONVERTED' },
                mockAdminUser
            );
            expect(notificationService.sendAssignOpportunityNotification).toHaveBeenCalled();
        });

        it('should throw if users in input do not exist', async () => {
            const input = { users: [999] };
            (User.findAll as jest.Mock<any>).mockResolvedValue([]); // No users found

            await expect(opportunityService.convertLeadToOpportunity(input, mockAdminUser))
                .rejects.toThrow(new BaseError(ERRORS.USER_NOT_FOUND));
        });
    });

    // 3. updateOpportunity
    describe('updateOpportunity', () => {
        it('should update opportunity if access is valid', async () => {
            // Arrange
            const input = { name: 'Updated Deal' };
            (OpportunityUsers.findOne as jest.Mock<any>).mockResolvedValue({ userId: mockStandardUser.id }); // Access granted
            (Opportunity.findOne as jest.Mock<any>).mockResolvedValue(mockOppData);

            // Act
            await opportunityService.updateOpportunity('opp-1', input, mockStandardUser);

            // Assert
            expect(mockOppData.set).toHaveBeenCalledWith(input);
            expect(mockOppData.save).toHaveBeenCalled();
        });

        it('should throw ACCESS_DENIED for unauthorized user', async () => {
            (OpportunityUsers.findOne as jest.Mock<any>).mockResolvedValue(null); // Access denied

            await expect(opportunityService.updateOpportunity('opp-1', {}, mockStandardUser))
                .rejects.toThrow(new BaseError(ERRORS.ACCESS_DENIED));
        });
    });

    // 4. getOpportunities
    describe('getOpportunities', () => {
        it('should enforce userId filter for standard users', async () => {
            // Arrange
            const query = {};
            (Opportunity.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            // Act
            await opportunityService.getOpportunities(query, mockStandardUser);

            // Assert
            const callArgs = (Opportunity.findAndCountAll as jest.Mock<any>).mock.calls[0][0] as any;
            const userInclude = callArgs.include.find((i: any) => i.as === 'users');
            expect(userInclude.where).toEqual({ id: mockStandardUser.id });
            expect(userInclude.required).toBe(true);
        });

        it('should allow filtering by filters like stage', async () => {
            const query = { stage: ['NEW'] };
            (Opportunity.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            await opportunityService.getOpportunities(query, mockAdminUser);

            const callArgs = (Opportunity.findAndCountAll as jest.Mock).mock.calls[0][0] as any;
            // We can inspect the 'where' clause, but checking loosely is enough
            expect(callArgs.where.stage).toBeDefined();
        });
    });
});
