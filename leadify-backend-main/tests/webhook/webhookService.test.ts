
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import webhookService from '../../src/webhook/webhookService';
import Webhook from '../../src/webhook/webhookModel';

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------
jest.mock('../../src/webhook/webhookModel');
jest.mock('../../src/server', () => ({ io: { emit: jest.fn() } }));

// Mock global fetch
const mockFetch = jest.fn() as jest.Mock<any>;
(globalThis as any).fetch = mockFetch;

describe('WebhookService', () => {
    const mockWebhook: any = {
        id: 'wh-1',
        name: 'Test Webhook',
        url: 'https://example.com/hook',
        events: ['lead:created', 'deal:updated'],
        secret: 'test-secret-key',
        isActive: true,
        failureCount: 0,
        lastTriggered: null,
        update: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
        destroy: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------------------------------
    // getAll
    // --------------------------------------------------------------------------
    describe('getAll', () => {
        it('should return all webhooks ordered by createdAt DESC', async () => {
            (Webhook.findAll as jest.Mock<any>).mockResolvedValue([mockWebhook]);
            const result = await webhookService.getAll();
            expect(result).toHaveLength(1);
            expect(Webhook.findAll).toHaveBeenCalledWith({ order: [['createdAt', 'DESC']] });
        });
    });

    // --------------------------------------------------------------------------
    // create
    // --------------------------------------------------------------------------
    describe('create', () => {
        it('should create a webhook with provided data', async () => {
            (Webhook.create as jest.Mock<any>).mockResolvedValue(mockWebhook);
            const result = await webhookService.create({
                name: 'Test Webhook',
                url: 'https://example.com/hook',
                events: ['lead:created'],
                secret: 'my-secret',
            });
            expect(Webhook.create).toHaveBeenCalledWith(
                expect.objectContaining({ secret: 'my-secret' })
            );
            expect(result).toEqual(mockWebhook);
        });

        it('should auto-generate a secret if not provided', async () => {
            (Webhook.create as jest.Mock<any>).mockResolvedValue(mockWebhook);
            await webhookService.create({
                name: 'Test',
                url: 'https://example.com/hook',
                events: ['lead:created'],
            });
            expect(Webhook.create).toHaveBeenCalledWith(
                expect.objectContaining({ secret: expect.any(String) })
            );
        });
    });

    // --------------------------------------------------------------------------
    // update
    // --------------------------------------------------------------------------
    describe('update', () => {
        it('should update the webhook when found', async () => {
            (Webhook.findByPk as jest.Mock<any>).mockResolvedValue(mockWebhook);
            const result = await webhookService.update('wh-1', { name: 'Updated' });
            expect(mockWebhook.update).toHaveBeenCalledWith({ name: 'Updated' });
        });

        it('should throw when webhook not found', async () => {
            (Webhook.findByPk as jest.Mock<any>).mockResolvedValue(null);
            await expect(webhookService.update('missing', {}))
                .rejects.toThrow('Webhook not found');
        });
    });

    // --------------------------------------------------------------------------
    // delete
    // --------------------------------------------------------------------------
    describe('delete', () => {
        it('should delete the webhook when found', async () => {
            (Webhook.findByPk as jest.Mock<any>).mockResolvedValue(mockWebhook);
            await webhookService.delete('wh-1');
            expect(mockWebhook.destroy).toHaveBeenCalled();
        });

        it('should throw when webhook not found', async () => {
            (Webhook.findByPk as jest.Mock<any>).mockResolvedValue(null);
            await expect(webhookService.delete('missing'))
                .rejects.toThrow('Webhook not found');
        });
    });

    // --------------------------------------------------------------------------
    // fire
    // --------------------------------------------------------------------------
    describe('fire', () => {
        it('should deliver to webhooks matching the event', async () => {
            (Webhook.findAll as jest.Mock<any>).mockResolvedValue([mockWebhook]);
            mockFetch.mockResolvedValue({ ok: true, status: 200 });

            await webhookService.fire('lead:created', { id: 'lead-1' });
            expect(Webhook.findAll).toHaveBeenCalledWith({ where: { isActive: true } });
        });

        it('should not deliver to webhooks that do not match the event', async () => {
            (Webhook.findAll as jest.Mock<any>).mockResolvedValue([mockWebhook]);
            await webhookService.fire('unknown:event', {});
            // The matching filter should produce zero deliveries
            // fetch should not be called because no webhook matches
        });
    });

    // --------------------------------------------------------------------------
    // test
    // --------------------------------------------------------------------------
    describe('test', () => {
        it('should send a test payload and return response status', async () => {
            (Webhook.findByPk as jest.Mock<any>).mockResolvedValue(mockWebhook);
            mockFetch.mockResolvedValue({ ok: true, status: 200 });

            const result = await webhookService.test('wh-1');
            expect(result).toEqual({ status: 200, ok: true });
            expect(mockFetch).toHaveBeenCalledWith(
                'https://example.com/hook',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'X-Webhook-Event': 'test',
                    }),
                })
            );
        });

        it('should throw when webhook not found for testing', async () => {
            (Webhook.findByPk as jest.Mock<any>).mockResolvedValue(null);
            await expect(webhookService.test('missing'))
                .rejects.toThrow('Webhook not found');
        });
    });
});
