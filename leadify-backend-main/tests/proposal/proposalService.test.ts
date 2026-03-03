
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import proposalService from '../../src/proposal/proposalService';
import Proposal from '../../src/proposal/models/proposalModel';
import User from '../../src/user/userModel';
import proposalLogService from '../../src/proposalLog/proposalLogService';
import notificationService from '../../src/notification/notificationService';
import uploaderService from '../../src/uploader/uploader.service';
import ProposalUsers from '../../src/proposal/models/proposal_UsersModel';
import { ProposalStatusEnum } from '../../src/proposal/proposalEnum';
import { ERRORS } from '../../src/utils/error/errors';
import BaseError from '../../src/utils/error/base-http-exception';

// Mocks
jest.mock('../../src/config/db', () => ({
    sequelize: { transaction: jest.fn(), define: jest.fn() }
}));
jest.mock('../../src/server', () => ({
    io: { emit: jest.fn() }
}));
jest.mock('../../src/proposal/models/proposalModel');
jest.mock('../../src/user/userModel');
jest.mock('../../src/proposalLog/proposalLogService');
jest.mock('../../src/notification/notificationService');
jest.mock('../../src/uploader/uploader.service');
jest.mock('../../src/proposal/models/proposal_UsersModel');
jest.mock('../../src/utils/emailHelper');

describe('ProposalService', () => {

    // Mock Data
    const mockUser: any = {
        id: 1,
        email: 'creator@test.com',
        role: { permissions: [] } // Standard user
    };

    const mockAdmin: any = {
        id: 99,
        role: { permissions: ['VIEW_GLOBAL_PROPOSALS'] }
    };

    const mockProposalData: any = {
        id: 'prop-1',
        title: 'Website Redesign',
        reference: 'REF-001',
        status: ProposalStatusEnum.DRAFT,
        users: [{ id: 1 }],
        $set: jest.fn(),
        $add: jest.fn(),
        $remove: jest.fn(),
        update: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
        save: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue({})
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // 1. createProposal
    describe('createProposal', () => {
        it('should create proposal successfully', async () => {
            // Arrange
            const input = { title: 'New Proposal', reference: 'REF-NEW' };
            (Proposal.findOne as jest.Mock<any>).mockResolvedValue(null); // No duplicate ref
            (Proposal.create as jest.Mock<any>).mockResolvedValue(mockProposalData);

            // Act
            const result = await proposalService.createProposal(input, mockUser);

            // Assert
            expect(Proposal.create).toHaveBeenCalled();
            expect(proposalLogService.createProposalLog).toHaveBeenCalled();
            expect(notificationService.sendProposalAssignUsersNotification).toHaveBeenCalled();
            expect(mockProposalData.$set).toHaveBeenCalledWith('users', [mockUser.id]); // Auto-assign creator
        });

        it('should throw if reference already exists', async () => {
            const input = { reference: 'EXISTING' };
            (Proposal.findOne as jest.Mock<any>).mockResolvedValue({ id: 'other-prop' });

            await expect(proposalService.createProposal(input, mockUser))
                .rejects
                .toThrow(new BaseError(ERRORS.REFERENCE_ALREADY_EXISTS));
        });
    });

    // 2. approveProposal
    describe('approveProposal', () => {
        it('should approve proposal if access valid and not already approved', async () => {
            // Arrange
            (ProposalUsers.findOne as jest.Mock<any>).mockResolvedValue({ userId: mockUser.id }); // Access granted
            (Proposal.findOne as jest.Mock<any>).mockResolvedValue(mockProposalData);

            // Act
            await proposalService.approveProposal('prop-1', mockUser);

            // Assert
            expect(mockProposalData.update).toHaveBeenCalledWith({ status: ProposalStatusEnum.APPROVED });
            expect(notificationService.sendApproveProposalNotification).toHaveBeenCalled();
        });

        it('should throw if proposal is already approved', async () => {
            // Arrange
            const approvedProp = { ...mockProposalData, status: ProposalStatusEnum.APPROVED };
            (ProposalUsers.findOne as jest.Mock<any>).mockResolvedValue({ userId: mockUser.id });
            (Proposal.findOne as jest.Mock<any>).mockResolvedValue(approvedProp);

            // Act & Assert
            await expect(proposalService.approveProposal('prop-1', mockUser))
                .rejects.toThrow(new BaseError(ERRORS.PROPOSAL_ALREADY_APPROVED));
        });
    });

    // 3. getProposals (Data Retrieval)
    describe('getProposals', () => {
        it('should filter by userId for standard users', async () => {
            // Arrange
            const query = { page: 1, limit: 10 };
            (Proposal.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            // Act
            await proposalService.getProposals(query, mockUser);

            // Assert
            const callArgs = (Proposal.findAndCountAll as jest.Mock<any>).mock.calls[0][0] as any;
            const userInclude = callArgs.include.find((i: any) => i.as === 'users');
            expect(userInclude.where).toEqual({ id: mockUser.id });
            expect(userInclude.required).toBe(true);
        });

        it('should NOT filter by userId for admins', async () => {
            const query = {};
            (Proposal.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            await proposalService.getProposals(query, mockAdmin);

            const callArgs = (Proposal.findAndCountAll as jest.Mock).mock.calls[0][0] as any;
            const userInclude = callArgs.include.find((i: any) => i.as === 'users');
            expect(userInclude.where).toBeUndefined(); // No ID filter
        });
    });
});
