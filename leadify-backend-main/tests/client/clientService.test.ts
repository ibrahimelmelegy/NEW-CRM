
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
jest.mock('../../src/deal/model/dealModel');
jest.mock('../../src/deal/model/invoiceMode');
jest.mock('../../src/communication/models/activityModel');
jest.mock('../../src/communication/models/callLogModel');
jest.mock('../../src/communication/models/meetingNoteModel');
jest.mock('../../src/client/companyNoteModel');
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
        companyName: 'Test Corp',
        users: [],
        parentCompanyId: null,
        customFields: {},
        $set: jest.fn(),
        $get: jest.fn(),
        $add: jest.fn(),
        set: jest.fn(),
        save: jest.fn(),
        destroy: jest.fn(),
        toJSON: jest.fn(() => ({
            id: 'client-123',
            clientName: 'Test Client',
            email: 'client@test.com',
            phoneNumber: '+123456789',
            companyName: 'Test Corp',
        })),
    };

    // save() returns the instance itself (like Sequelize does)
    mockClientData.save.mockImplementation(() => Promise.resolve(mockClientData));

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

        it('should pass joined tables to findOne include', async () => {
            const joinedTables = [{ model: User, as: 'users' }];
            (Client.findOne as jest.Mock<any>).mockResolvedValue(mockClientData);

            await clientService.clientOrError({ id: 'client-123' }, joinedTables);

            expect(Client.findOne).toHaveBeenCalledWith(
                expect.objectContaining({ include: joinedTables })
            );
        });

        it('should use empty array for includes when not provided', async () => {
            (Client.findOne as jest.Mock<any>).mockResolvedValue(mockClientData);

            await clientService.clientOrError({ id: 'client-123' });

            expect(Client.findOne).toHaveBeenCalledWith(
                expect.objectContaining({ include: [] })
            );
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

        it('should associate users when provided', async () => {
            (Client.findOne as jest.Mock<any>).mockResolvedValue(null);
            (Client.create as jest.Mock<any>).mockResolvedValue(mockClientData);

            const input: any = {
                clientName: 'New Client',
                users: [1, 2, 3],
            };

            await clientService.createClient(input, mockAdminUser);

            expect(mockClientData.$set).toHaveBeenCalledWith('users', [1, 2, 3], expect.anything());
        });

        it('should send notification for assigned users', async () => {
            const notificationService = require('../../src/notification/notificationService').default;
            (Client.findOne as jest.Mock<any>).mockResolvedValue(null);
            (Client.create as jest.Mock<any>).mockResolvedValue(mockClientData);

            const input: any = {
                clientName: 'New Client',
                users: [1, 2],
            };

            await clientService.createClient(input, mockAdminUser);

            expect(notificationService.sendAssignClientNotification).toHaveBeenCalledTimes(2);
        });

        it('should create activity log on creation', async () => {
            const { createActivityLog } = require('../../src/activity-logs/activityService');
            (Client.findOne as jest.Mock<any>).mockResolvedValue(null);
            (Client.create as jest.Mock<any>).mockResolvedValue(mockClientData);

            await clientService.createClient({ clientName: 'New' } as any, mockAdminUser);

            expect(createActivityLog).toHaveBeenCalledWith(
                'client', 'create', mockClientData.id, mockAdminUser.id, null, expect.any(String)
            );
        });

        it('should emit client:created socket event', async () => {
            const { io } = require('../../src/server');
            (Client.findOne as jest.Mock<any>).mockResolvedValue(null);
            (Client.create as jest.Mock<any>).mockResolvedValue(mockClientData);

            await clientService.createClient({ clientName: 'New' } as any, mockAdminUser);

            expect(io.emit).toHaveBeenCalledWith('client:created', expect.objectContaining({
                id: mockClientData.id,
                clientName: mockClientData.clientName,
            }));
        });

        it('should handle file uploads when provided', async () => {
            const uploaderService = require('../../src/uploader/uploader.service').default;
            (Client.findOne as jest.Mock<any>).mockResolvedValue(null);
            (Client.create as jest.Mock<any>).mockResolvedValue(mockClientData);

            const input: any = {
                clientName: 'New',
                fileUpload: ['file1.pdf', 'file2.pdf'],
            };

            await clientService.createClient(input, mockAdminUser);

            expect(uploaderService.setFileReferences).toHaveBeenCalledWith(['file1.pdf', 'file2.pdf']);
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

        it('should apply search filter', async () => {
            (Client.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            await clientService.getClients({ page: 1, limit: 10, searchKey: 'acme' }, mockAdminUser);

            const callArgs = (Client.findAndCountAll as jest.Mock<any>).mock.calls[0][0] as any;
            const symbolKeys = Object.getOwnPropertySymbols(callArgs.where);
            expect(symbolKeys.length).toBeGreaterThan(0); // Op.or present
        });

        it('should handle pagination math correctly', async () => {
            (Client.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 45 });

            const result = await clientService.getClients({ page: 3, limit: 10 }, mockAdminUser);

            expect(Client.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    limit: 10,
                    offset: 20,
                })
            );
            expect(result.pagination.totalPages).toBe(5); // ceil(45/10)
        });

        it('should filter by status array', async () => {
            (Client.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            await clientService.getClients({ page: 1, limit: 10, status: ['ACTIVE', 'INACTIVE'] }, mockAdminUser);

            const callArgs = (Client.findAndCountAll as jest.Mock<any>).mock.calls[0][0] as any;
            expect(callArgs.where.clientStatus).toBeDefined();
        });

        it('should filter by type array', async () => {
            (Client.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            await clientService.getClients({ page: 1, limit: 10, type: ['ENTERPRISE'] }, mockAdminUser);

            const callArgs = (Client.findAndCountAll as jest.Mock<any>).mock.calls[0][0] as any;
            expect(callArgs.where.clientType).toBeDefined();
        });

        it('should use default pagination when no params', async () => {
            (Client.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            const result = await clientService.getClients({}, mockAdminUser);

            expect(result.pagination.page).toBe(1);
            expect(result.pagination.limit).toBeGreaterThan(0);
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

        it('should throw EMAIL_ALREADY_EXISTS when new email collides', async () => {
            let callCount = 0;
            (Client.findOne as jest.Mock<any>).mockImplementation(() => {
                callCount++;
                if (callCount === 1) return Promise.resolve(mockClientData); // clientOrError
                return Promise.resolve({ id: 'other-client' }); // email collision
            });

            await expect(clientService.updateClient('client-123', { email: 'collision@test.com' }, mockAdminUser))
                .rejects.toThrow(new BaseError(ERRORS.EMAIL_ALREADY_EXISTS));
        });

        it('should throw PHONE_ALREADY_EXISTS when new phone collides', async () => {
            let callCount = 0;
            (Client.findOne as jest.Mock<any>).mockImplementation(() => {
                callCount++;
                if (callCount === 1) return Promise.resolve(mockClientData); // clientOrError
                return Promise.resolve({ id: 'other-client' }); // phone collision
            });

            await expect(clientService.updateClient('client-123', { phoneNumber: '+collision' }, mockAdminUser))
                .rejects.toThrow(new BaseError(ERRORS.PHONE_ALREADY_EXISTS));
        });

        it('should update user associations when users provided', async () => {
            (Client.findOne as jest.Mock<any>).mockResolvedValue(mockClientData);

            await clientService.updateClient('client-123', { users: [1, 3] }, mockAdminUser);

            expect(mockClientData.$set).toHaveBeenCalledWith('users', [1, 3]);
        });

        it('should emit client:updated socket event', async () => {
            const { io } = require('../../src/server');
            const savedClient: any = {
                ...mockClientData,
                toJSON: jest.fn(() => ({ id: mockClientData.id, clientName: mockClientData.clientName })),
                set: jest.fn(),
                save: jest.fn(),
            };
            savedClient.save.mockImplementation(() => Promise.resolve(savedClient));
            (Client.findOne as jest.Mock<any>).mockResolvedValue(savedClient);

            await clientService.updateClient('client-123', { clientName: 'Updated' }, mockAdminUser);

            expect(io.emit).toHaveBeenCalledWith('client:updated', expect.objectContaining({
                id: mockClientData.id,
            }));
        });

        it('should create activity log on update', async () => {
            const { createActivityLog } = require('../../src/activity-logs/activityService');
            (Client.findOne as jest.Mock<any>).mockResolvedValue(mockClientData);

            await clientService.updateClient('client-123', { clientName: 'Updated' }, mockAdminUser);

            expect(createActivityLog).toHaveBeenCalledWith(
                'client', 'update', mockClientData.id, mockAdminUser.id, null, expect.any(String)
            );
        });
    });

    // --------------------------------------------------------------------------
    // 6. deleteClient
    // --------------------------------------------------------------------------
    describe('deleteClient', () => {
        it('should delete client successfully for admin', async () => {
            (Client.findOne as jest.Mock<any>).mockResolvedValue(mockClientData);

            await clientService.deleteClient('client-123', mockAdminUser);

            const { createActivityLog } = require('../../src/activity-logs/activityService');
            expect(createActivityLog).toHaveBeenCalledWith(
                'client', 'delete', mockClientData.id, mockAdminUser.id, null, 'Client deleted'
            );
            expect(mockClientData.destroy).toHaveBeenCalled();
        });

        it('should throw CLIENT_NOT_FOUND when client does not exist', async () => {
            (Client.findOne as jest.Mock<any>).mockResolvedValue(null);

            await expect(clientService.deleteClient('nonexistent', mockAdminUser))
                .rejects.toThrow(new BaseError(ERRORS.CLIENT_NOT_FOUND));
        });

        it('should throw ACCESS_DENIED for unassigned standard user', async () => {
            (ClientUsers.findOne as jest.Mock<any>).mockResolvedValue(null);

            await expect(clientService.deleteClient('client-123', mockStandardUser))
                .rejects.toThrow(new BaseError(ERRORS.ACCESS_DENIED));
        });

        it('should allow assigned standard user to delete client', async () => {
            (ClientUsers.findOne as jest.Mock<any>).mockResolvedValue({ clientId: 'client-123', userId: 2 });
            (Client.findOne as jest.Mock<any>).mockResolvedValue(mockClientData);

            await clientService.deleteClient('client-123', mockStandardUser);

            expect(mockClientData.destroy).toHaveBeenCalled();
        });
    });

    // --------------------------------------------------------------------------
    // 7. clientById
    // --------------------------------------------------------------------------
    describe('clientById', () => {
        it('should return client with users for admin', async () => {
            const clientWithUsers: any = { ...mockClientData, users: [{ id: 1, name: 'Admin' }] };
            (Client.findOne as jest.Mock<any>).mockResolvedValue(clientWithUsers);

            const result = await clientService.clientById('client-123', mockAdminUser);

            expect(result).toEqual(clientWithUsers);
        });

        it('should validate access before fetching', async () => {
            (ClientUsers.findOne as jest.Mock<any>).mockResolvedValue(null);

            await expect(clientService.clientById('client-123', mockStandardUser))
                .rejects.toThrow(new BaseError(ERRORS.ACCESS_DENIED));
        });

        it('should throw CLIENT_NOT_FOUND when client does not exist', async () => {
            (Client.findOne as jest.Mock<any>).mockResolvedValue(null);

            await expect(clientService.clientById('nonexistent', mockAdminUser))
                .rejects.toThrow(new BaseError(ERRORS.CLIENT_NOT_FOUND));
        });

        it('should include users association', async () => {
            (Client.findOne as jest.Mock<any>).mockResolvedValue(mockClientData);

            await clientService.clientById('client-123', mockAdminUser);

            expect(Client.findOne).toHaveBeenCalledWith(
                expect.objectContaining({
                    include: expect.arrayContaining([
                        expect.objectContaining({ model: User, as: 'users' })
                    ])
                })
            );
        });
    });

    // --------------------------------------------------------------------------
    // 8. getClientsArray
    // --------------------------------------------------------------------------
    describe('getClientsArray', () => {
        it('should return simple array of clients with id, name, companyName', async () => {
            const mockClients = [
                { id: '1', clientName: 'Client A', companyName: 'Corp A' },
                { id: '2', clientName: 'Client B', companyName: 'Corp B' },
            ];
            (Client.findAll as jest.Mock<any>).mockResolvedValue(mockClients);

            const result = await clientService.getClientsArray();

            expect(result).toEqual(mockClients);
            expect(Client.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    attributes: ['id', 'clientName', 'companyName']
                })
            );
        });

        it('should return empty array when no clients exist', async () => {
            (Client.findAll as jest.Mock<any>).mockResolvedValue([]);

            const result = await clientService.getClientsArray();

            expect(result).toEqual([]);
        });
    });

    // --------------------------------------------------------------------------
    // 9. getClientContacts
    // --------------------------------------------------------------------------
    describe('getClientContacts', () => {
        it('should return contacts (users) for the client', async () => {
            const clientWithUsers: any = {
                ...mockClientData,
                users: [
                    { id: 1, name: 'User 1', email: 'user1@test.com', phone: '+1', status: 'ACTIVE' },
                    { id: 2, name: 'User 2', email: 'user2@test.com', phone: '+2', status: 'ACTIVE' },
                ],
            };
            (Client.findOne as jest.Mock<any>).mockResolvedValue(clientWithUsers);

            const result = await clientService.getClientContacts('client-123', mockAdminUser);

            expect(result).toHaveLength(2);
            expect(result[0].name).toBe('User 1');
        });

        it('should return empty array when client has no users', async () => {
            (Client.findOne as jest.Mock<any>).mockResolvedValue(mockClientData); // users: []

            const result = await clientService.getClientContacts('client-123', mockAdminUser);

            expect(result).toEqual([]);
        });

        it('should validate access before fetching contacts', async () => {
            (ClientUsers.findOne as jest.Mock<any>).mockResolvedValue(null);

            await expect(clientService.getClientContacts('client-123', mockStandardUser))
                .rejects.toThrow(new BaseError(ERRORS.ACCESS_DENIED));
        });
    });

    // --------------------------------------------------------------------------
    // 10. errorIfClientWithExistEmail / errorIfClientWithExistPhone
    // --------------------------------------------------------------------------
    describe('errorIfClientWithExistEmail', () => {
        it('should throw when email already exists', async () => {
            (Client.findOne as jest.Mock<any>).mockResolvedValue({ id: 'existing' });

            await expect(clientService.errorIfClientWithExistEmail('exists@test.com'))
                .rejects.toThrow(new BaseError(ERRORS.EMAIL_ALREADY_EXISTS));
        });

        it('should not throw when email is unique', async () => {
            (Client.findOne as jest.Mock<any>).mockResolvedValue(null);

            await expect(clientService.errorIfClientWithExistEmail('unique@test.com'))
                .resolves.not.toThrow();
        });

        it('should exclude current client id from duplicate check', async () => {
            (Client.findOne as jest.Mock<any>).mockResolvedValue(null);

            await clientService.errorIfClientWithExistEmail('test@test.com', 'client-123');

            expect(Client.findOne).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        email: 'test@test.com',
                        id: expect.anything(), // Op.ne: 'client-123'
                    })
                })
            );
        });
    });

    describe('errorIfClientWithExistPhone', () => {
        it('should throw when phone already exists', async () => {
            (Client.findOne as jest.Mock<any>).mockResolvedValue({ id: 'existing' });

            await expect(clientService.errorIfClientWithExistPhone('+existing'))
                .rejects.toThrow(new BaseError(ERRORS.PHONE_ALREADY_EXISTS));
        });

        it('should not throw when phone is unique', async () => {
            (Client.findOne as jest.Mock<any>).mockResolvedValue(null);

            await expect(clientService.errorIfClientWithExistPhone('+unique'))
                .resolves.not.toThrow();
        });

        it('should exclude current client id from check', async () => {
            (Client.findOne as jest.Mock<any>).mockResolvedValue(null);

            await clientService.errorIfClientWithExistPhone('+123', 'client-123');

            expect(Client.findOne).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        phoneNumber: '+123',
                        id: expect.anything(),
                    })
                })
            );
        });
    });

    // --------------------------------------------------------------------------
    // 11. bulkUpdateCompanies
    // --------------------------------------------------------------------------
    describe('bulkUpdateCompanies', () => {
        it('should update multiple companies and return count', async () => {
            (Client.update as jest.Mock<any>).mockResolvedValue([3]); // 3 rows updated

            const result = await clientService.bulkUpdateCompanies(
                ['c1', 'c2', 'c3'],
                { clientStatus: 'ACTIVE' },
                mockAdminUser
            );

            expect(result).toBe(3);
            expect(Client.update).toHaveBeenCalledWith(
                { clientStatus: 'ACTIVE' },
                expect.objectContaining({
                    where: expect.objectContaining({
                        id: expect.anything(), // Op.in
                    })
                })
            );
        });

        it('should return 0 when no companies match', async () => {
            (Client.update as jest.Mock<any>).mockResolvedValue([0]);

            const result = await clientService.bulkUpdateCompanies(
                ['nonexistent'],
                { clientStatus: 'ACTIVE' },
                mockAdminUser
            );

            expect(result).toBe(0);
        });
    });

    // --------------------------------------------------------------------------
    // 12. Company Notes CRUD
    // --------------------------------------------------------------------------
    describe('createCompanyNote', () => {
        it('should create a company note', async () => {
            const CompanyNote = require('../../src/client/companyNoteModel').default;
            (Client.findOne as jest.Mock<any>).mockResolvedValue(mockClientData);
            const mockNote = { id: 'note-1', companyId: 'client-123', content: 'Test note', userId: 1 };
            CompanyNote.create = (jest.fn() as jest.Mock<any>).mockResolvedValue(mockNote);

            const result = await clientService.createCompanyNote('client-123', 'Test note', 1);

            expect(result).toEqual(mockNote);
            expect(CompanyNote.create).toHaveBeenCalledWith(expect.objectContaining({
                companyId: 'client-123',
                content: 'Test note',
                userId: 1,
            }));
        });

        it('should throw CLIENT_NOT_FOUND when company does not exist', async () => {
            (Client.findOne as jest.Mock<any>).mockResolvedValue(null);

            await expect(clientService.createCompanyNote('nonexistent', 'Note', 1))
                .rejects.toThrow(new BaseError(ERRORS.CLIENT_NOT_FOUND));
        });
    });

    describe('deleteCompanyNote', () => {
        it('should delete a note', async () => {
            const CompanyNote = require('../../src/client/companyNoteModel').default;
            const mockNote = { id: 'note-1', destroy: jest.fn() };
            CompanyNote.findByPk = (jest.fn() as jest.Mock<any>).mockResolvedValue(mockNote);

            await clientService.deleteCompanyNote('note-1');

            expect(mockNote.destroy).toHaveBeenCalled();
        });

        it('should throw NOT_FOUND when note does not exist', async () => {
            const CompanyNote = require('../../src/client/companyNoteModel').default;
            CompanyNote.findByPk = (jest.fn() as jest.Mock<any>).mockResolvedValue(null);

            await expect(clientService.deleteCompanyNote('nonexistent'))
                .rejects.toThrow(new BaseError(ERRORS.NOT_FOUND));
        });
    });

    describe('updateCompanyNote', () => {
        it('should update a note', async () => {
            const CompanyNote = require('../../src/client/companyNoteModel').default;
            const mockNote = { id: 'note-1', update: (jest.fn() as jest.Mock<any>).mockResolvedValue(true) };
            CompanyNote.findByPk = (jest.fn() as jest.Mock<any>).mockResolvedValue(mockNote);

            const result = await clientService.updateCompanyNote('note-1', { content: 'Updated' });

            expect(mockNote.update).toHaveBeenCalledWith({ content: 'Updated' });
        });

        it('should throw NOT_FOUND when note does not exist', async () => {
            const CompanyNote = require('../../src/client/companyNoteModel').default;
            CompanyNote.findByPk = (jest.fn() as jest.Mock<any>).mockResolvedValue(null);

            await expect(clientService.updateCompanyNote('nonexistent', { content: 'x' }))
                .rejects.toThrow(new BaseError(ERRORS.NOT_FOUND));
        });
    });
});
