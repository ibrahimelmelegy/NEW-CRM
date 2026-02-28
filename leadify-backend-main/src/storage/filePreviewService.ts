import { promises as fs } from 'fs';
import { join, extname } from 'path';
import Attachment from '../attachments/attachmentModel';
import storageService from './storageService';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';

// ─── Supported File Types ────────────────────────────────────────────────────

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
const PDF_EXTENSIONS = ['.pdf'];
const OFFICE_EXTENSIONS = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.odt', '.ods', '.odp'];
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];

const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.odt': 'application/vnd.oasis.opendocument.text',
  '.ods': 'application/vnd.oasis.opendocument.spreadsheet',
  '.odp': 'application/vnd.oasis.opendocument.presentation',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.mkv': 'video/x-matroska'
};

type ThumbnailSize = 'small' | 'medium' | 'large';

const THUMBNAIL_DIMENSIONS: Record<ThumbnailSize, { width: number; height: number }> = {
  small: { width: 64, height: 64 },
  medium: { width: 200, height: 200 },
  large: { width: 400, height: 400 }
};

// ─── Result Types ────────────────────────────────────────────────────────────

interface PreviewResult {
  previewUrl: string;
  contentType: string;
  previewable: boolean;
}

interface ThumbnailResult {
  thumbnailUrl: string;
  width: number;
  height: number;
  contentType: string;
}

interface FileMetadata {
  id: number;
  fileName: string;
  fileSize: number | null;
  mimeType: string;
  extension: string;
  category: 'image' | 'pdf' | 'office' | 'video' | 'other';
  previewable: boolean;
  dimensions?: { width: number; height: number };
  pageCount?: number;
}

// ─── File Preview Service ────────────────────────────────────────────────────

class FilePreviewService {
  /**
   * Generate a preview URL for a file.
   * Images and PDFs get direct URLs; Office docs return metadata-only indicators;
   * Videos return poster frame URLs.
   */
  async getPreviewUrl(fileId: number): Promise<PreviewResult> {
    const attachment = await this.findAttachment(fileId);
    const ext = this.getExtension(attachment.fileName);
    const contentType = attachment.mimeType || MIME_MAP[ext] || 'application/octet-stream';

    if (IMAGE_EXTENSIONS.includes(ext) || PDF_EXTENSIONS.includes(ext)) {
      // Directly previewable: return storage URL
      const previewUrl = await this.resolveUrl(attachment.fileUrl);
      return { previewUrl, contentType, previewable: true };
    }

    if (VIDEO_EXTENSIONS.includes(ext)) {
      // Return the video URL as a preview (frontend renders <video> tag)
      const previewUrl = await this.resolveUrl(attachment.fileUrl);
      return { previewUrl, contentType, previewable: true };
    }

    if (OFFICE_EXTENSIONS.includes(ext)) {
      // Office docs are not directly previewable server-side without conversion
      // Return the download URL and flag as non-previewable
      const previewUrl = await this.resolveUrl(attachment.fileUrl);
      return { previewUrl, contentType, previewable: false };
    }

    // Unknown file type
    const previewUrl = await this.resolveUrl(attachment.fileUrl);
    return { previewUrl, contentType, previewable: false };
  }

  /**
   * Generate a thumbnail URL for image files.
   * For non-image files, returns a placeholder indicator.
   */
  async getThumbnail(fileId: number, size: ThumbnailSize = 'medium'): Promise<ThumbnailResult> {
    const attachment = await this.findAttachment(fileId);
    const ext = this.getExtension(attachment.fileName);
    const dimensions = THUMBNAIL_DIMENSIONS[size] || THUMBNAIL_DIMENSIONS.medium;

    if (!IMAGE_EXTENSIONS.includes(ext)) {
      // Non-image files: return the file URL with requested dimensions
      // Frontend can display a file-type icon at this size
      return {
        thumbnailUrl: await this.resolveUrl(attachment.fileUrl),
        width: dimensions.width,
        height: dimensions.height,
        contentType: attachment.mimeType || MIME_MAP[ext] || 'application/octet-stream'
      };
    }

    // For images, generate a thumbnail URL with size parameters
    // When using cloud storage, append query params for CDN-based resizing
    const baseUrl = await this.resolveUrl(attachment.fileUrl);
    const separator = baseUrl.includes('?') ? '&' : '?';
    const thumbnailUrl = `${baseUrl}${separator}w=${dimensions.width}&h=${dimensions.height}&fit=cover`;

    return {
      thumbnailUrl,
      width: dimensions.width,
      height: dimensions.height,
      contentType: attachment.mimeType || MIME_MAP[ext] || 'image/jpeg'
    };
  }

