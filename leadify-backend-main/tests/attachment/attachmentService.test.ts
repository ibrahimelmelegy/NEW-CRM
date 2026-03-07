
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import attachmentService from '../../src/attachments/attachmentService';
import Attachment from '../../src/attachments/attachmentModel';

// Mock the Sequelize model
jest.mock('../../src/attachments/attachmentModel');

describe('AttachmentService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------------------------------
    // 1. getAttachments
    // --------------------------------------------------------------------------
    describe('getAttachments', () => {
        it('should return attachments filtered by entityType and entityId', async () => {
            const mockAttachments = [
                { id: 1, entityType: 'lead', entityId: 10, fileName: 'file1.pdf' },
                { id: 2, entityType: 'lead', entityId: 10, fileName: 'file2.png' },
            ];
            (Attachment.findAll as jest.Mock<any>).mockResolvedValue(mockAttachments);

            const result = await attachmentService.getAttachments('lead', 10);

            expect(Attachment.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { entityType: 'lead', entityId: 10 },
                })
            );
            expect(result).toEqual({ docs: mockAttachments });
        });

        it('should return empty docs array when findAll throws', async () => {
            (Attachment.findAll as jest.Mock<any>).mockRejectedValue(new Error('DB error'));

            const result = await attachmentService.getAttachments('lead', 10);

            expect(result).toEqual({ docs: [] });
        });

        it('should build where clause only with provided filters', async () => {
            (Attachment.findAll as jest.Mock<any>).mockResolvedValue([]);

            await attachmentService.getAttachments('deal', NaN);

            // entityId is NaN so it should not be added to where
            expect(Attachment.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { entityType: 'deal' },
                })
            );
        });
    });

    // --------------------------------------------------------------------------
    // 2. createAttachment
    // --------------------------------------------------------------------------
    describe('createAttachment', () => {
        it('should create an attachment with provided data and userId', async () => {
            const data = {
                entityType: 'lead',
                entityId: 5,
                fileUrl: '/uploads/test.pdf',
                fileName: 'test.pdf',
                fileSize: 1024,
                mimeType: 'application/pdf',
            };
            const mockCreated = { id: 1, ...data, uploadedBy: 1 };
            (Attachment.create as jest.Mock<any>).mockResolvedValue(mockCreated);

            const result = await attachmentService.createAttachment(data, 1);

            expect(Attachment.create).toHaveBeenCalledWith({ ...data, uploadedBy: 1 });
            expect(result).toEqual(mockCreated);
        });

        it('should propagate errors from Attachment.create', async () => {
            const data = {
                entityType: 'lead',
                entityId: 5,
                fileUrl: '/uploads/test.pdf',
                fileName: 'test.pdf',
            };
            (Attachment.create as jest.Mock<any>).mockRejectedValue(new Error('Validation error'));

            await expect(attachmentService.createAttachment(data, 1)).rejects.toThrow('Validation error');
        });
    });

    // --------------------------------------------------------------------------
    // 3. deleteAttachment
    // --------------------------------------------------------------------------
    describe('deleteAttachment', () => {
        it('should delete an existing attachment and return { deleted: true }', async () => {
            const mockAttachment: any = {
                id: 1,
                destroy: jest.fn().mockImplementation(() => Promise.resolve()),
            };
            (Attachment.findByPk as jest.Mock<any>).mockResolvedValue(mockAttachment);

            const result = await attachmentService.deleteAttachment(1, 1);

            expect(Attachment.findByPk).toHaveBeenCalledWith(1);
            expect(mockAttachment.destroy).toHaveBeenCalled();
            expect(result).toEqual({ deleted: true });
        });

        it('should throw "Attachment not found" when id does not exist', async () => {
            (Attachment.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await expect(attachmentService.deleteAttachment(999, 1)).rejects.toThrow('Attachment not found');
        });
    });
});
