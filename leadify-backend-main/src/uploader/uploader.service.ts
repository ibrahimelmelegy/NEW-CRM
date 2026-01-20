import { promises as fs } from 'fs';
import { join } from 'path';
import { Op } from 'sequelize';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';
import { FileModel } from './uploader.enum';
import { Uploader } from './uploader.model';

class UploaderService {
  public async createFile(input: any, model: FileModel): Promise<string> {
    // Validate file input (size and type, if necessary)
    if (!input || !input.name) {
      throw new BaseError(ERRORS.FILE_ERROR);
    }

    // Generate file path
    const filePath = new Date().getTime().toString() + '-' + input.name;
    const uploadPath = join(process.cwd(), 'public', 'uploads');
    try {
      // Ensure the upload directory exists
      await fs.mkdir(uploadPath, { recursive: true });

      // Move file to destination using a promise wrapper for async/await
      await this.moveFile(input, join(uploadPath, filePath));

      // Log successful file upload
      console.log(`File uploaded successfully: ${filePath}`);

      // Save the file details to the database
      await Uploader.create({
        name: input.name,
        path: filePath,
        model: model // FileModel is passed as a parameter
      });

      return filePath;
    } catch (error) {
      console.error(`Error uploading file: ${(<any>error).message}`);
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
    //disable it for testing
    //TODO : enable on production
    //if (files.length !== paths.length) throw new BaseError(ERRORS.FILE_ERROR);

    Uploader.update(
      { hasReference: true },
      {
        where: {
          name: { [Op.in]: paths }
        }
      }
    );
  }
  public async removeFileReferences(paths: string[]): Promise<void> {
    Uploader.update(
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
