/**
 * useDocuments - Unit Tests
 * ===========================
 * Tests for composables/useDocuments.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useDocuments } from '~/composables/useDocuments';

const mockApiFetch = vi.fn();
(globalThis as any).useApiFetch = mockApiFetch;

vi.mock('@/composables/useApiFetch', () => ({
  useApiFetch: (...args: any[]) => mockApiFetch(...args)
}));

describe('useDocuments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // Folders
  // ============================================
  describe('fetchFolders', () => {
    it('should fetch root folders without parentId', async () => {
      mockApiFetch.mockResolvedValue({ body: [], success: true });
      const { fetchFolders } = useDocuments();

      await fetchFolders();

      expect(mockApiFetch).toHaveBeenCalledWith('documents/folders');
    });

    it('should fetch child folders with parentId', async () => {
      mockApiFetch.mockResolvedValue({ body: [], success: true });
      const { fetchFolders } = useDocuments();

      await fetchFolders(5);

      expect(mockApiFetch).toHaveBeenCalledWith('documents/folders?parentId=5');
    });
  });

  describe('fetchFolderTree', () => {
    it('should fetch full folder tree', async () => {
      mockApiFetch.mockResolvedValue({ body: [], success: true });
      const { fetchFolderTree } = useDocuments();

      await fetchFolderTree();

      expect(mockApiFetch).toHaveBeenCalledWith('documents/folders/tree');
    });
  });

  describe('createFolder', () => {
    it('should POST new folder', async () => {
      mockApiFetch.mockResolvedValue({ success: true });
      const { createFolder } = useDocuments();

      await createFolder({ name: 'New Folder' });

      expect(mockApiFetch).toHaveBeenCalledWith('documents/folders', 'POST', { name: 'New Folder' });
    });

    it('should support parentId and color', async () => {
      mockApiFetch.mockResolvedValue({ success: true });
      const { createFolder } = useDocuments();

      await createFolder({ name: 'Sub Folder', parentId: 1, color: '#ff0000' });

      expect(mockApiFetch).toHaveBeenCalledWith('documents/folders', 'POST', { name: 'Sub Folder', parentId: 1, color: '#ff0000' });
    });
  });

  describe('updateFolder', () => {
    it('should PUT folder update', async () => {
      mockApiFetch.mockResolvedValue({ success: true });
      const { updateFolder } = useDocuments();

      await updateFolder(1, { name: 'Renamed' });

      expect(mockApiFetch).toHaveBeenCalledWith('documents/folders/1', 'PUT', { name: 'Renamed' });
    });
  });

  describe('deleteFolder', () => {
    it('should DELETE folder by id', async () => {
      mockApiFetch.mockResolvedValue({ success: true });
      const { deleteFolder } = useDocuments();

      await deleteFolder(1);

      expect(mockApiFetch).toHaveBeenCalledWith('documents/folders/1', 'DELETE');
    });
  });

  // ============================================
  // Files
  // ============================================
  describe('fetchFiles', () => {
    it('should fetch files without params', async () => {
      mockApiFetch.mockResolvedValue({ body: { docs: [] }, success: true });
      const { fetchFiles } = useDocuments();

      await fetchFiles();

      expect(mockApiFetch).toHaveBeenCalledWith('documents/files');
    });

    it('should fetch files with params', async () => {
      mockApiFetch.mockResolvedValue({ body: { docs: [] }, success: true });
      const { fetchFiles } = useDocuments();

      await fetchFiles({ folderId: '1' });

      expect(mockApiFetch).toHaveBeenCalledWith('documents/files?folderId=1');
    });
  });

  describe('fetchRecentFiles', () => {
    it('should fetch recent files', async () => {
      mockApiFetch.mockResolvedValue({ body: [], success: true });
      const { fetchRecentFiles } = useDocuments();

      await fetchRecentFiles();

      expect(mockApiFetch).toHaveBeenCalledWith('documents/files/recent');
    });

    it('should fetch recent files with limit', async () => {
      mockApiFetch.mockResolvedValue({ body: [], success: true });
      const { fetchRecentFiles } = useDocuments();

      await fetchRecentFiles(5);

      expect(mockApiFetch).toHaveBeenCalledWith('documents/files/recent?limit=5');
    });
  });

  describe('fetchFile', () => {
    it('should fetch single file by id', async () => {
      mockApiFetch.mockResolvedValue({ body: { id: 1, name: 'file.pdf' }, success: true });
      const { fetchFile } = useDocuments();

      await fetchFile(1);

      expect(mockApiFetch).toHaveBeenCalledWith('documents/files/1');
    });
  });

  describe('createFile', () => {
    it('should POST file data', async () => {
      mockApiFetch.mockResolvedValue({ success: true });
      const { createFile } = useDocuments();

      await createFile({ name: 'file.pdf', originalName: 'file.pdf', path: '/uploads/file.pdf' });

      expect(mockApiFetch).toHaveBeenCalledWith('documents/files', 'POST', { name: 'file.pdf', originalName: 'file.pdf', path: '/uploads/file.pdf' });
    });
  });

  describe('updateFile', () => {
    it('should PUT file update', async () => {
      mockApiFetch.mockResolvedValue({ success: true });
      const { updateFile } = useDocuments();

      await updateFile(1, { name: 'renamed.pdf', tags: ['important'] });

      expect(mockApiFetch).toHaveBeenCalledWith('documents/files/1', 'PUT', { name: 'renamed.pdf', tags: ['important'] });
    });
  });

  describe('deleteFile', () => {
    it('should DELETE file by id', async () => {
      mockApiFetch.mockResolvedValue({ success: true });
      const { deleteFile } = useDocuments();

      await deleteFile(1);

      expect(mockApiFetch).toHaveBeenCalledWith('documents/files/1', 'DELETE');
    });
  });
});
