
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import dealService from '../../src/deal/dealService';
import Deal from '../../src/deal/model/dealModel';
import DealUsers from '../../src/deal/model/deal_UsersModel';
import Client from '../../src/client/clientModel';
import Lead from '../../src/lead/leadModel';
import Opportunity from '../../src/opportunity/opportunityModel';
import User from '../../src/user/userModel';
import Invoice from '../../src/deal/model/invoiceMode';
import DealDelivery from '../../src/deal/model/dealDeliveryModel';
import BaseError from '../../src/utils/error/base-http-exception';
import { ERRORS } from '../../src/utils/error/errors';
import { DealPermissionsEnum } from '../../src/role/roleEnum';
import { DealStageEnums } from '../../src/deal/dealEnum';

// Mocks
jest.mock('../../src/deal/model/dealModel');
jest.mock('../../src/deal/model/deal_UsersModel');
jest.mock('../../src/deal/model/dealDeliveryModel');
jest.mock('../../src/deal/model/invoiceMode');
jest.mock('../../src/client/clientModel');
jest.mock('../../src/lead/leadModel');
jest.mock('../../src/opportunity/opportunityModel');
jest.mock('../../src/user/userModel');
jest.mock('../../src/lead/leadService');
jest.mock('../../src/client/clientService');
jest.mock('../../src/project/projectService');
jest.mock('../../src/user/userService');
jest.mock('../../src/notification/notificationService');
jest.mock('../../src/activity-logs/activityService');
jest.mock('../../src/utils/emailHelper');
jest.mock('../../src/server', () => ({
    io: { emit: jest.fn() }
}));

const mockTransaction = {
    commit: jest.fn(),
    rollback: jest.fn(),
    afterCommit: jest.fn((cb: any) => cb()),
};

jest.mock('../../src/config/db', () => ({
    sequelize: {
        transaction: jest.fn(() => Promise.resolve(mockTransaction)),
    },
}));

