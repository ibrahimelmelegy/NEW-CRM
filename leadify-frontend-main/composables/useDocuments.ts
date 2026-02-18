import { useApiFetch } from './useApiFetch';

export interface DocumentFolder {
  id: number;
  name: string;
  parentId: number | null;
  color: string | null;
  createdBy: number | null;
  children?: DocumentFolder[];
  creator?: { id: number; name: string; profilePicture: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface DocumentFile {
  id: number;
  name: string;
  originalName: string;
  path: string;
  mimeType: string;
  size: number;
  folderId: number | null;
  tags: string[];
  uploadedBy: number | null;
  folder?: { id: number; name: string; color: string };
  uploader?: { id: number; name: string; profilePicture: string };
  createdAt?: string;
  updatedAt?: string;
}

export function useDocuments() {
  const fetchFolders = (parentId?: number) => {
    const query = parentId ? `?parentId=${parentId}` : '';
    return useApiFetch(`documents/folders${query}`);
  };

  const fetchFolderTree = () => useApiFetch('documents/folders/tree');

  const createFolder = (data: { name: string; parentId?: number; color?: string }) =>
    useApiFetch('documents/folders', 'POST', data);

  const updateFolder = (id: number, data: { name?: string; parentId?: number; color?: string }) =>
    useApiFetch(`documents/folders/${id}`, 'PUT', data);

  const deleteFolder = (id: number) =>
    useApiFetch(`documents/folders/${id}`, 'DELETE');

  const fetchFiles = (params?: Record<string, any>) => {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return useApiFetch(`documents/files${query}`);
  };

  const fetchRecentFiles = (limit?: number) => {
    const query = limit ? `?limit=${limit}` : '';
    return useApiFetch(`documents/files/recent${query}`);
  };

  const fetchFile = (id: number) =>
    useApiFetch(`documents/files/${id}`);

  const createFile = (data: {
    name: string;
    originalName: string;
    path: string;
    mimeType?: string;
    size?: number;
    folderId?: number;
    tags?: string[];
  }) => useApiFetch('documents/files', 'POST', data);

  const updateFile = (id: number, data: { name?: string; tags?: string[]; folderId?: number }) =>
    useApiFetch(`documents/files/${id}`, 'PUT', data);

  const deleteFile = (id: number) =>
    useApiFetch(`documents/files/${id}`, 'DELETE');

  return {
    fetchFolders,
    fetchFolderTree,
    createFolder,
    updateFolder,
    deleteFolder,
    fetchFiles,
    fetchRecentFiles,
    fetchFile,
    createFile,
    updateFile,
    deleteFile
  };
}
