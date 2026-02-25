import { promises as fs } from 'fs';
import { join } from 'path';
import { Op } from 'sequelize';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';
import { FileModel } from './uploader.enum';
import { Uploader } from './uploader.model';

class UploaderService {
  // Allowed MIME types
  private static readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv'
  ];

  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

  public async createFile(input: any, model: FileModel): Promise<string> {
    // Validate file exists
    if (!input || !input.name) {
      throw new BaseError(ERRORS.FILE_ERROR);
    }

    // Validate file size
    if (input.size && input.size > UploaderService.MAX_FILE_SIZE) {
      throw new BaseError(ERRORS.FILE_ERROR);
    }

    // Validate MIME type
    if (input.mimetype && !UploaderService.ALLOWED_MIME_TYPES.includes(input.mimetype)) {
      throw new BaseError(ERRORS.FILE_ERROR);
    }

    // Sanitize filename: remove path traversal characters
    const sanitizedName = input.name.replace(/\.\./g, '').replace(/[^a-zA-Z0-9._-]/g, '_');

    // Generate safe file path
    const filePath = new Date().getTime().toString() + '-' + sanitizedName;
    const uploadPath = join(process.cwd(), 'public', 'uploads');
    try {
      // Ensure the upload directory exists
      await fs.mkdir(uploadPath, { recursive: true });

      // Move file to destination using a promise wrapper for async/await
      await this.moveFile(input, join(uploadPath, filePath));

      // Save the file details to the database
      await Uploader.create({
        name: input.name,
        path: filePath,
        model: model // FileModel is passed as a parameter
      });

      return filePath;
    } catch (error) {
      throw new BaseError(ERRORS.FILE_ERROR); // Handle specific file upload errors
    }
  }

  private async moveFile(input: any, destination: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      input.mv(destination, (err: any) => {
        if (err) {
          reject(new BaseError(ERRORS.FILE_ERROR));
        } else {
          resolve();
        }
      });
    });
  }

  public async setFileReferences(paths: string[]): Promise<void> {
    const files = await Uploader.findAll({
      where: {
        name: { [Op.in]: paths }
      }
    });
    if (files.length !== paths.length) throw new BaseError(ERRORS.FILE_ERROR);

    await Uploader.update(
      { hasReference: true },
      {
        where: {
          name: { [Op.in]: paths }
        }
      }
    );
  }
  public async removeFileReferences(paths: string[]): Promise<void> {
    await Uploader.update(
      { hasReference: false },
      {
        where: {
          name: { [Op.in]: paths }
        }
      }
    );
  }
}

export default new UploaderService();
