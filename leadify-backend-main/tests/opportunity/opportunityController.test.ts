
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import opportunityController from '../../src/opportunity/opportunityController';
import opportunityService from '../../src/opportunity/opportunityService';
import { wrapResult } from '../../src/utils/response/responseWrapper';
import { NextFunction, Response } from 'express';

// Mocks
jest.mock('../../src/opportunity/opportunityService');
jest.mock('../../src/utils/response/responseWrapper');

describe('OpportunityController', () => {
    let req: any;
    let res: any;
    let next: NextFunction;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            body: {},
            params: {},
            query: {},
            user: { id: 1, email: 'admin@test.com' } // Mock Authenticated User
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as unknown as Response;

        next = jest.fn() as NextFunction;
    });

    // 1. createOpportunity
    describe('createOpportunity', () => {
        it('should call service.createOpportunity and wrapResult with 201', async () => {
            // Arrange
            req.body = { name: 'New Deal' };
            const mockResult = { id: 1, name: 'New Deal' };
            (opportunityService.createOpportunity as jest.Mock<any>).mockResolvedValue(mockResult);

            // Act
            await opportunityController.createOpportunity(req, res, next);

            // Assert
            expect(opportunityService.createOpportunity).toHaveBeenCalledWith(req.body, req.user);
            expect(wrapResult).toHaveBeenCalledWith(res, mockResult, 201);
        });

        it('should call next(error) on service failure', async () => {
            const error = new Error('Create failed');
            (opportunityService.createOpportunity as jest.Mock<any>).mockRejectedValue(error);

            await opportunityController.createOpportunity(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    // 2. convertLeadToOpportunity
    describe('convertLeadToOpportunity', () => {
        it('should call service.convertLeadToOpportunity and wrapResult with 201', async () => {
            // Arrange
            req.body = { leadId: 'lead-1' };
            const mockResult = { id: 2, name: 'Converted Deal' };
            (opportunityService.convertLeadToOpportunity as jest.Mock<any>).mockResolvedValue(mockResult);

            // Act
            await opportunityController.convertLeadToOpportunity(req, res, next);

            // Assert
            expect(opportunityService.convertLeadToOpportunity).toHaveBeenCalledWith(req.body, req.user);
            expect(wrapResult).toHaveBeenCalledWith(res, mockResult, 201);
        });
    });

    // 3. updateOpportunity
    describe('updateOpportunity', () => {
        it('should call service.updateOpportunity and wrapResult', async () => {
            // Arrange
            req.params.id = 'opp-1';
            req.body = { stage: 'NEGOTIATION' };
            const mockResult = { id: 'opp-1', stage: 'NEGOTIATION' };
            (opportunityService.updateOpportunity as jest.Mock<any>).mockResolvedValue(mockResult);

            // Act
            await opportunityController.updateOpportunity(req, res, next);

            // Assert
            expect(opportunityService.updateOpportunity).toHaveBeenCalledWith('opp-1', req.body, req.user);
            expect(wrapResult).toHaveBeenCalledWith(res, mockResult);
        });
    });

    // 4. getOpportunities
    describe('getOpportunities', () => {
        it('should call service.getOpportunities and wrapResult', async () => {
            // Arrange
            req.query = { stage: 'NEW' };
            const mockResult = { docs: [], total: 0 };
            (opportunityService.getOpportunities as jest.Mock<any>).mockResolvedValue(mockResult);

            // Act
            await opportunityController.getOpportunities(req, res, next);

            // Assert
            expect(opportunityService.getOpportunities).toHaveBeenCalledWith(req.query, req.user);
            expect(wrapResult).toHaveBeenCalledWith(res, mockResult);
        });
    });

    // 5. opportunityById
    describe('opportunityById', () => {
        it('should call service.opportunityById and wrapResult', async () => {
            // Arrange
            req.params.id = 'opp-1';
            const mockResult = { id: 'opp-1' };
            (opportunityService.opportunityById as jest.Mock<any>).mockResolvedValue(mockResult);

            // Act
            await opportunityController.opportunityById(req, res, next);

            // Assert
            expect(opportunityService.opportunityById).toHaveBeenCalledWith('opp-1', req.user);
            expect(wrapResult).toHaveBeenCalledWith(res, mockResult);
        });
    });

    // 6. sendOpportunitiesExcelByEmail
    describe('sendOpportunitiesExcelByEmail', () => {
        it('should call service.sendOpportunitiesExcelByEmail and wrapResult', async () => {
            // Arrange
            req.query = { stage: 'WON' };
            req.params.email = 'manager@test.com';
            (opportunityService.sendOpportunitiesExcelByEmail as jest.Mock<any>).mockResolvedValue(undefined);

            // Act
            await opportunityController.sendOpportunitiesExcelByEmail(req, res, next);

            // Assert
            expect(opportunityService.sendOpportunitiesExcelByEmail).toHaveBeenCalledWith(
                req.query,
                req.user,
                'manager@test.com'
            );
            expect(wrapResult).toHaveBeenCalledWith(res);
        });
    });
});