  /**
   * Get file metadata including type, size, category, and preview capability.
   */
  async getFileMetadata(fileId: number): Promise<FileMetadata> {
    const attachment = await this.findAttachment(fileId);
    const ext = this.getExtension(attachment.fileName);

    let category: FileMetadata['category'] = 'other';
    if (IMAGE_EXTENSIONS.includes(ext)) category = 'image';
    else if (PDF_EXTENSIONS.includes(ext)) category = 'pdf';
    else if (OFFICE_EXTENSIONS.includes(ext)) category = 'office';
    else if (VIDEO_EXTENSIONS.includes(ext)) category = 'video';

    const previewable = category === 'image' || category === 'pdf' || category === 'video';

    const metadata: FileMetadata = {
      id: attachment.id,
      fileName: attachment.fileName,
      fileSize: attachment.fileSize || null,
      mimeType: attachment.mimeType || MIME_MAP[ext] || 'application/octet-stream',
      extension: ext,
      category,
      previewable
    };

    // Attempt to read image dimensions from local file if available
    if (category === 'image') {
      try {
        const dims = await this.getImageDimensions(attachment.fileUrl);
        if (dims) metadata.dimensions = dims;
      } catch {
        // Dimensions unavailable; omit from response
      }
    }

    return metadata;
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────────

  private async findAttachment(fileId: number): Promise<Attachment> {
    const attachment = await Attachment.findByPk(fileId);
    if (!attachment) {
      throw new BaseError(ERRORS.FILE_NOT_FOUND, 404);
    }
    return attachment;
  }

  private getExtension(fileName: string): string {
    return extname(fileName).toLowerCase();
  }

  /**
   * Resolve a fileUrl to a full URL, using the storage provider if the path
   * is a relative key.
   */
  private async resolveUrl(fileUrl: string): Promise<string> {
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      return fileUrl;
    }
    // Treat as a storage key; get the URL from the storage provider
    return storageService.getUrl(fileUrl);
  }

  /**
   * Attempt to read PNG/JPEG image dimensions from the first bytes of a local file.
   * Returns null if the file is remote or dimensions cannot be determined.
   */
  private async getImageDimensions(
    fileUrl: string
  ): Promise<{ width: number; height: number } | null> {
    // Only attempt for local files
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      return null;
    }

    const filePath = fileUrl.startsWith('/assets/')
      ? join(process.cwd(), 'public', 'uploads', fileUrl.replace('/assets/', ''))
      : join(process.cwd(), 'public', 'uploads', fileUrl);

    try {
      const buffer = Buffer.alloc(30);
      const fileHandle = await fs.open(filePath, 'r');
      await fileHandle.read(buffer, 0, 30, 0);
      await fileHandle.close();

      // PNG: bytes 16-23 contain width and height as 4-byte big-endian integers
      if (buffer[0] === 0x89 && buffer[1] === 0x50) {
        const width = buffer.readUInt32BE(16);
        const height = buffer.readUInt32BE(20);
        return { width, height };
      }

      // JPEG: read SOF0 marker for dimensions (simplified; may not cover all JPEGs)
      if (buffer[0] === 0xff && buffer[1] === 0xd8) {
        // For JPEGs, full parsing requires scanning markers; return null for simplicity
        return null;
      }
    } catch {
      // File not accessible locally
    }

    return null;
  }
}

export default new FilePreviewService();
