
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock dependencies before imports
jest.mock('../../src/documents/documentFolderModel');
jest.mock('../../src/documents/documentFileModel');
jest.mock('../../src/user/userModel');
jest.mock('../../src/server', () => ({
    io: { emit: jest.fn() }
}));

import documentService from '../../src/documents/documentService';
import DocumentFolder from '../../src/documents/documentFolderModel';
import DocumentFile from '../../src/documents/documentFileModel';

describe('DocumentService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------------------------------
    // FOLDERS
    // --------------------------------------------------------------------------
    describe('getFolders', () => {
        it('should return root folders when no parentId', async () => {
            const mockFolders = [{ id: 1, name: 'Root Folder', parentId: null }];
            (DocumentFolder.findAll as jest.Mock<any>).mockResolvedValue(mockFolders);

            const result = await documentService.getFolders();

            expect(result).toEqual(mockFolders);
            expect(DocumentFolder.findAll).toHaveBeenCalledWith(
                expect.objectContaining({ where: { parentId: null } })
            );
        });

        it('should return child folders when parentId provided', async () => {
            const mockFolders = [{ id: 2, name: 'Child Folder', parentId: 1 }];
            (DocumentFolder.findAll as jest.Mock<any>).mockResolvedValue(mockFolders);

            const result = await documentService.getFolders(1);

            expect(result).toEqual(mockFolders);
            expect(DocumentFolder.findAll).toHaveBeenCalledWith(
                expect.objectContaining({ where: { parentId: 1 } })
            );
        });
    });

    describe('createFolder', () => {
        it('should create a folder', async () => {
            const mockFolder = { id: 1, name: 'New Folder', color: '#ff0000' };
            (DocumentFolder.create as jest.Mock<any>).mockResolvedValue(mockFolder);

            const result = await documentService.createFolder({ name: 'New Folder', color: '#ff0000' });

            expect(result).toEqual(mockFolder);
            expect(DocumentFolder.create).toHaveBeenCalledWith(
                expect.objectContaining({ name: 'New Folder', color: '#ff0000' })
            );
        });
    });

    describe('updateFolder', () => {
        it('should update a folder', async () => {
            const mockFolder = {
                id: 1,
                name: 'Old Name',
                update: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
            };
            (DocumentFolder.findByPk as jest.Mock<any>).mockResolvedValue(mockFolder);

            await documentService.updateFolder(1, { name: 'New Name' });

            expect(mockFolder.update).toHaveBeenCalledWith({ name: 'New Name' });
        });

        it('should throw when folder not found', async () => {
            (DocumentFolder.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await expect(documentService.updateFolder(999, { name: 'X' }))
                .rejects.toThrow('Folder not found');
        });

        it('should throw when folder is set as its own parent', async () => {
            const mockFolder = { id: 5, name: 'Folder' };
            (DocumentFolder.findByPk as jest.Mock<any>).mockResolvedValue(mockFolder);

            await expect(documentService.updateFolder(5, { parentId: 5 }))
                .rejects.toThrow('A folder cannot be its own parent');
        });
    });

    describe('deleteFolder', () => {
        it('should delete a folder and reparent children to root', async () => {
            const mockFolder = { id: 1, destroy: (jest.fn() as jest.Mock<any>).mockResolvedValue(true) };
            (DocumentFolder.findByPk as jest.Mock<any>).mockResolvedValue(mockFolder);
            (DocumentFolder.update as jest.Mock<any>).mockResolvedValue([2]); // 2 children reparented
            (DocumentFile.update as jest.Mock<any>).mockResolvedValue([3]); // 3 files moved to root

            const result = await documentService.deleteFolder(1);

            expect(result).toEqual({ deleted: true });
            expect(DocumentFolder.update).toHaveBeenCalledWith(
                { parentId: null },
                { where: { parentId: 1 } }
            );
            expect(DocumentFile.update).toHaveBeenCalledWith(
                { folderId: null },
                { where: { folderId: 1 } }
            );
            expect(mockFolder.destroy).toHaveBeenCalled();
        });

        it('should throw when folder not found', async () => {
            (DocumentFolder.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await expect(documentService.deleteFolder(999))
                .rejects.toThrow('Folder not found');
        });
    });

    // --------------------------------------------------------------------------
    // FILES
    // --------------------------------------------------------------------------
    describe('getFiles', () => {
        it('should return paginated files', async () => {
            const mockFiles = [{ id: 1, name: 'doc.pdf' }];
            (DocumentFile.findAndCountAll as jest.Mock<any>).mockResolvedValue({
                rows: mockFiles,
                count: 1,
            });

            const result = await documentService.getFiles({ page: 1, limit: 50 });

            expect(result.docs).toEqual(mockFiles);
            expect(result.pagination.totalItems).toBe(1);
        });

        it('should filter files by folderId', async () => {
            (DocumentFile.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            await documentService.getFiles({ folderId: 5 });

            const callArgs = (DocumentFile.findAndCountAll as jest.Mock<any>).mock.calls[0][0] as any;
            expect(callArgs.where.folderId).toBe(5);
        });
    });

    describe('getFileById', () => {
        it('should return file by id', async () => {
            const mockFile = { id: 1, name: 'doc.pdf' };
            (DocumentFile.findByPk as jest.Mock<any>).mockResolvedValue(mockFile);

            const result = await documentService.getFileById(1);
            expect(result).toEqual(mockFile);
        });

        it('should throw when file not found', async () => {
            (DocumentFile.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await expect(documentService.getFileById(999))
                .rejects.toThrow('File not found');
        });
    });

    describe('createFile', () => {
        it('should create a file record', async () => {
            const mockFile = { id: 1, name: 'doc.pdf', path: '/uploads/doc.pdf' };
            (DocumentFile.create as jest.Mock<any>).mockResolvedValue(mockFile);

            const result = await documentService.createFile({
                name: 'doc.pdf',
                originalName: 'document.pdf',
                path: '/uploads/doc.pdf',
                mimeType: 'application/pdf',
                size: 1024,
            });

            expect(result).toEqual(mockFile);
        });
    });

    describe('updateFile', () => {
        it('should update file metadata', async () => {
            const mockFile = {
                id: 1,
                name: 'old-name.pdf',
                update: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
            };
            (DocumentFile.findByPk as jest.Mock<any>).mockResolvedValue(mockFile);

            await documentService.updateFile(1, { name: 'new-name.pdf', tags: ['important'] });

            expect(mockFile.update).toHaveBeenCalledWith({ name: 'new-name.pdf', tags: ['important'] });
        });

        it('should throw when file not found', async () => {
            (DocumentFile.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await expect(documentService.updateFile(999, { name: 'X' }))
                .rejects.toThrow('File not found');
        });
    });

    describe('deleteFile', () => {
        it('should delete a file', async () => {
            const mockFile = { id: 1, destroy: (jest.fn() as jest.Mock<any>).mockResolvedValue(true) };
            (DocumentFile.findByPk as jest.Mock<any>).mockResolvedValue(mockFile);

            const result = await documentService.deleteFile(1);

            expect(result).toEqual({ deleted: true });
            expect(mockFile.destroy).toHaveBeenCalled();
        });

        it('should throw when file not found', async () => {
            (DocumentFile.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await expect(documentService.deleteFile(999))
                .rejects.toThrow('File not found');
        });
    });

    describe('getRecentFiles', () => {
        it('should return recent files with default limit', async () => {
            const mockFiles = [{ id: 1, name: 'recent.pdf' }];
            (DocumentFile.findAll as jest.Mock<any>).mockResolvedValue(mockFiles);

            const result = await documentService.getRecentFiles();

            expect(result).toEqual(mockFiles);
            expect(DocumentFile.findAll).toHaveBeenCalledWith(
                expect.objectContaining({ limit: 10 })
            );
        });

        it('should accept custom limit', async () => {
            (DocumentFile.findAll as jest.Mock<any>).mockResolvedValue([]);

            await documentService.getRecentFiles(5);

            expect(DocumentFile.findAll).toHaveBeenCalledWith(
                expect.objectContaining({ limit: 5 })
            );
        });
    });
});
