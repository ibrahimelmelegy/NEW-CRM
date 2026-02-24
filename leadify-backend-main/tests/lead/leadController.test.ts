
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import leadController from '../../src/lead/leadController';
import leadService from '../../src/lead/leadService';
import { wrapResult } from '../../src/utils/response/responseWrapper';
import { NextFunction, Response } from 'express';

// Mocks
jest.mock('../../src/lead/leadService');
jest.mock('../../src/utils/response/responseWrapper');
jest.mock('../../src/server', () => ({
    io: { emit: jest.fn() }
}));

describe('LeadController', () => {
    let req: any;
    let res: any;
    let next: NextFunction;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            body: {},
            params: {},
            query: {},
            user: { id: 1, email: 'admin@test.com' }, // Mock Authenticated User
            files: {}
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as unknown as Response;

        next = jest.fn() as NextFunction;
    });

    // 1. createLead
    describe('createLead', () => {
        it('should call service.createLead and wrapResult with 201 on success', async () => {
            // Arrange
            req.body = { name: 'New Lead' };
            const mockResult = { id: 1, name: 'New Lead' };
            (leadService.createLead as jest.Mock<any>).mockResolvedValue(mockResult);

            // Act
            await leadController.createLead(req, res, next);

            // Assert
            expect(leadService.createLead).toHaveBeenCalledWith(req.body, 1);
            expect(wrapResult).toHaveBeenCalledWith(res, mockResult, 201);
            expect(next).not.toHaveBeenCalled();
        });

        it('should call next(error) if service throws', async () => {
            // Arrange
            const error = new Error('Service Error');
            (leadService.createLead as jest.Mock<any>).mockRejectedValue(error);

            // Act
            await leadController.createLead(req, res, next);

            // Assert
            expect(next).toHaveBeenCalledWith(error);
        });
    });

    // 2. updateLead
    describe('updateLead', () => {
        it('should call service.updateLead and wrapResult', async () => {
            // Arrange
            req.params.id = 'lead-123';
            req.body = { name: 'Updated' };
            const mockResult = { id: 'lead-123', name: 'Updated' };
            (leadService.updateLead as jest.Mock<any>).mockResolvedValue(mockResult);

            // Act
            await leadController.updateLead(req, res, next);

            // Assert
            expect(leadService.updateLead).toHaveBeenCalledWith('lead-123', req.body, req.user);
            expect(wrapResult).toHaveBeenCalledWith(res, mockResult);
        });
    });

    // 3. getLeads
    describe('getLeads', () => {
        it('should call service.getLeads and wrapResult', async () => {
            // Arrange
            req.query = { page: '1' };
            const mockResult = { docs: [], total: 0 };
            (leadService.getLeads as jest.Mock<any>).mockResolvedValue(mockResult);

            // Act
            await leadController.getLeads(req, res, next);

            // Assert
            expect(leadService.getLeads).toHaveBeenCalledWith(req.query, req.user);
            expect(wrapResult).toHaveBeenCalledWith(res, mockResult);
        });
    });

    // 4. leadById
    describe('leadById', () => {
        it('should call service.leadById and wrapResult', async () => {
            // Arrange
            req.params.id = 'lead-1';
            const mockResult = { id: 'lead-1' };
            (leadService.leadById as jest.Mock<any>).mockResolvedValue(mockResult);

            // Act
            await leadController.leadById(req, res, next);

            // Assert
            expect(leadService.leadById).toHaveBeenCalledWith('lead-1', req.user);
            expect(wrapResult).toHaveBeenCalledWith(res, mockResult);
        });
    });

    // 5. importLeadSheet
    describe('importLeadSheet', () => {
        it('should call service.importFile with uploaded file', async () => {
            // Arrange
            const mockFile = { name: 'leads.xlsx', data: Buffer.from('') };
            req.files = { file: mockFile };
            const mockMsg = '10 leads created';
            (leadService.importFile as jest.Mock<any>).mockResolvedValue(mockMsg);

            // Act
            await leadController.importLeadSheet(req, res, next);

            // Assert
            expect(leadService.importFile).toHaveBeenCalledWith(mockFile);
            expect(wrapResult).toHaveBeenCalledWith(res, mockMsg);
        });

        it('should handle missing files gracefully (if not handled by middleware) or pass error', async () => {
            // This depends on implementation, but if req.files is undefined it throws
            req.files = undefined;
            // In the controller code: const uploadedFile = (<any>req).files.file; -> will throw

            await leadController.importLeadSheet(req, res, next);

            expect(next).toHaveBeenCalled(); // Should catch the type error
        });
    });

    // 6. sendLeadsExcelByEmail
    describe('sendLeadsExcelByEmail', () => {
        it('should call service.sendLeadsExcelByEmail and wrapResult', async () => {
            // Arrange
            req.query = { status: 'NEW' };
            req.params.email = 'test@test.com';
            (leadService.sendLeadsExcelByEmail as jest.Mock<any>).mockResolvedValue(undefined);

            // Act
            await leadController.sendLeadsExcelByEmail(req, res, next);

            // Assert
            expect(leadService.sendLeadsExcelByEmail).toHaveBeenCalledWith(req.query, req.user, 'test@test.com');
            expect(wrapResult).toHaveBeenCalledWith(res);
        });
    });
});
