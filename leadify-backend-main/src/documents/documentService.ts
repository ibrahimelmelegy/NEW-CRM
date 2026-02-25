import { Op } from 'sequelize';
import DocumentFolder from './documentFolderModel';
import DocumentFile from './documentFileModel';
import User from '../user/userModel';

class DocumentService {
  // ==================== FOLDERS ====================

  async getFolders(parentId?: number) {
    const where: any = {};
    if (parentId) {
      where.parentId = parentId;
    } else {
      where.parentId = null;
    }

    return DocumentFolder.findAll({
      where,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'profilePicture'] },
        { model: DocumentFolder, as: 'children', attributes: ['id', 'name', 'color'] }
      ],
      order: [['name', 'ASC']]
    });
  }

  async getFolderTree() {
    const folders = await DocumentFolder.findAll({
      include: [{ model: DocumentFolder, as: 'children', attributes: ['id', 'name', 'color', 'parentId'] }],
      order: [['name', 'ASC']]
    });

    // Build tree structure from flat list
    const folderMap = new Map<number, any>();
    const roots: any[] = [];

    // First pass: create map of all folders
    for (const folder of folders) {
      const plain = folder.toJSON();
      plain.children = [];
      folderMap.set(plain.id, plain);
    }

    // Second pass: build tree
    for (const folder of folders) {
      const plain = folderMap.get(folder.id);
      if (folder.parentId && folderMap.has(folder.parentId)) {
        folderMap.get(folder.parentId).children.push(plain);
      } else {
        roots.push(plain);
      }
    }

    return roots;
  }

  async createFolder(data: { name: string; parentId?: number; color?: string; createdBy?: number }) {
    return DocumentFolder.create(data);
  }

  async updateFolder(id: number, data: { name?: string; parentId?: number; color?: string }) {
    const folder = await DocumentFolder.findByPk(id);
    if (!folder) throw new Error('Folder not found');

    // Prevent circular reference: folder cannot be its own parent
    if (data.parentId && data.parentId === id) {
      throw new Error('A folder cannot be its own parent');
    }

    return folder.update(data);
  }

  async deleteFolder(id: number) {
    const folder = await DocumentFolder.findByPk(id);
    if (!folder) throw new Error('Folder not found');

    // Move children folders to root (parentId = null)
    await DocumentFolder.update({ parentId: null }, { where: { parentId: id } });

    // Move files in this folder to root (folderId = null)
    await DocumentFile.update({ folderId: null }, { where: { folderId: id } });

    await folder.destroy();
    return { deleted: true };
  }

  // ==================== FILES ====================

  async getFiles(query: { folderId?: number; search?: string; tags?: string; page?: number; limit?: number }) {
    const { folderId, search, tags, page = 1, limit = 50 } = query;
    const where: any = {};

    if (folderId) {
      where.folderId = folderId;
    } else if (folderId === 0 || folderId === null) {
      where.folderId = null;
    }

    if (search) {
      where[Op.or] = [{ name: { [Op.iLike]: `%${search}%` } }, { originalName: { [Op.iLike]: `%${search}%` } }];
    }

    if (tags) {
      const tagList = typeof tags === 'string' ? tags.split(',') : tags;
      where.tags = { [Op.overlap]: tagList };
    }

    const offset = (Number(page) - 1) * Number(limit);
    const { rows, count } = await DocumentFile.findAndCountAll({
      where,
      include: [
        { model: User, as: 'uploader', attributes: ['id', 'name', 'profilePicture'] },
        { model: DocumentFolder, as: 'folder', attributes: ['id', 'name', 'color'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset
    });

    return {
      docs: rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalItems: count,
        totalPages: Math.ceil(count / Number(limit))
      }
    };
  }

  async getFileById(id: number) {
    const file = await DocumentFile.findByPk(id, {
      include: [
        { model: User, as: 'uploader', attributes: ['id', 'name', 'profilePicture'] },
        { model: DocumentFolder, as: 'folder', attributes: ['id', 'name', 'color'] }
      ]
    });
    if (!file) throw new Error('File not found');
    return file;
  }

  async createFile(data: {
    name: string;
    originalName: string;
    path: string;
    mimeType?: string;
    size?: number;
    folderId?: number;
    tags?: string[];
    uploadedBy?: number;
  }) {
    return DocumentFile.create(data);
  }

  async updateFile(id: number, data: { name?: string; tags?: string[]; folderId?: number }) {
    const file = await DocumentFile.findByPk(id);
    if (!file) throw new Error('File not found');
    return file.update(data);
  }

  async deleteFile(id: number) {
    const file = await DocumentFile.findByPk(id);
    if (!file) throw new Error('File not found');
    await file.destroy();
    return { deleted: true };
  }

  async getRecentFiles(limit: number = 10) {
    return DocumentFile.findAll({
      include: [
        { model: User, as: 'uploader', attributes: ['id', 'name', 'profilePicture'] },
        { model: DocumentFolder, as: 'folder', attributes: ['id', 'name', 'color'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit)
    });
  }
}

export default new DocumentService();
