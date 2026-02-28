
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock dependencies before imports
jest.mock('../../src/notification/notificationModel');
jest.mock('../../src/server', () => ({
    io: { emit: jest.fn() }
}));

import notificationService from '../../src/notification/notificationService';
import Notification from '../../src/notification/notificationModel';
import { NotificationReadEnums, NotificationTypeEnums } from '../../src/notification/notificationEnum';
import BaseError from '../../src/utils/error/base-http-exception';
import { ERRORS } from '../../src/utils/error/errors';

describe('NotificationService', () => {
    const mockUser: any = {
        id: 1,
        name: 'Admin User',
        email: 'admin@test.com',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------------------------------
    // 1. getNotifications
    // --------------------------------------------------------------------------
    describe('getNotifications', () => {
        it('should return paginated notifications with unread count', async () => {
            const mockNotifications = [
                { id: 1, body_en: 'Notification 1', read: NotificationReadEnums.UN_READ },
                { id: 2, body_en: 'Notification 2', read: NotificationReadEnums.READ },
            ];
            (Notification.findAndCountAll as jest.Mock<any>).mockResolvedValue({
                rows: mockNotifications,
                count: 2,
            });
            (Notification.count as jest.Mock<any>).mockResolvedValue(1);

            const result = await notificationService.getNotifications({ page: 1, limit: 10 }, mockUser);

            expect(result.docs).toEqual(mockNotifications);
            expect(result.pagination.totalItems).toBe(2);
            expect(result.unreadNotificationsCount).toBe(1);
        });

        it('should use default page and limit when not provided', async () => {
            (Notification.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });
            (Notification.count as jest.Mock<any>).mockResolvedValue(0);

            const result = await notificationService.getNotifications({}, mockUser);

            expect(result.pagination.page).toBe(1);
            expect(result.pagination.limit).toBe(10);
        });

        it('should filter by userId', async () => {
            (Notification.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });
            (Notification.count as jest.Mock<any>).mockResolvedValue(0);

            await notificationService.getNotifications({ page: 1, limit: 10 }, mockUser);

            expect(Notification.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({ where: { userId: mockUser.id } })
            );
        });
    });

    // --------------------------------------------------------------------------
    // 2. updateNotificationsToRead
    // --------------------------------------------------------------------------
    describe('updateNotificationsToRead', () => {
        it('should mark all unread notifications as read for user', async () => {
            (Notification.update as jest.Mock<any>).mockResolvedValue([5]);

            await notificationService.updateNotificationsToRead(mockUser);

            expect(Notification.update).toHaveBeenCalledWith(
                { read: NotificationReadEnums.READ },
                { where: { userId: mockUser.id, read: NotificationReadEnums.UN_READ } }
            );
        });
    });

    // --------------------------------------------------------------------------
    // 3. updateNotificationToClicked
    // --------------------------------------------------------------------------
    describe('updateNotificationToClicked', () => {
        it('should mark notification as clicked', async () => {
            const mockNotification = {
                id: 'notif-1',
                read: NotificationReadEnums.UN_READ,
                save: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
            };
            (Notification.findOne as jest.Mock<any>).mockResolvedValue(mockNotification);

            await notificationService.updateNotificationToClicked('notif-1', mockUser);

            expect(mockNotification.read).toBe(NotificationReadEnums.CLICKED);
            expect(mockNotification.save).toHaveBeenCalled();
        });

        it('should throw NOTIFICATION_NOT_FOUND when notification does not exist', async () => {
            (Notification.findOne as jest.Mock<any>).mockResolvedValue(null);

            await expect(notificationService.updateNotificationToClicked('nonexistent', mockUser))
                .rejects.toThrow(new BaseError(ERRORS.NOTIFICATION_NOT_FOUND));
        });
    });

    // --------------------------------------------------------------------------
    // 4. sendAssignLeadNotification
    // --------------------------------------------------------------------------
    describe('sendAssignLeadNotification', () => {
        it('should create a lead assigned notification', async () => {
            const mockNotification = { id: 1, type: NotificationTypeEnums.LEAD_ASSIGNED };
            (Notification.create as jest.Mock<any>).mockResolvedValue(mockNotification);

            await notificationService.sendAssignLeadNotification({
                userId: 2,
                target: 'lead-123',
            });

            expect(Notification.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 2,
                    target: 'lead-123',
                    body_en: 'New Lead assigned to you.',
                    body_ar: 'New Lead assigned to you.',
                    type: NotificationTypeEnums.LEAD_ASSIGNED,
                })
            );
        });
    });

    // --------------------------------------------------------------------------
    // 5. sendAssignDealNotification
    // --------------------------------------------------------------------------
    describe('sendAssignDealNotification', () => {
        it('should create a deal assigned notification with company name', async () => {
            const mockDeal: any = { name: 'Big Deal', companyName: 'Acme Corp', stage: 'PROGRESS' };
            const mockAdmin: any = { name: 'Admin', id: 1 };
            (Notification.create as jest.Mock<any>).mockResolvedValue({ id: 1 });

            await notificationService.sendAssignDealNotification(
                { userId: 2, target: 'deal-123' },
                mockDeal,
                mockAdmin
            );

            expect(Notification.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: NotificationTypeEnums.DEAL_ASSIGNED,
                    body_en: expect.stringContaining('Acme Corp'),
                })
            );
        });

        it('should create a deal notification without company name', async () => {
            const mockDeal: any = { name: 'Simple Deal', companyName: '', stage: 'PROGRESS' };
            const mockAdmin: any = { name: 'Admin', id: 1 };
            (Notification.create as jest.Mock<any>).mockResolvedValue({ id: 1 });

            await notificationService.sendAssignDealNotification(
                { userId: 2, target: 'deal-456' },
                mockDeal,
                mockAdmin
            );

            expect(Notification.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    body_en: expect.stringContaining('Simple Deal'),
                })
            );
        });
    });

    // --------------------------------------------------------------------------
    // 6. sendProposalAssignUsersNotification
    // --------------------------------------------------------------------------
    describe('sendProposalAssignUsersNotification', () => {
        it('should create notifications for each assigned user', async () => {
            const mockProposal: any = { id: 'prop-1', title: 'Website Proposal' };
            (Notification.create as jest.Mock<any>).mockResolvedValue({ id: 1 });

            await notificationService.sendProposalAssignUsersNotification(mockProposal, [2, 3, 4]);

            expect(Notification.create).toHaveBeenCalledTimes(3);
        });
    });

    // --------------------------------------------------------------------------
    // 7. createNotification (generic)
    // --------------------------------------------------------------------------
    describe('createNotification', () => {
        it('should create a generic system notification', async () => {
            const mockNotification = { id: 1, type: 'SYSTEM_ALERT' };
            (Notification.create as jest.Mock<any>).mockResolvedValue(mockNotification);

            const result = await notificationService.createNotification(
                1,
                'System Alert',
                'Backup completed',
                { target: 'system' }
            );

            expect(result).toEqual(mockNotification);
            expect(Notification.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 1,
                    body_en: 'Backup completed',
                    body_ar: 'Backup completed',
                    type: 'SYSTEM_ALERT',
                })
            );
        });
    });

    // --------------------------------------------------------------------------
    // 8. sendApproveProposalNotification
    // --------------------------------------------------------------------------
    describe('sendApproveProposalNotification', () => {
        it('should notify all proposal users about approval', async () => {
            const mockProposal: any = {
                id: 'prop-1',
                title: 'Big Proposal',
                users: [{ id: 10 }, { id: 11 }],
            };
            (Notification.create as jest.Mock<any>).mockResolvedValue({ id: 1 });

            await notificationService.sendApproveProposalNotification(mockProposal);

            expect(Notification.create).toHaveBeenCalledTimes(2);
            expect(Notification.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: NotificationTypeEnums.PROPOSAL_APPROVED,
                    body_en: expect.stringContaining('approved'),
                })
            );
        });
    });

    // --------------------------------------------------------------------------
    // 9. sendRejectProposalNotification
    // --------------------------------------------------------------------------
    describe('sendRejectProposalNotification', () => {
        it('should notify all proposal users about rejection', async () => {
            const mockProposal: any = {
                id: 'prop-1',
                title: 'Rejected Proposal',
                users: [{ id: 10 }],
            };
            (Notification.create as jest.Mock<any>).mockResolvedValue({ id: 1 });

            await notificationService.sendRejectProposalNotification(mockProposal);

            expect(Notification.create).toHaveBeenCalledTimes(1);
            expect(Notification.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: NotificationTypeEnums.PROPOSAL_REJECTED,
                    body_en: expect.stringContaining('rejected'),
                })
            );
        });
    });
});
