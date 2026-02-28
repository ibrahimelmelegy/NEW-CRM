
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock dependencies before imports
jest.mock('../../src/support/models/ticketModel');
jest.mock('../../src/support/models/ticketMessageModel');
jest.mock('../../src/support/models/ticketCategoryModel');
jest.mock('../../src/support/models/cannedResponseModel');
jest.mock('../../src/support/models/slaConfigModel');
jest.mock('../../src/user/userModel');
jest.mock('../../src/client/clientModel');
jest.mock('../../src/server', () => ({
    io: { emit: jest.fn() }
}));

import supportService from '../../src/support/supportService';
import Ticket, { TicketStatus, TicketPriority } from '../../src/support/models/ticketModel';
import TicketMessage from '../../src/support/models/ticketMessageModel';
import TicketCategory from '../../src/support/models/ticketCategoryModel';
import CannedResponse from '../../src/support/models/cannedResponseModel';
import SLAConfig from '../../src/support/models/slaConfigModel';
import User from '../../src/user/userModel';
import BaseError from '../../src/utils/error/base-http-exception';
import { ERRORS } from '../../src/utils/error/errors';

describe('SupportService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------------------------------
    // 1. createTicket
    // --------------------------------------------------------------------------
    describe('createTicket', () => {
        it('should create a ticket with generated number and SLA deadline', async () => {
            // Mock ticket number generation
            (Ticket.findOne as jest.Mock<any>).mockResolvedValue(null); // No previous tickets
            (SLAConfig.findOne as jest.Mock<any>).mockResolvedValue({ resolutionTimeHours: 24, isActive: true });

            const mockTicket = { id: 'ticket-1', ticketNumber: 'TKT-0001', status: TicketStatus.OPEN };
            (Ticket.create as jest.Mock<any>).mockResolvedValue(mockTicket);

            const result = await supportService.createTicket({
                subject: 'Test Ticket',
                description: 'Test description',
                priority: TicketPriority.HIGH,
            });

            expect(result).toEqual(mockTicket);
            expect(Ticket.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    ticketNumber: 'TKT-0001',
                    status: TicketStatus.OPEN,
                    priority: TicketPriority.HIGH,
                })
            );
        });

        it('should increment ticket number from last ticket', async () => {
            (Ticket.findOne as jest.Mock<any>).mockResolvedValueOnce({ ticketNumber: 'TKT-0042' }); // last ticket
            (SLAConfig.findOne as jest.Mock<any>).mockResolvedValue(null); // No SLA

            const mockTicket = { id: 'ticket-2', ticketNumber: 'TKT-0043' };
            (Ticket.create as jest.Mock<any>).mockResolvedValue(mockTicket);

            await supportService.createTicket({ subject: 'Another Ticket' });

            expect(Ticket.create).toHaveBeenCalledWith(
                expect.objectContaining({ ticketNumber: 'TKT-0043' })
            );
        });
    });

    // --------------------------------------------------------------------------
    // 2. getTickets
    // --------------------------------------------------------------------------
    describe('getTickets', () => {
        it('should return paginated tickets', async () => {
            const mockRows = [{ id: 'ticket-1', subject: 'Test' }];
            (Ticket.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: mockRows, count: 1 });

            const result = await supportService.getTickets({ page: 1, limit: 20 });

            expect(result.docs).toEqual(mockRows);
            expect(result.pagination.totalItems).toBe(1);
            expect(result.pagination.page).toBe(1);
        });

        it('should apply status filter', async () => {
            (Ticket.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            await supportService.getTickets({ page: 1, limit: 20, status: TicketStatus.OPEN });

            const callArgs = (Ticket.findAndCountAll as jest.Mock<any>).mock.calls[0][0] as any;
            expect(callArgs.where.status).toBe(TicketStatus.OPEN);
        });

        it('should apply priority filter', async () => {
            (Ticket.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            await supportService.getTickets({ page: 1, limit: 20, priority: TicketPriority.URGENT });

            const callArgs = (Ticket.findAndCountAll as jest.Mock<any>).mock.calls[0][0] as any;
            expect(callArgs.where.priority).toBe(TicketPriority.URGENT);
        });
    });

    // --------------------------------------------------------------------------
    // 3. getTicketById
    // --------------------------------------------------------------------------
    describe('getTicketById', () => {
        it('should return ticket by id', async () => {
            const mockTicket = { id: 'ticket-1', subject: 'Test Ticket' };
            (Ticket.findByPk as jest.Mock<any>).mockResolvedValue(mockTicket);

            const result = await supportService.getTicketById('ticket-1');
            expect(result).toEqual(mockTicket);
        });

        it('should throw NOT_FOUND when ticket does not exist', async () => {
            (Ticket.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await expect(supportService.getTicketById('nonexistent'))
                .rejects.toThrow(new BaseError(ERRORS.NOT_FOUND));
        });
    });

    // --------------------------------------------------------------------------
    // 4. updateTicket
    // --------------------------------------------------------------------------
    describe('updateTicket', () => {
        it('should update a ticket', async () => {
            const mockTicket = {
                id: 'ticket-1',
                update: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
            };
            (Ticket.findByPk as jest.Mock<any>).mockResolvedValue(mockTicket);

            const result = await supportService.updateTicket('ticket-1', { priority: TicketPriority.URGENT });

            expect(mockTicket.update).toHaveBeenCalledWith({ priority: TicketPriority.URGENT });
        });

        it('should throw NOT_FOUND when ticket does not exist', async () => {
            (Ticket.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await expect(supportService.updateTicket('nonexistent', {}))
                .rejects.toThrow(new BaseError(ERRORS.NOT_FOUND));
        });
    });

    // --------------------------------------------------------------------------
    // 5. addMessage
    // --------------------------------------------------------------------------
    describe('addMessage', () => {
        it('should add a message to an existing ticket', async () => {
            const mockTicket = {
                id: 'ticket-1',
                status: TicketStatus.IN_PROGRESS,
                update: jest.fn(),
            };
            (Ticket.findByPk as jest.Mock<any>).mockResolvedValue(mockTicket);

            const mockMessage = { id: 'msg-1', body: 'Hello' };
            (TicketMessage.create as jest.Mock<any>).mockResolvedValue(mockMessage);

            const result = await supportService.addMessage('ticket-1', {
                senderId: 1,
                senderType: 'AGENT',
                body: 'Hello',
            });

            expect(result).toEqual(mockMessage);
        });

        it('should move ticket from OPEN to IN_PROGRESS when agent responds', async () => {
            const mockTicket = {
                id: 'ticket-1',
                status: TicketStatus.OPEN,
                update: jest.fn(),
            };
            (Ticket.findByPk as jest.Mock<any>).mockResolvedValue(mockTicket);
            (TicketMessage.create as jest.Mock<any>).mockResolvedValue({ id: 'msg-1' });

            await supportService.addMessage('ticket-1', {
                senderId: 1,
                senderType: 'AGENT',
                body: 'We are looking into this',
                isInternal: false,
            });

            expect(mockTicket.update).toHaveBeenCalledWith({ status: TicketStatus.IN_PROGRESS });
        });

        it('should NOT move ticket status for internal messages', async () => {
            const mockTicket = {
                id: 'ticket-1',
                status: TicketStatus.OPEN,
                update: jest.fn(),
            };
            (Ticket.findByPk as jest.Mock<any>).mockResolvedValue(mockTicket);
            (TicketMessage.create as jest.Mock<any>).mockResolvedValue({ id: 'msg-1' });

            await supportService.addMessage('ticket-1', {
                senderId: 1,
                senderType: 'AGENT',
                body: 'Internal note',
                isInternal: true,
            });

            expect(mockTicket.update).not.toHaveBeenCalled();
        });

        it('should throw NOT_FOUND when ticket does not exist', async () => {
            (Ticket.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await expect(supportService.addMessage('nonexistent', { body: 'Hello' }))
                .rejects.toThrow(new BaseError(ERRORS.NOT_FOUND));
        });
    });

    // --------------------------------------------------------------------------
    // 6. assignTicket
    // --------------------------------------------------------------------------
    describe('assignTicket', () => {
        it('should assign a ticket to a user and set firstResponseAt', async () => {
            const mockTicket = {
                id: 'ticket-1',
                status: TicketStatus.OPEN,
                firstResponseAt: null,
                update: jest.fn(),
            };
            (Ticket.findByPk as jest.Mock<any>).mockResolvedValueOnce(mockTicket); // For assign
            (User.findByPk as jest.Mock<any>).mockResolvedValue({ id: 5, name: 'Agent' });
            // For getTicketById call after update
            (Ticket.findByPk as jest.Mock<any>).mockResolvedValueOnce({ ...mockTicket, assignedTo: 5 });

            await supportService.assignTicket('ticket-1', '5');

            expect(mockTicket.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    assignedTo: '5',
                    firstResponseAt: expect.any(Date),
                    status: TicketStatus.IN_PROGRESS,
                })
            );
        });

        it('should throw NOT_FOUND when ticket does not exist', async () => {
            (Ticket.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await expect(supportService.assignTicket('nonexistent', '5'))
                .rejects.toThrow(new BaseError(ERRORS.NOT_FOUND));
        });

        it('should throw USER_NOT_FOUND when user does not exist', async () => {
            (Ticket.findByPk as jest.Mock<any>).mockResolvedValue({ id: 'ticket-1' });
            (User.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await expect(supportService.assignTicket('ticket-1', '999'))
                .rejects.toThrow(new BaseError(ERRORS.USER_NOT_FOUND));
        });
    });

    // --------------------------------------------------------------------------
    // 7. resolveTicket
    // --------------------------------------------------------------------------
    describe('resolveTicket', () => {
        it('should resolve a ticket', async () => {
            const mockTicket = {
                id: 'ticket-1',
                status: TicketStatus.IN_PROGRESS,
                update: jest.fn(),
            };
            (Ticket.findByPk as jest.Mock<any>)
                .mockResolvedValueOnce(mockTicket) // For resolve
                .mockResolvedValueOnce({ ...mockTicket, status: TicketStatus.RESOLVED }); // For getTicketById

            await supportService.resolveTicket('ticket-1');

            expect(mockTicket.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: TicketStatus.RESOLVED,
                    resolvedAt: expect.any(Date),
                })
            );
        });

        it('should throw NOT_FOUND when ticket does not exist', async () => {
            (Ticket.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await expect(supportService.resolveTicket('nonexistent'))
                .rejects.toThrow(new BaseError(ERRORS.NOT_FOUND));
        });
    });

    // --------------------------------------------------------------------------
    // 8. submitCSAT
    // --------------------------------------------------------------------------
    describe('submitCSAT', () => {
        it('should submit CSAT rating', async () => {
            const mockTicket = {
                id: 'ticket-1',
                update: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
            };
            (Ticket.findByPk as jest.Mock<any>).mockResolvedValue(mockTicket);

            await supportService.submitCSAT('ticket-1', 5, 'Great service!');

            expect(mockTicket.update).toHaveBeenCalledWith({
                csatRating: 5,
                csatComment: 'Great service!',
            });
        });

        it('should throw SOMETHING_WENT_WRONG for invalid rating', async () => {
            const mockTicket = { id: 'ticket-1' };
            (Ticket.findByPk as jest.Mock<any>).mockResolvedValue(mockTicket);

            await expect(supportService.submitCSAT('ticket-1', 6))
                .rejects.toThrow(new BaseError(ERRORS.SOMETHING_WENT_WRONG));
        });

        it('should throw SOMETHING_WENT_WRONG for rating below 1', async () => {
            const mockTicket = { id: 'ticket-1' };
            (Ticket.findByPk as jest.Mock<any>).mockResolvedValue(mockTicket);

            await expect(supportService.submitCSAT('ticket-1', 0))
                .rejects.toThrow(new BaseError(ERRORS.SOMETHING_WENT_WRONG));
        });
    });
});
