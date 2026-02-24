
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import clientService from '../../src/client/clientService';
import Client from '../../src/client/clientModel';
import ClientUsers from '../../src/client/client_UsersModel';
import User from '../../src/user/userModel';
import Lead from '../../src/lead/leadModel';
import BaseError from '../../src/utils/error/base-http-exception';
import { ERRORS } from '../../src/utils/error/errors';
import { ClientPermissionsEnum } from '../../src/role/roleEnum';

// Mocks
jest.mock('../../src/client/clientModel');
jest.mock('../../src/client/client_UsersModel');
jest.mock('../../src/user/userModel');
jest.mock('../../src/lead/leadModel');
jest.mock('../../src/lead/leadService');
jest.mock('../../src/uploader/uploader.service');
jest.mock('../../src/notification/notificationService');
jest.mock('../../src/activity-logs/activityService');
jest.mock('../../src/utils/emailHelper');
jest.mock('../../src/server', () => ({
    io: { emit: jest.fn() }
}));

describe('ClientService', () => {
    const mockAdminUser: any = {
        id: 1,
        email: 'admin@test.com',
        role: { permissions: [ClientPermissionsEnum.VIEW_GLOBAL_CLIENTS] },
    };

    const mockStandardUser: any = {
        id: 2,
        email: 'user@test.com',
        role: { permissions: [] },
    };

    const mockClientData: any = {
        id: 'client-123',
        clientName: 'Test Client',
        email: 'client@test.com',
        phoneNumber: '+123456789',
        users: [],
        $set: jest.fn(),
        set: jest.fn(),
        save: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------------------------------
    // 1. validateClientAccess
    // --------------------------------------------------------------------------
    describe('validateClientAccess', () => {
        it('should allow admin with VIEW_GLOBAL_CLIENTS permission', async () => {
            await expect(clientService.validateClientAccess('client-123', mockAdminUser))
                .resolves.not.toThrow();
        });

        it('should allow assigned standard user', async () => {
            (ClientUsers.findOne as jest.Mock<any>).mockResolvedValue({ leadId: 'client-123', userId: 2 });
            await expect(clientService.validateClientAccess('client-123', mockStandardUser))
                .resolves.not.toThrow();
        });

        it('should throw ACCESS_DENIED for unassigned standard user', async () => {
            (ClientUsers.findOne as jest.Mock<any>).mockResolvedValue(null);
            await expect(clientService.validateClientAccess('client-123', mockStandardUser))
                .rejects.toThrow(new BaseError(ERRORS.ACCESS_DENIED));
        });
    });

    // --------------------------------------------------------------------------
    // 2. clientOrError
    // --------------------------------------------------------------------------
    describe('clientOrError', () => {
        it('should return client when found', async () => {
            (Client.findOne as jest.Mock<any>).mockResolvedValue(mockClientData);
            const result = await clientService.clientOrError({ id: 'client-123' });
            expect(result).toEqual(mockClientData);
        });

        it('should throw CLIENT_NOT_FOUND when not found', async () => {
            (Client.findOne as jest.Mock<any>).mockResolvedValue(null);
            await expect(clientService.clientOrError({ id: 'nonexistent' }))
                .rejects.toThrow(new BaseError(ERRORS.CLIENT_NOT_FOUND));
        });
    });

    // --------------------------------------------------------------------------
    // 3. createClient
    // --------------------------------------------------------------------------
    describe('createClient', () => {
        it('should create client successfully', async () => {
            (Client.findOne as jest.Mock<any>).mockResolvedValue(null); // No duplicates
            (Client.create as jest.Mock<any>).mockResolvedValue(mockClientData);

            const input: any = {
                clientName: 'New Client',
                email: 'new@test.com',
                phoneNumber: '+999',
            };

            const result = await clientService.createClient(input, mockAdminUser);

            expect(Client.create).toHaveBeenCalled();
            expect(result).toEqual(mockClientData);
        });

        it('should throw EMAIL_ALREADY_EXISTS when email is duplicate', async () => {
            (Client.findOne as jest.Mock<any>).mockResolvedValue({ id: 'existing' });

            const input: any = { email: 'exists@test.com' };

            await expect(clientService.createClient(input, mockAdminUser))
                .rejects.toThrow(new BaseError(ERRORS.EMAIL_ALREADY_EXISTS));
        });

        it('should throw PHONE_ALREADY_EXISTS when phone is duplicate', async () => {
            // First call for email check returns null, second for phone returns existing
            (Client.findOne as jest.Mock<any>)
                .mockResolvedValueOnce(null) // email check
                .mockResolvedValueOnce({ id: 'existing' }); // phone check

            const input: any = { email: 'new@test.com', phoneNumber: '+existing' };

            await expect(clientService.createClient(input, mockAdminUser))
                .rejects.toThrow(new BaseError(ERRORS.PHONE_ALREADY_EXISTS));
        });

        it('should convert lead when leadId provided', async () => {
            const leadService = require('../../src/lead/leadService').default;
            leadService.leadOrError = (jest.fn() as jest.Mock<any>).mockResolvedValue({ id: 'lead-1' });

            (Client.findOne as jest.Mock<any>).mockResolvedValue(null);
            (Client.create as jest.Mock<any>).mockResolvedValue(mockClientData);

            const input: any = { clientName: 'From Lead', leadId: 'lead-1' };

            await clientService.createClient(input, mockAdminUser);

            expect(leadService.leadOrError).toHaveBeenCalledWith({ id: 'lead-1' });
            expect(Lead.update).toHaveBeenCalled();
        });
    });

    // --------------------------------------------------------------------------
    // 4. getClients
    // --------------------------------------------------------------------------
    describe('getClients', () => {
        it('should return paginated clients for admin', async () => {
            const mockClients = [mockClientData];
            (Client.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: mockClients, count: 1 });

            const result = await clientService.getClients({ page: 1, limit: 10 }, mockAdminUser);

            expect(result.docs).toEqual(mockClients);
            expect(result.pagination.totalItems).toBe(1);
        });

        it('should enforce userId filter for non-admin user', async () => {
            (Client.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            await clientService.getClients({ page: 1, limit: 10 }, mockStandardUser);

            expect(Client.findAndCountAll).toHaveBeenCalledWith(
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
    // 5. updateClient
    // --------------------------------------------------------------------------
    describe('updateClient', () => {
        it('should update client successfully', async () => {
            // Admin bypass for access check
            (Client.findOne as jest.Mock<any>).mockResolvedValue(mockClientData);

            await clientService.updateClient('client-123', { clientName: 'Updated' }, mockAdminUser);

            expect(mockClientData.set).toHaveBeenCalledWith({ clientName: 'Updated' });
            expect(mockClientData.save).toHaveBeenCalled();
        });

        it('should throw ACCESS_DENIED for unassigned standard user', async () => {
            (ClientUsers.findOne as jest.Mock<any>).mockResolvedValue(null);

            await expect(clientService.updateClient('client-123', { clientName: 'Test' }, mockStandardUser))
                .rejects.toThrow(new BaseError(ERRORS.ACCESS_DENIED));
        });
    });
});
