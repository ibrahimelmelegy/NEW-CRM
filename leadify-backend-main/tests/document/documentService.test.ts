import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import documentService from '../../src/documents/documentService';
import DocumentFolder from '../../src/documents/documentFolderModel';
import DocumentFile from '../../src/documents/documentFileModel';

jest.mock('../../src/documents/documentFolderModel');
jest.mock('../../src/documents/documentFileModel');

describe('DocumentService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createFolder', () => {
        it('should create a folder with the provided data', async () => {
            const data = { name: 'Contracts', color: '#3498db', createdBy: 1 };
            const mockFolder = { id: 1, ...data };
            (DocumentFolder.create as jest.Mock<any>).mockResolvedValue(mockFolder);
            const result = await documentService.createFolder(data);
            expect(DocumentFolder.create).toHaveBeenCalledWith(data);
            expect(result).toEqual(mockFolder);
        });
    });

    describe('updateFolder', () => {
        it('should update an existing folder', async () => {
            const mockFolder: any = {
                id: 1,
                name: 'Old Name',
                update: jest.fn().mockImplementation(() => Promise.resolve({ id: 1, name: 'New Name' })),
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

        it('should throw when trying to set folder as its own parent', async () => {
            const mockFolder: any = {
                id: 5,
                update: jest.fn().mockImplementation(() => Promise.resolve()),
            };
            (DocumentFolder.findByPk as jest.Mock<any>).mockResolvedValue(mockFolder);
            await expect(documentService.updateFolder(5, { parentId: 5 }))
                .rejects.toThrow('A folder cannot be its own parent');
        });
    });

    describe('deleteFolder', () => {
        it('should delete folder, reassign children and files to root', async () => {
            const mockFolder: any = {
                id: 1,
                destroy: jest.fn().mockImplementation(() => Promise.resolve()),
            };
            (DocumentFolder.findByPk as jest.Mock<any>).mockResolvedValue(mockFolder);
            (DocumentFolder.update as jest.Mock<any>).mockResolvedValue([2]);
            (DocumentFile.update as jest.Mock<any>).mockResolvedValue([3]);
            const result = await documentService.deleteFolder(1);
            expect(DocumentFolder.update).toHaveBeenCalledWith({ parentId: null }, { where: { parentId: 1 } });
            expect(DocumentFile.update).toHaveBeenCalledWith({ folderId: null }, { where: { folderId: 1 } });
            expect(mockFolder.destroy).toHaveBeenCalled();
            expect(result).toEqual({ deleted: true });
        });

        it('should throw when folder not found', async () => {
            (DocumentFolder.findByPk as jest.Mock<any>).mockResolvedValue(null);
            await expect(documentService.deleteFolder(999)).rejects.toThrow('Folder not found');
        });
    });

    describe('createFile', () => {
        it('should create a file with the provided data', async () => {
            const data = {
                name: 'report.pdf',
                originalName: 'report.pdf',
                path: '/uploads/report.pdf',
                mimeType: 'application/pdf',
                size: 2048,
                folderId: 1,
                tags: ['finance', 'Q1'],
                uploadedBy: 1,
            };
            const mockFile = { id: 1, ...data };
            (DocumentFile.create as jest.Mock<any>).mockResolvedValue(mockFile);
            const result = await documentService.createFile(data);
            expect(DocumentFile.create).toHaveBeenCalledWith(data);
            expect(result).toEqual(mockFile);
        });
    });

    describe('updateFile', () => {
        it('should update an existing file', async () => {
            const mockFile: any = {
                id: 1,
                name: 'old-name.pdf',
                update: jest.fn().mockImplementation(() => Promise.resolve({ id: 1, name: 'renamed.pdf' })),
            };
            (DocumentFile.findByPk as jest.Mock<any>).mockResolvedValue(mockFile);
            await documentService.updateFile(1, { name: 'renamed.pdf' });
            expect(mockFile.update).toHaveBeenCalledWith({ name: 'renamed.pdf' });
        });

        it('should throw when file not found', async () => {
            (DocumentFile.findByPk as jest.Mock<any>).mockResolvedValue(null);
            await expect(documentService.updateFile(999, { name: 'X' })).rejects.toThrow('File not found');
        });
    });

    describe('deleteFile', () => {
        it('should delete an existing file and return { deleted: true }', async () => {
            const mockFile: any = {
                id: 1,
                destroy: jest.fn().mockImplementation(() => Promise.resolve()),
            };
            (DocumentFile.findByPk as jest.Mock<any>).mockResolvedValue(mockFile);
            const result = await documentService.deleteFile(1);
            expect(mockFile.destroy).toHaveBeenCalled();
            expect(result).toEqual({ deleted: true });
        });

        it('should throw when file not found', async () => {
            (DocumentFile.findByPk as jest.Mock<any>).mockResolvedValue(null);
            await expect(documentService.deleteFile(999)).rejects.toThrow('File not found');
        });
    });

    describe('getFileById', () => {
        it('should return a file when found', async () => {
            const mockFile = { id: 1, name: 'test.pdf' };
            (DocumentFile.findByPk as jest.Mock<any>).mockResolvedValue(mockFile);
            const result = await documentService.getFileById(1);
            expect(result).toEqual(mockFile);
        });

        it('should throw when file not found', async () => {
            (DocumentFile.findByPk as jest.Mock<any>).mockResolvedValue(null);
            await expect(documentService.getFileById(999)).rejects.toThrow('File not found');
        });
    });

    describe('getRecentFiles', () => {
        it('should return recent files with default limit of 10', async () => {
            const mockFiles = [{ id: 1, name: 'recent.pdf' }];
            (DocumentFile.findAll as jest.Mock<any>).mockResolvedValue(mockFiles);
            const result = await documentService.getRecentFiles();
            expect(DocumentFile.findAll).toHaveBeenCalledWith(
                expect.objectContaining({ order: [['createdAt', 'DESC']], limit: 10 })
            );
            expect(result).toEqual(mockFiles);
        });
    });
});
