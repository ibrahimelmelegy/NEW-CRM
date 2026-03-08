
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
jest.mock('../../src/activity-logs/model/dealActivities', () => ({
    DealActivity: { destroy: jest.fn().mockImplementation(() => Promise.resolve(0)) }
}));
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
        destroy: jest.fn(),
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

        it('should pass joined tables to findOne', async () => {
            const joinedTables = [{ model: User, as: 'users' }];
            (Deal.findOne as jest.Mock<any>).mockResolvedValue(mockDealData);

            await dealService.dealOrError({ id: 'deal-123' }, joinedTables);

            expect(Deal.findOne).toHaveBeenCalledWith(
                expect.objectContaining({ include: joinedTables })
            );
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

        it('should handle pagination math correctly', async () => {
            (Deal.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 55 });

            const result = await dealService.getDeals({ page: 2, limit: 20 } as any, mockAdminUser);

            expect(Deal.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    limit: 20,
                    offset: 20, // (2-1)*20
                })
            );
            expect(result.pagination.totalPages).toBe(3); // ceil(55/20)
        });

        it('should filter by stage array', async () => {
            (Deal.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            await dealService.getDeals({
                page: 1,
                limit: 10,
                stage: [DealStageEnums.PROGRESS, DealStageEnums.NEGOTIATION]
            } as any, mockAdminUser);

            const callArgs = (Deal.findAndCountAll as jest.Mock<any>).mock.calls[0][0] as any;
            expect(callArgs.where.stage).toBeDefined();
        });

        it('should filter by price range', async () => {
            (Deal.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            await dealService.getDeals({
                page: 1,
                limit: 10,
                fromPrice: 1000,
                toPrice: 50000
            } as any, mockAdminUser);

            const callArgs = (Deal.findAndCountAll as jest.Mock<any>).mock.calls[0][0] as any;
            expect(callArgs.where.price).toBeDefined();
        });

        it('should filter by date range', async () => {
            (Deal.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            await dealService.getDeals({
                page: 1,
                limit: 10,
                fromDate: '2025-01-01',
                toDate: '2025-12-31'
            } as any, mockAdminUser);

            const callArgs = (Deal.findAndCountAll as jest.Mock<any>).mock.calls[0][0] as any;
            expect(callArgs.where.createdAt).toBeDefined();
        });
    });

    // --------------------------------------------------------------------------
    // 4. convertLeadTODeal
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

        it('should handle deal with no users array gracefully', async () => {
            // When deal.users is empty or not array, should still validate
            (User.findAll as jest.Mock<any>).mockResolvedValue([]);
            (Deal.findOne as jest.Mock<any>).mockResolvedValue(null); // no duplicate

            const input: any = {
                deal: { name: 'Test', companyName: 'Corp' }, // no users
                clientId: 'client-1',
            };

            const clientService = require('../../src/client/clientService').default;
            clientService.clientOrError = (jest.fn() as jest.Mock<any>).mockResolvedValue({ id: 'client-1' });

            (Deal.create as jest.Mock<any>).mockResolvedValue({
                id: 'deal-new',
                $set: jest.fn(),
                toJSON: jest.fn(() => ({ id: 'deal-new' })),
            });

            // Should not throw USER_NOT_FOUND since no users were provided
            const result = await dealService.createDeal(input, mockAdminUser);
            expect(result).toBeDefined();
        });
    });

    // --------------------------------------------------------------------------
    // 6. updateDealStage
    // --------------------------------------------------------------------------
    describe('updateDealStage', () => {
        it('should update deal stage successfully', async () => {
            (DealUsers.findOne as jest.Mock<any>).mockResolvedValue({ dealId: 'deal-123', userId: 1 });
            (Deal.findOne as jest.Mock<any>).mockResolvedValue(mockDealData);

            const result = await dealService.updateDealStage('deal-123', DealStageEnums.NEGOTIATION, mockAdminUser);

            expect(mockDealData.set).toHaveBeenCalledWith({ stage: DealStageEnums.NEGOTIATION, probability: 50 });
            expect(mockDealData.save).toHaveBeenCalled();
        });

        it('should reject CONVERTED stage as invalid', async () => {
            (Deal.findOne as jest.Mock<any>).mockResolvedValue(mockDealData);

            await expect(dealService.updateDealStage('deal-123', DealStageEnums.CONVERTED, mockAdminUser))
                .rejects.toThrow(new BaseError(ERRORS.SOMETHING_WENT_WRONG));
        });

        it('should emit deal:stage_changed socket event', async () => {
            const { io } = require('../../src/server');
            (Deal.findOne as jest.Mock<any>).mockResolvedValue(mockDealData);

            await dealService.updateDealStage('deal-123', DealStageEnums.NEGOTIATION, mockAdminUser);

            expect(io.emit).toHaveBeenCalledWith('deal:stage_changed', expect.objectContaining({
                dealId: 'deal-123',
                fromStage: DealStageEnums.PROGRESS,
                toStage: DealStageEnums.NEGOTIATION,
                userId: mockAdminUser.id,
            }));
        });

        it('should emit deal:won when stage changes to CLOSED', async () => {
            const { io } = require('../../src/server');
            const projectService = require('../../src/project/projectService').default;
            projectService.createProject = (jest.fn() as jest.Mock<any>).mockResolvedValue({});

            (Deal.findOne as jest.Mock<any>).mockResolvedValue(mockDealData);

            await dealService.updateDealStage('deal-123', DealStageEnums.CLOSED, mockAdminUser);

            expect(io.emit).toHaveBeenCalledWith('deal:won', expect.objectContaining({
                dealId: 'deal-123',
                name: mockDealData.name,
                price: mockDealData.price,
            }));
        });

        it('should emit deal:lost when stage changes to CANCELLED', async () => {
            const { io } = require('../../src/server');
            (Deal.findOne as jest.Mock<any>).mockResolvedValue(mockDealData);

            await dealService.updateDealStage('deal-123', DealStageEnums.CANCELLED, mockAdminUser);

            expect(io.emit).toHaveBeenCalledWith('deal:lost', expect.objectContaining({
                dealId: 'deal-123',
            }));
        });

        it('should reject invalid stage transitions (PROGRESS -> ARCHIVED)', async () => {
            (Deal.findOne as jest.Mock<any>).mockResolvedValue(mockDealData);

            await expect(dealService.updateDealStage('deal-123', DealStageEnums.ARCHIVED, mockAdminUser))
                .rejects.toThrow(new BaseError(ERRORS.INVALID_STAGE_TRANSITION));
        });

        it('should validate access before updating stage', async () => {
            (DealUsers.findOne as jest.Mock<any>).mockResolvedValue(null);

            await expect(dealService.updateDealStage('deal-123', DealStageEnums.NEGOTIATION, mockStandardUser))
                .rejects.toThrow(new BaseError(ERRORS.ACCESS_DENIED));
        });

        it('should auto-create project when deal stage changes to CLOSED', async () => {
            const projectService = require('../../src/project/projectService').default;
            projectService.createProject = (jest.fn() as jest.Mock<any>).mockResolvedValue({});

            (Deal.findOne as jest.Mock<any>).mockResolvedValue(mockDealData);

            await dealService.updateDealStage('deal-123', DealStageEnums.CLOSED, mockAdminUser);

            expect(projectService.createProject).toHaveBeenCalledWith(
                expect.objectContaining({
                    basicInfo: expect.objectContaining({
                        name: expect.stringContaining(mockDealData.name),
                        clientId: mockDealData.clientId,
                        dealId: mockDealData.id,
                    })
                }),
                mockAdminUser
            );
        });

        it('should not fail if auto-project creation fails (graceful degradation)', async () => {
            const projectService = require('../../src/project/projectService').default;
            projectService.createProject = (jest.fn() as jest.Mock<any>).mockRejectedValue(new Error('Project creation failed'));
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            (Deal.findOne as jest.Mock<any>).mockResolvedValue(mockDealData);

            // Should not throw even though project creation failed
            await expect(dealService.updateDealStage('deal-123', DealStageEnums.CLOSED, mockAdminUser))
                .resolves.not.toThrow();

            consoleSpy.mockRestore();
        });
    });

    // --------------------------------------------------------------------------
    // 7. deleteDeal
    // --------------------------------------------------------------------------
    describe('deleteDeal', () => {
        it('should delete deal successfully for admin', async () => {
            (Deal.findOne as jest.Mock<any>).mockResolvedValue(mockDealData);

            await dealService.deleteDeal('deal-123', mockAdminUser);

            expect(mockDealData.destroy).toHaveBeenCalled();
        });

        it('should throw DEAL_NOT_FOUND if deal does not exist', async () => {
            (Deal.findOne as jest.Mock<any>).mockResolvedValue(null);

            await expect(dealService.deleteDeal('nonexistent', mockAdminUser))
                .rejects.toThrow(new BaseError(ERRORS.DEAL_NOT_FOUND));
        });

        it('should throw ACCESS_DENIED for unassigned standard user', async () => {
            (DealUsers.findOne as jest.Mock<any>).mockResolvedValue(null);

            await expect(dealService.deleteDeal('deal-123', mockStandardUser))
                .rejects.toThrow(new BaseError(ERRORS.ACCESS_DENIED));
        });

        it('should allow assigned standard user to delete deal', async () => {
            (DealUsers.findOne as jest.Mock<any>).mockResolvedValue({ dealId: 'deal-123', userId: 2 });
            (Deal.findOne as jest.Mock<any>).mockResolvedValue(mockDealData);

            await dealService.deleteDeal('deal-123', mockStandardUser);

            expect(mockDealData.destroy).toHaveBeenCalled();
        });
    });

    // --------------------------------------------------------------------------
    // 8. getDealById
    // --------------------------------------------------------------------------
    describe('getDealById', () => {
        it('should return deal with includes for admin', async () => {
            (Deal.findOne as jest.Mock<any>).mockResolvedValue(mockDealData);

            const result = await dealService.getDealById('deal-123', mockAdminUser);

            expect(result).toEqual(mockDealData);
            expect(Deal.findOne).toHaveBeenCalledWith(
                expect.objectContaining({
                    include: expect.arrayContaining([
                        expect.objectContaining({ model: User, as: 'users' }),
                        expect.objectContaining({ model: Client, as: 'client' }),
                    ])
                })
            );
        });

        it('should throw DEAL_NOT_FOUND when deal does not exist', async () => {
            (Deal.findOne as jest.Mock<any>).mockResolvedValue(null);

            await expect(dealService.getDealById('nonexistent', mockAdminUser))
                .rejects.toThrow(new BaseError(ERRORS.DEAL_NOT_FOUND));
        });

        it('should validate access before fetching', async () => {
            (DealUsers.findOne as jest.Mock<any>).mockResolvedValue(null);

            await expect(dealService.getDealById('deal-123', mockStandardUser))
                .rejects.toThrow(new BaseError(ERRORS.ACCESS_DENIED));
        });
    });

    // --------------------------------------------------------------------------
    // 9. getWeightedPipeline
    // --------------------------------------------------------------------------
    describe('getWeightedPipeline', () => {
        it('should compute weighted pipeline correctly', async () => {
            (Deal.findAll as jest.Mock<any>).mockResolvedValue([
                { id: 'd1', price: 10000, probability: 50, stage: DealStageEnums.PROGRESS },
                { id: 'd2', price: 20000, probability: 75, stage: DealStageEnums.NEGOTIATION },
            ]);

            const result = await dealService.getWeightedPipeline();

            expect(result.dealCount).toBe(2);
            expect(result.totalPipelineValue).toBe(30000);
            // d1 weighted: 10000 * 0.50 = 5000, d2 weighted: 20000 * 0.75 = 15000
            expect(result.weightedValue).toBe(20000);
            expect(result.byStage[DealStageEnums.PROGRESS]).toBeDefined();
            expect(result.byStage[DealStageEnums.PROGRESS].count).toBe(1);
            expect(result.byStage[DealStageEnums.NEGOTIATION].count).toBe(1);
        });

        it('should return zeros when no active deals', async () => {
            (Deal.findAll as jest.Mock<any>).mockResolvedValue([]);

            const result = await dealService.getWeightedPipeline();

            expect(result.dealCount).toBe(0);
            expect(result.totalPipelineValue).toBe(0);
            expect(result.weightedValue).toBe(0);
        });

        it('should handle deals with zero price or probability', async () => {
            (Deal.findAll as jest.Mock<any>).mockResolvedValue([
                { id: 'd1', price: 0, probability: 50, stage: DealStageEnums.PROGRESS },
                { id: 'd2', price: 5000, probability: 0, stage: DealStageEnums.PROGRESS },
            ]);

            const result = await dealService.getWeightedPipeline();

            expect(result.dealCount).toBe(2);
            expect(result.totalPipelineValue).toBe(5000);
            expect(result.weightedValue).toBe(0); // 0*0.5 + 5000*0 = 0
        });

        it('should calculate average probability correctly', async () => {
            (Deal.findAll as jest.Mock<any>).mockResolvedValue([
                { id: 'd1', price: 10000, probability: 25, stage: DealStageEnums.PROGRESS },
                { id: 'd2', price: 10000, probability: 75, stage: DealStageEnums.PROGRESS },
            ]);

            const result = await dealService.getWeightedPipeline();

            expect(result.byStage[DealStageEnums.PROGRESS].avgProbability).toBe(50);
        });
    });

    // --------------------------------------------------------------------------
    // 10. getStaleDealAlerts
    // --------------------------------------------------------------------------
    describe('getStaleDealAlerts', () => {
        it('should return stale deals with daysStale calculated', async () => {
            const staleDate = new Date();
            staleDate.setDate(staleDate.getDate() - 20);

            (Deal.findAll as jest.Mock<any>).mockResolvedValue([
                {
                    toJSON: () => ({
                        id: 'd1',
                        name: 'Stale Deal',
                        updatedAt: staleDate.toISOString(),
                    }),
                },
            ]);

            const result = await dealService.getStaleDealAlerts();

            expect(result).toHaveLength(1);
            expect(result[0].daysStale).toBeGreaterThanOrEqual(19); // Account for test execution time
            expect(result[0].name).toBe('Stale Deal');
        });

        it('should return empty array when no stale deals', async () => {
            (Deal.findAll as jest.Mock<any>).mockResolvedValue([]);

            const result = await dealService.getStaleDealAlerts();

            expect(result).toEqual([]);
        });

        it('should accept custom staleDays parameter', async () => {
            (Deal.findAll as jest.Mock<any>).mockResolvedValue([]);

            await dealService.getStaleDealAlerts(undefined, 30);

            expect(Deal.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        updatedAt: expect.anything(),
                    })
                })
            );
        });
    });

    // --------------------------------------------------------------------------
    // 11. getWinLossAnalysis
    // --------------------------------------------------------------------------
    describe('getWinLossAnalysis', () => {
        it('should compute win/loss stats correctly', async () => {
            const now = new Date();
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

            (Deal.findAll as jest.Mock<any>).mockResolvedValue([
                { id: 'd1', price: 10000, stage: DealStageEnums.CLOSED, createdAt: oneMonthAgo, updatedAt: now },
                { id: 'd2', price: 5000, stage: DealStageEnums.CLOSED, createdAt: oneMonthAgo, updatedAt: now },
                { id: 'd3', price: 8000, stage: DealStageEnums.CANCELLED, createdAt: oneMonthAgo, updatedAt: now },
            ]);

            const result = await dealService.getWinLossAnalysis();

            expect(result.totalWon).toBe(2);
            expect(result.totalLost).toBe(1);
            // winRate = 2/3 * 100 = 66.67%
            expect(result.winRate).toBeCloseTo(66.67, 1);
            expect(result.avgWonDealSize).toBe(7500); // (10000+5000)/2
            expect(result.avgLostDealSize).toBe(8000);
        });

        it('should return zeros when no deals', async () => {
            (Deal.findAll as jest.Mock<any>).mockResolvedValue([]);

            const result = await dealService.getWinLossAnalysis();

            expect(result.totalWon).toBe(0);
            expect(result.totalLost).toBe(0);
            expect(result.winRate).toBe(0);
            expect(result.avgWonDealSize).toBe(0);
            expect(result.avgLostDealSize).toBe(0);
            expect(result.avgDaysToClose).toBe(0);
        });

        it('should group by month correctly', async () => {
            const jan2026 = new Date('2026-01-15');
            const feb2026 = new Date('2026-02-15');

            (Deal.findAll as jest.Mock<any>).mockResolvedValue([
                { id: 'd1', price: 10000, stage: DealStageEnums.CLOSED, createdAt: jan2026, updatedAt: jan2026 },
                { id: 'd2', price: 5000, stage: DealStageEnums.CANCELLED, createdAt: feb2026, updatedAt: feb2026 },
            ]);

            const result = await dealService.getWinLossAnalysis();

            expect(result.byMonth).toHaveLength(2);
            expect(result.byMonth[0].month).toBe('2026-01');
            expect(result.byMonth[0].won).toBe(1);
            expect(result.byMonth[1].month).toBe('2026-02');
            expect(result.byMonth[1].lost).toBe(1);
        });

        it('should accept period filter', async () => {
            (Deal.findAll as jest.Mock<any>).mockResolvedValue([]);

            await dealService.getWinLossAnalysis(undefined, { from: '2025-01-01', to: '2025-12-31' });

            const callArgs = (Deal.findAll as jest.Mock<any>).mock.calls[0][0] as any;
            expect(callArgs.where.updatedAt).toBeDefined();
        });
    });

    // --------------------------------------------------------------------------
    // 12. getKanbanDeals
    // --------------------------------------------------------------------------
    describe('getKanbanDeals', () => {
        it('should return deals grouped by stage for admin', async () => {
            (Deal.findAll as jest.Mock<any>).mockResolvedValue([
                { ...mockDealData, stage: DealStageEnums.PROGRESS },
                { ...mockDealData, id: 'deal-456', stage: DealStageEnums.NEGOTIATION },
            ]);

            const result = await dealService.getKanbanDeals(mockAdminUser);

            expect(result[DealStageEnums.PROGRESS]).toBeDefined();
            expect(result[DealStageEnums.NEGOTIATION]).toBeDefined();
            expect(result[DealStageEnums.CLOSED]).toBeDefined();
            expect(result[DealStageEnums.CANCELLED]).toBeDefined();
            expect(result[DealStageEnums.ARCHIVED]).toBeDefined();
        });

        it('should return empty groups when no deals', async () => {
            (Deal.findAll as jest.Mock<any>).mockResolvedValue([]);

            const result = await dealService.getKanbanDeals(mockAdminUser);

            expect(result[DealStageEnums.PROGRESS]).toEqual([]);
            expect(result[DealStageEnums.NEGOTIATION]).toEqual([]);
        });

        it('should restrict to user deals for non-admin', async () => {
            (Deal.findAll as jest.Mock<any>).mockResolvedValue([]);

            await dealService.getKanbanDeals(mockStandardUser);

            expect(Deal.findAll).toHaveBeenCalledWith(
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
    });

    // --------------------------------------------------------------------------
    // 13. createDealInvoice / createDealDeliveryDetails
    // --------------------------------------------------------------------------
    describe('createDealInvoice', () => {
        it('should bulk create invoices with deal id', async () => {
            (Invoice.bulkCreate as jest.Mock<any>).mockResolvedValue([]);

            const invoices = [
                { amount: 1000, description: 'Phase 1' },
                { amount: 2000, description: 'Phase 2' },
            ];

            await dealService.createDealInvoice('deal-123', invoices as any);

            expect(Invoice.bulkCreate).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ dealId: 'deal-123', amount: 1000 }),
                    expect.objectContaining({ dealId: 'deal-123', amount: 2000 }),
                ]),
                expect.anything()
            );
        });
    });

    describe('createDealDeliveryDetails', () => {
        it('should bulk create delivery details with deal id', async () => {
            (DealDelivery.bulkCreate as jest.Mock<any>).mockResolvedValue([]);

            const deliveries = [
                { name: 'Delivery 1', date: '2026-03-01' },
            ];

            await dealService.createDealDeliveryDetails('deal-123', deliveries as any);

            expect(DealDelivery.bulkCreate).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ dealId: 'deal-123' }),
                ]),
                expect.anything()
            );
        });
    });
});
