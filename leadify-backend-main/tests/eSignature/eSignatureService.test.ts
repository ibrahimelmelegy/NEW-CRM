
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import eSignatureService from '../../src/eSignature/eSignatureService';
import ESignature from '../../src/eSignature/eSignatureModel';

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------
jest.mock('../../src/eSignature/eSignatureModel');
jest.mock('../../src/user/userModel');
jest.mock('../../src/server', () => ({ io: { emit: jest.fn() } }));

jest.mock('../../src/utils/pagination', () => ({
    clampPagination: jest.fn((q: any) => ({
        page: q.page || 1,
        limit: q.limit || 10,
        offset: ((q.page || 1) - 1) * (q.limit || 10),
    })),
}));

describe('ESignatureService', () => {
    const mockDoc: any = {
        id: 'esig-1',
        title: 'NDA Agreement',
        status: 'PENDING',
        recipients: [
            { name: 'Alice', email: 'alice@test.com', role: 'SIGNER', status: 'PENDING', signedAt: null },
            { name: 'Bob', email: 'bob@test.com', role: 'SIGNER', status: 'PENDING', signedAt: null },
        ],
        sentAt: '2026-03-01T00:00:00Z',
        createdBy: 1,
        update: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
        destroy: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------------------------------
    // create
    // --------------------------------------------------------------------------
    describe('create', () => {
        it('should create an e-signature request with PENDING recipients', async () => {
            (ESignature.create as jest.Mock<any>).mockResolvedValue(mockDoc);
            (ESignature.findByPk as jest.Mock<any>).mockResolvedValue(mockDoc);
            const { io } = require('../../src/server');

            const result = await eSignatureService.create(
                { title: 'NDA Agreement', recipients: [{ name: 'Alice', email: 'alice@test.com' }] },
                1,
                'tenant-1'
            );

            expect(ESignature.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'NDA Agreement',
                    status: 'PENDING',
                    createdBy: 1,
                    tenantId: 'tenant-1',
                })
            );
            expect(io.emit).toHaveBeenCalledWith('eSignature:created', expect.anything());
        });
    });

    // --------------------------------------------------------------------------
    // getAll
    // --------------------------------------------------------------------------
    describe('getAll', () => {
        it('should return paginated e-signature documents', async () => {
            (ESignature.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [mockDoc], count: 1 });
            const result = await eSignatureService.getAll({}, 'tenant-1');
            expect(result.docs).toHaveLength(1);
            expect(result.pagination.totalItems).toBe(1);
        });

        it('should filter by status when provided', async () => {
            (ESignature.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });
            await eSignatureService.getAll({ status: 'SIGNED' }, 'tenant-1');
            expect(ESignature.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({ where: expect.objectContaining({ status: 'SIGNED' }) })
            );
        });
    });

    // --------------------------------------------------------------------------
    // getById
    // --------------------------------------------------------------------------
    describe('getById', () => {
        it('should return document by id', async () => {
            (ESignature.findByPk as jest.Mock<any>).mockResolvedValue(mockDoc);
            const result = await eSignatureService.getById('esig-1');
            expect(result).toEqual(mockDoc);
        });
    });

    // --------------------------------------------------------------------------
    // update
    // --------------------------------------------------------------------------
    describe('update', () => {
        it('should update the document when found', async () => {
            (ESignature.findByPk as jest.Mock<any>).mockResolvedValue(mockDoc);
            await eSignatureService.update('esig-1', { title: 'Updated NDA' });
            expect(mockDoc.update).toHaveBeenCalledWith({ title: 'Updated NDA' });
        });

        it('should return null when document not found', async () => {
            (ESignature.findByPk as jest.Mock<any>).mockResolvedValue(null);
            const result = await eSignatureService.update('missing', {});
            expect(result).toBeNull();
        });
    });

    // --------------------------------------------------------------------------
    // delete
    // --------------------------------------------------------------------------
    describe('delete', () => {
        it('should delete and return true', async () => {
            (ESignature.findByPk as jest.Mock<any>).mockResolvedValue(mockDoc);
            const result = await eSignatureService.delete('esig-1');
            expect(mockDoc.destroy).toHaveBeenCalled();
            expect(result).toBe(true);
        });

        it('should return false when not found', async () => {
            (ESignature.findByPk as jest.Mock<any>).mockResolvedValue(null);
            const result = await eSignatureService.delete('missing');
            expect(result).toBe(false);
        });
    });

    // --------------------------------------------------------------------------
    // sign
    // --------------------------------------------------------------------------
    describe('sign', () => {
        it('should mark a recipient as SIGNED', async () => {
            const doc = {
                ...mockDoc,
                recipients: [
                    { name: 'Alice', email: 'alice@test.com', role: 'SIGNER', status: 'PENDING', signedAt: null },
                    { name: 'Bob', email: 'bob@test.com', role: 'SIGNER', status: 'PENDING', signedAt: null },
                ],
                update: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
            };
            (ESignature.findByPk as jest.Mock<any>).mockResolvedValue(doc);

            await eSignatureService.sign('esig-1', 'alice@test.com');
            expect(doc.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    recipients: expect.arrayContaining([
                        expect.objectContaining({ email: 'alice@test.com', status: 'SIGNED' }),
                    ]),
                    status: 'PENDING', // Bob still pending
                })
            );
        });

        it('should set overall status to SIGNED when all recipients sign', async () => {
            const doc = {
                ...mockDoc,
                recipients: [
                    { name: 'Alice', email: 'alice@test.com', role: 'SIGNER', status: 'SIGNED', signedAt: '2026-03-01' },
                    { name: 'Bob', email: 'bob@test.com', role: 'SIGNER', status: 'PENDING', signedAt: null },
                ],
                update: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
            };
            (ESignature.findByPk as jest.Mock<any>).mockResolvedValue(doc);

            await eSignatureService.sign('esig-1', 'bob@test.com');
            expect(doc.update).toHaveBeenCalledWith(
                expect.objectContaining({ status: 'SIGNED' })
            );
        });

        it('should return null if document is EXPIRED', async () => {
            (ESignature.findByPk as jest.Mock<any>).mockResolvedValue({ ...mockDoc, status: 'EXPIRED' });
            const result = await eSignatureService.sign('esig-1', 'alice@test.com');
            expect(result).toBeNull();
        });

        it('should return null for unknown recipient email', async () => {
            (ESignature.findByPk as jest.Mock<any>).mockResolvedValue(mockDoc);
            const result = await eSignatureService.sign('esig-1', 'unknown@test.com');
            expect(result).toBeNull();
        });
    });

    // --------------------------------------------------------------------------
    // decline
    // --------------------------------------------------------------------------
    describe('decline', () => {
        it('should set overall status to DECLINED', async () => {
            const doc = {
                ...mockDoc,
                recipients: [
                    { name: 'Alice', email: 'alice@test.com', role: 'SIGNER', status: 'PENDING', signedAt: null },
                ],
                update: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
            };
            (ESignature.findByPk as jest.Mock<any>).mockResolvedValue(doc);

            await eSignatureService.decline('esig-1', 'alice@test.com');
            expect(doc.update).toHaveBeenCalledWith(
                expect.objectContaining({ status: 'DECLINED' })
            );
        });
    });

    // --------------------------------------------------------------------------
    // resendReminder
    // --------------------------------------------------------------------------
    describe('resendReminder', () => {
        it('should return pending count for PENDING documents', async () => {
            (ESignature.findByPk as jest.Mock<any>).mockResolvedValue(mockDoc);
            const result = await eSignatureService.resendReminder('esig-1');
            expect(result).toEqual({ sent: true, pendingRecipients: 2 });
        });

        it('should return null for non-PENDING documents', async () => {
            (ESignature.findByPk as jest.Mock<any>).mockResolvedValue({ ...mockDoc, status: 'SIGNED' });
            const result = await eSignatureService.resendReminder('esig-1');
            expect(result).toBeNull();
        });

        it('should return null when document not found', async () => {
            (ESignature.findByPk as jest.Mock<any>).mockResolvedValue(null);
            const result = await eSignatureService.resendReminder('missing');
            expect(result).toBeNull();
        });
    });
});
