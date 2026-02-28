
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock dependencies before imports
jest.mock('../../src/campaign/campaignModel');
jest.mock('../../src/campaign/campaignRecipientModel');
jest.mock('../../src/campaign/emailTemplateModel');
jest.mock('../../src/utils/emailHelper');
jest.mock('../../src/user/userModel');
jest.mock('../../src/server', () => ({
    io: { emit: jest.fn() }
}));

import campaignService from '../../src/campaign/campaignService';
import Campaign from '../../src/campaign/campaignModel';
import CampaignRecipient from '../../src/campaign/campaignRecipientModel';
import EmailTemplate from '../../src/campaign/emailTemplateModel';
import { CampaignStatus, RecipientStatus } from '../../src/campaign/campaignEnum';
import { sendEmail } from '../../src/utils/emailHelper';

describe('CampaignService', () => {
    const mockUserId = 1;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------------------------------
    // 1. getCampaigns
    // --------------------------------------------------------------------------
    describe('getCampaigns', () => {
        it('should return all campaigns for a user', async () => {
            const mockCampaigns = [{ id: 'camp-1', name: 'Newsletter', status: CampaignStatus.DRAFT }];
            (Campaign.findAll as jest.Mock<any>).mockResolvedValue(mockCampaigns);

            const result = await campaignService.getCampaigns(mockUserId);

            expect(result).toEqual(mockCampaigns);
            expect(Campaign.findAll).toHaveBeenCalledWith(
                expect.objectContaining({ where: { userId: mockUserId } })
            );
        });
    });

    // --------------------------------------------------------------------------
    // 2. getCampaignById
    // --------------------------------------------------------------------------
    describe('getCampaignById', () => {
        it('should return a campaign by id', async () => {
            const mockCampaign = { id: 'camp-1', name: 'Newsletter' };
            (Campaign.findOne as jest.Mock<any>).mockResolvedValue(mockCampaign);

            const result = await campaignService.getCampaignById('camp-1', mockUserId);
            expect(result).toEqual(mockCampaign);
        });

        it('should throw when campaign not found', async () => {
            (Campaign.findOne as jest.Mock<any>).mockResolvedValue(null);

            await expect(campaignService.getCampaignById('nonexistent', mockUserId))
                .rejects.toThrow('Campaign not found');
        });
    });

    // --------------------------------------------------------------------------
    // 3. create
    // --------------------------------------------------------------------------
    describe('create', () => {
        it('should create a campaign with DRAFT status', async () => {
            const mockCampaign = { id: 'camp-1', name: 'New Campaign', status: CampaignStatus.DRAFT };
            (Campaign.create as jest.Mock<any>).mockResolvedValue(mockCampaign);

            const result = await campaignService.create(mockUserId, { name: 'New Campaign', subject: 'Hello' });

            expect(result).toEqual(mockCampaign);
            expect(Campaign.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'New Campaign',
                    userId: mockUserId,
                    status: CampaignStatus.DRAFT,
                })
            );
        });

        it('should bulk create recipients if provided', async () => {
            const mockCampaign = { id: 'camp-1', name: 'Campaign With Recipients' };
            (Campaign.create as jest.Mock<any>).mockResolvedValue(mockCampaign);
            (CampaignRecipient.bulkCreate as jest.Mock<any>).mockResolvedValue([]);

            await campaignService.create(mockUserId, {
                name: 'Campaign With Recipients',
                recipients: [
                    { email: 'a@test.com', name: 'Alice' },
                    { email: 'b@test.com', name: 'Bob' },
                ],
            });

            expect(CampaignRecipient.bulkCreate).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ campaignId: 'camp-1', contactEmail: 'a@test.com', contactName: 'Alice' }),
                    expect.objectContaining({ campaignId: 'camp-1', contactEmail: 'b@test.com', contactName: 'Bob' }),
                ])
            );
        });
    });

    // --------------------------------------------------------------------------
    // 4. update
    // --------------------------------------------------------------------------
    describe('update', () => {
        it('should update a draft campaign', async () => {
            const mockCampaign = {
                id: 'camp-1',
                status: CampaignStatus.DRAFT,
                update: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
            };
            (Campaign.findOne as jest.Mock<any>).mockResolvedValue(mockCampaign);

            await campaignService.update('camp-1', mockUserId, { subject: 'Updated Subject' });

            expect(mockCampaign.update).toHaveBeenCalledWith({ subject: 'Updated Subject' });
        });

        it('should throw when campaign not found', async () => {
            (Campaign.findOne as jest.Mock<any>).mockResolvedValue(null);

            await expect(campaignService.update('nonexistent', mockUserId, { subject: 'X' }))
                .rejects.toThrow('Campaign not found');
        });

        it('should throw when trying to edit non-draft campaign', async () => {
            const sentCampaign = { id: 'camp-1', status: CampaignStatus.SENT };
            (Campaign.findOne as jest.Mock<any>).mockResolvedValue(sentCampaign);

            await expect(campaignService.update('camp-1', mockUserId, { subject: 'X' }))
                .rejects.toThrow('Can only edit draft campaigns');
        });

        it('should replace recipients when provided in update', async () => {
            const mockCampaign = {
                id: 'camp-1',
                status: CampaignStatus.DRAFT,
                update: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
            };
            (Campaign.findOne as jest.Mock<any>).mockResolvedValue(mockCampaign);
            (CampaignRecipient.destroy as jest.Mock<any>).mockResolvedValue(2);
            (CampaignRecipient.bulkCreate as jest.Mock<any>).mockResolvedValue([]);

            await campaignService.update('camp-1', mockUserId, {
                recipients: [{ email: 'new@test.com', name: 'New' }],
            });

            expect(CampaignRecipient.destroy).toHaveBeenCalledWith({ where: { campaignId: 'camp-1' } });
            expect(CampaignRecipient.bulkCreate).toHaveBeenCalled();
        });
    });

    // --------------------------------------------------------------------------
    // 5. delete
    // --------------------------------------------------------------------------
    describe('delete', () => {
        it('should delete a campaign and its recipients', async () => {
            const mockCampaign = { id: 'camp-1', destroy: (jest.fn() as jest.Mock<any>).mockResolvedValue(true) };
            (Campaign.findOne as jest.Mock<any>).mockResolvedValue(mockCampaign);
            (CampaignRecipient.destroy as jest.Mock<any>).mockResolvedValue(5);

            await campaignService.delete('camp-1', mockUserId);

            expect(CampaignRecipient.destroy).toHaveBeenCalledWith({ where: { campaignId: 'camp-1' } });
            expect(mockCampaign.destroy).toHaveBeenCalled();
        });

        it('should throw when campaign not found', async () => {
            (Campaign.findOne as jest.Mock<any>).mockResolvedValue(null);

            await expect(campaignService.delete('nonexistent', mockUserId))
                .rejects.toThrow('Campaign not found');
        });
    });

    // --------------------------------------------------------------------------
    // 6. sendCampaign
    // --------------------------------------------------------------------------
    describe('sendCampaign', () => {
        it('should send campaign emails to all recipients', async () => {
            const mockRecipient1 = { contactEmail: 'a@test.com', contactName: 'Alice', update: jest.fn() };
            const mockRecipient2 = { contactEmail: 'b@test.com', contactName: 'Bob', update: jest.fn() };
            const mockCampaign = {
                id: 'camp-1',
                subject: 'Hello',
                htmlContent: '<p>Hello {{name}}</p>',
                recipients: [mockRecipient1, mockRecipient2],
                update: jest.fn(),
            };
            (Campaign.findOne as jest.Mock<any>).mockResolvedValue(mockCampaign);
            (sendEmail as jest.Mock<any>).mockResolvedValue(true);

            const result = await campaignService.sendCampaign('camp-1', mockUserId);

            expect(result.sent).toBe(2);
            expect(result.total).toBe(2);
            expect(mockCampaign.update).toHaveBeenCalledWith({ status: CampaignStatus.SENDING });
            expect(sendEmail).toHaveBeenCalledTimes(2);
        });

        it('should throw when campaign has no recipients', async () => {
            const mockCampaign = { id: 'camp-1', recipients: [], update: jest.fn() };
            (Campaign.findOne as jest.Mock<any>).mockResolvedValue(mockCampaign);

            await expect(campaignService.sendCampaign('camp-1', mockUserId))
                .rejects.toThrow('No recipients');
        });

        it('should mark failed recipients on email error', async () => {
            const mockRecipient = { contactEmail: 'fail@test.com', contactName: 'Fail', update: jest.fn() };
            const mockCampaign = {
                id: 'camp-1',
                subject: 'Hello',
                htmlContent: '<p>Hi</p>',
                recipients: [mockRecipient],
                update: jest.fn(),
            };
            (Campaign.findOne as jest.Mock<any>).mockResolvedValue(mockCampaign);
            (sendEmail as jest.Mock<any>).mockRejectedValue(new Error('SMTP error'));

            const result = await campaignService.sendCampaign('camp-1', mockUserId);

            expect(result.sent).toBe(0);
            expect(mockRecipient.update).toHaveBeenCalledWith({ status: RecipientStatus.FAILED });
        });
    });

    // --------------------------------------------------------------------------
    // 7. getAnalytics
    // --------------------------------------------------------------------------
    describe('getAnalytics', () => {
        it('should return campaign analytics', async () => {
            const recipients = [
                { status: RecipientStatus.SENT, openedAt: new Date(), clickedAt: null },
                { status: RecipientStatus.SENT, openedAt: new Date(), clickedAt: new Date() },
                { status: RecipientStatus.FAILED, openedAt: null, clickedAt: null },
            ];
            const mockCampaign = { id: 'camp-1', recipients };
            (Campaign.findOne as jest.Mock<any>).mockResolvedValue(mockCampaign);

            const result = await campaignService.getAnalytics('camp-1', mockUserId);

            expect(result.total).toBe(3);
            expect(result.opened).toBe(2);
            expect(result.clicked).toBe(1);
            expect(result.failed).toBe(1);
        });

        it('should throw when campaign not found', async () => {
            (Campaign.findOne as jest.Mock<any>).mockResolvedValue(null);

            await expect(campaignService.getAnalytics('nonexistent', mockUserId))
                .rejects.toThrow('Campaign not found');
        });
    });

    // --------------------------------------------------------------------------
    // 8. Templates
    // --------------------------------------------------------------------------
    describe('templates', () => {
        it('should return all templates for a user', async () => {
            const mockTemplates = [{ id: 'tpl-1', name: 'Welcome' }];
            (EmailTemplate.findAll as jest.Mock<any>).mockResolvedValue(mockTemplates);

            const result = await campaignService.getTemplates(mockUserId);
            expect(result).toEqual(mockTemplates);
        });

        it('should create a template', async () => {
            const mockTemplate = { id: 'tpl-1', name: 'New Template' };
            (EmailTemplate.create as jest.Mock<any>).mockResolvedValue(mockTemplate);

            const result = await campaignService.createTemplate(mockUserId, { name: 'New Template', html: '<p>Hi</p>' });
            expect(result).toEqual(mockTemplate);
        });

        it('should delete a template', async () => {
            const mockTemplate = { id: 'tpl-1', destroy: jest.fn() };
            (EmailTemplate.findOne as jest.Mock<any>).mockResolvedValue(mockTemplate);

            await campaignService.deleteTemplate('tpl-1', mockUserId);
            expect(mockTemplate.destroy).toHaveBeenCalled();
        });

        it('should throw when template not found for delete', async () => {
            (EmailTemplate.findOne as jest.Mock<any>).mockResolvedValue(null);

            await expect(campaignService.deleteTemplate('nonexistent', mockUserId))
                .rejects.toThrow('Template not found');
        });
    });
});