describe('DealService', () => {
    const mockAdminUser: any = {
        id: 1,
        email: 'admin@test.com',
        role: { permissions: [DealPermissionsEnum.VIEW_GLOBAL_DEALS] },
    };

    const mockStandardUser: any = {
        id: 2,
        email: 'user@test.com',
        role: { permissions: [] },
    };

    const mockDealData: any = {
        id: 'deal-123',
        name: 'Test Deal',
        companyName: 'Test Corp',
        price: 5000,
        stage: DealStageEnums.PROGRESS,
        users: [{ id: 1 }],
        clientId: 'client-1',
        $set: jest.fn(),
        set: jest.fn(),
        save: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
        toJSON: jest.fn(() => ({
            id: 'deal-123',
            name: 'Test Deal',
            companyName: 'Test Corp',
        })),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------------------------------
    // 1. validateDealAccess
    // --------------------------------------------------------------------------
    describe('validateDealAccess', () => {
        it('should allow admin with VIEW_GLOBAL_DEALS permission', async () => {
            await expect(dealService.validateDealAccess('deal-123', mockAdminUser))
                .resolves.not.toThrow();
        });

        it('should allow standard user who is assigned to deal', async () => {
            (DealUsers.findOne as jest.Mock<any>).mockResolvedValue({ dealId: 'deal-123', userId: 2 });
            await expect(dealService.validateDealAccess('deal-123', mockStandardUser))
                .resolves.not.toThrow();
        });

        it('should throw ACCESS_DENIED for unassigned standard user', async () => {
            (DealUsers.findOne as jest.Mock<any>).mockResolvedValue(null);
            await expect(dealService.validateDealAccess('deal-123', mockStandardUser))
                .rejects.toThrow(new BaseError(ERRORS.ACCESS_DENIED));
        });
    });

    // --------------------------------------------------------------------------
    // 2. dealOrError
    // --------------------------------------------------------------------------
    describe('dealOrError', () => {
        it('should return deal when found', async () => {
            (Deal.findOne as jest.Mock<any>).mockResolvedValue(mockDealData);
            const result = await dealService.dealOrError({ id: 'deal-123' });
            expect(result).toEqual(mockDealData);
        });

        it('should throw DEAL_NOT_FOUND when not found', async () => {
            (Deal.findOne as jest.Mock<any>).mockResolvedValue(null);
            await expect(dealService.dealOrError({ id: 'nonexistent' }))
                .rejects.toThrow(new BaseError(ERRORS.DEAL_NOT_FOUND));
        });
    });

    // --------------------------------------------------------------------------
    // 3. getDeals
    // --------------------------------------------------------------------------
    describe('getDeals', () => {
        it('should return paginated deals for admin', async () => {
            const mockRows = [mockDealData];
            (Deal.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: mockRows, count: 1 });

            const result = await dealService.getDeals({ page: 1, limit: 10 } as any, mockAdminUser);

            expect(result.docs).toEqual(mockRows);
            expect(result.pagination.totalItems).toBe(1);
            expect(result.pagination.totalPages).toBe(1);
        });

        it('should enforce userId filter for non-admin user', async () => {
            (Deal.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            await dealService.getDeals({ page: 1, limit: 10 } as any, mockStandardUser);

            expect(Deal.findAndCountAll).toHaveBeenCalledWith(
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
            (Deal.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            await dealService.getDeals({ page: 1, limit: 10, searchKey: 'acme' } as any, mockAdminUser);

            const callArgs = (Deal.findAndCountAll as jest.Mock<any>).mock.calls[0][0] as any;
            // Op.or is a Symbol, so we check the where has a symbol key for search
            const symbolKeys = Object.getOwnPropertySymbols(callArgs.where);
            expect(symbolKeys.length).toBeGreaterThan(0); // Op.or symbol present
        });
    });

    // --------------------------------------------------------------------------
    // 4. convertLeadToDeal
    // --------------------------------------------------------------------------
    describe('convertLeadTODeal', () => {
        it('should throw CLIENT_ALREADY_FOUND when client email exists', async () => {
            const leadService = require('../../src/lead/leadService').default;
            leadService.leadOrError = (jest.fn() as jest.Mock<any>).mockResolvedValue({
                id: 'lead-1',
                name: 'Lead',
                email: 'exists@test.com',
                phone: '+111',
                companyName: 'Corp',
                set: jest.fn(),
                save: jest.fn(),
            });

            (Client.findOne as jest.Mock<any>).mockResolvedValue({ id: 'existing-client' });

            const input: any = {
                leadId: 'lead-1',
                name: 'New Deal',
                companyName: 'Corp',
                users: [1],
            };

            await expect(dealService.convertLeadTODeal(input, mockAdminUser))
                .rejects.toThrow();
            expect(mockTransaction.rollback).toHaveBeenCalled();
        });

        it('should throw DEAL_ALREADY_EXIST when duplicate deal name+company', async () => {
            const leadService = require('../../src/lead/leadService').default;
            leadService.leadOrError = (jest.fn() as jest.Mock<any>).mockResolvedValue({
                id: 'lead-1',
                name: 'Lead',
                email: 'new@test.com',
                phone: '+111',
                companyName: 'Corp',
                set: jest.fn(),
                save: jest.fn(),
            });

            (Client.findOne as jest.Mock<any>).mockResolvedValue(null);
            (Client.create as jest.Mock<any>).mockResolvedValue({ id: 'new-client' });
            (Deal.findOne as jest.Mock<any>).mockResolvedValue({ name: 'Existing Deal' }); // duplicate

            const input: any = {
                leadId: 'lead-1',
                name: 'Existing Deal',
                companyName: 'Corp',
                users: [1],
            };

            await expect(dealService.convertLeadTODeal(input, mockAdminUser))
                .rejects.toThrow();
            expect(mockTransaction.rollback).toHaveBeenCalled();
        });
    });

    // --------------------------------------------------------------------------
    // 5. createDeal
    // --------------------------------------------------------------------------
    describe('createDeal', () => {
        it('should throw USER_NOT_FOUND when no valid users', async () => {
            (User.findAll as jest.Mock<any>).mockResolvedValue([]);

            const input: any = {
                deal: { name: 'Test', companyName: 'Corp', users: [999] },
            };

            await expect(dealService.createDeal(input, mockAdminUser))
                .rejects.toThrow(new BaseError(ERRORS.USER_NOT_FOUND));
        });

        it('should throw DEAL_ALREADY_EXIST when duplicate name+company', async () => {
            (User.findAll as jest.Mock<any>).mockResolvedValue([mockAdminUser]);
            (Deal.findOne as jest.Mock<any>).mockResolvedValue({ name: 'Dup' });

            const input: any = {
                deal: { name: 'Dup', companyName: 'Corp', users: [1] },
            };

            await expect(dealService.createDeal(input, mockAdminUser))
                .rejects.toThrow(new BaseError(ERRORS.DEAL_ALREADY_EXIST));
        });
    });

    // --------------------------------------------------------------------------
    // 6. updateDealStage
    // --------------------------------------------------------------------------
    describe('updateDealStage', () => {
        it('should update deal stage successfully', async () => {
            (DealUsers.findOne as jest.Mock<any>).mockResolvedValue({ dealId: 'deal-123', userId: 1 });
            (Deal.findOne as jest.Mock<any>).mockResolvedValue(mockDealData);

            const result = await dealService.updateDealStage('deal-123', DealStageEnums.CLOSED, mockAdminUser);

            expect(mockDealData.set).toHaveBeenCalledWith({ stage: DealStageEnums.CLOSED });
            expect(mockDealData.save).toHaveBeenCalled();
        });

        it('should reject CONVERTED stage as invalid', async () => {
            (Deal.findOne as jest.Mock<any>).mockResolvedValue(mockDealData);

            await expect(dealService.updateDealStage('deal-123', DealStageEnums.CONVERTED, mockAdminUser))
                .rejects.toThrow(new BaseError(ERRORS.SOMETHING_WENT_WRONG));
        });
    });
});
