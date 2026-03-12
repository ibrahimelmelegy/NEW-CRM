import { promises as fs } from 'fs';
import { join } from 'path';

export interface StorageProvider {
  upload(buffer: Buffer, key: string, mimetype: string): Promise<string>;
  getUrl(key: string): string;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

// ─── Local Storage Provider (dev fallback) ────────────────────────────────────

class LocalStorageProvider implements StorageProvider {
  private uploadDir = join(process.cwd(), 'public', 'uploads');

  async upload(buffer: Buffer, key: string, _mimetype: string): Promise<string> {
    const filePath = join(this.uploadDir, key);
    const dir = filePath.substring(0, filePath.lastIndexOf('/') > -1 ? filePath.lastIndexOf('/') : filePath.lastIndexOf('\\'));
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, buffer);
    return key;
  }

  getUrl(key: string): string {
    return `/assets/${key}`;
  }

  async getSignedUrl(key: string, _expiresIn?: number): Promise<string> {
    return this.getUrl(key);
  }

  async delete(key: string): Promise<void> {
    try {
      await fs.unlink(join(this.uploadDir, key));
    } catch {
      // File may not exist
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(join(this.uploadDir, key));
      return true;
    } catch {
      return false;
    }
  }
}

// ─── DigitalOcean Spaces Provider (S3-compatible) ─────────────────────────────

class SpacesStorageProvider implements StorageProvider {
  private s3: unknown;
  private bucket: string;
  private cdnUrl: string;

  constructor() {
    this.bucket = process.env.DO_SPACES_BUCKET || 'leadify-files';
    this.cdnUrl = process.env.DO_SPACES_CDN_URL || '';

    // Lazy-load AWS SDK to avoid requiring it in dev mode
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { S3Client } = require('@aws-sdk/client-s3');
    this.s3 = new S3Client({
      endpoint: process.env.DO_SPACES_ENDPOINT || 'https://nyc3.digitaloceanspaces.com',
      region: process.env.DO_SPACES_REGION || 'nyc3',
      credentials: {
        accessKeyId: process.env.DO_SPACES_KEY || '',
        secretAccessKey: process.env.DO_SPACES_SECRET || ''
      },
      forcePathStyle: false
    });
  }

  async upload(buffer: Buffer, key: string, mimetype: string): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PutObjectCommand } = require('@aws-sdk/client-s3');
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
        ACL: 'public-read'
      })
    );
    return key;
  }

  getUrl(key: string): string {
    if (this.cdnUrl) {
      return `${this.cdnUrl}/${key}`;
    }
    const endpoint = process.env.DO_SPACES_ENDPOINT || 'https://nyc3.digitaloceanspaces.com';
    return `${endpoint}/${this.bucket}/${key}`;
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { GetObjectCommand } = require('@aws-sdk/client-s3');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
    return getSignedUrl(this.s3, new GetObjectCommand({ Bucket: this.bucket, Key: key }), { expiresIn });
  }

  async delete(key: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async exists(key: string): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { HeadObjectCommand } = require('@aws-sdk/client-s3');
    try {
      await this.s3.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return true;
    } catch {
      return false;
    }
  }
}

// ─── Singleton Export ─────────────────────────────────────────────────────────

function createProvider(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER || 'local';
  if (provider === 'spaces') {
    return new SpacesStorageProvider();
  }
  return new LocalStorageProvider();
}

const storageService: StorageProvider = createProvider();
export default storageService;
