/**
 * Google Drive Integration Connector
 *
 * Provides file upload, listing, and connection testing
 * using Google Drive REST API v3 with OAuth2 credentials.
 */

export interface GoogleDriveConfig {
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
  folderId?: string;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
}

const GOOGLE_DRIVE_API = 'https://www.googleapis.com/drive/v3';
const GOOGLE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

class GoogleDriveConnector {
  /**
   * Refresh the OAuth2 access token using the refresh token.
   */
  private async refreshAccessToken(config: GoogleDriveConfig): Promise<string> {
    if (!config.refreshToken) {
      throw new Error('No refresh token available. User must re-authorize.');
    }

    const body = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: config.refreshToken,
      grant_type: 'refresh_token'
    });

    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to refresh token: ${error}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  /**
   * Get a valid access token, refreshing if needed.
   */
  private async getAccessToken(config: GoogleDriveConfig): Promise<string> {
    if (config.accessToken) {
      return config.accessToken;
    }
    return this.refreshAccessToken(config);
  }

  /**
   * Upload a file to Google Drive.
   */
  async uploadDocument(
    file: { name: string; mimeType: string; content: Buffer },
    folderId: string | undefined,
    config: GoogleDriveConfig
  ): Promise<{ success: boolean; file?: DriveFile; message: string }> {
    try {
      const accessToken = await this.getAccessToken(config);
      const targetFolder = folderId || config.folderId;

      // Create multipart upload
      const metadata: Record<string, unknown> = {
        name: file.name,
        mimeType: file.mimeType
      };
      if (targetFolder) {
        metadata.parents = [targetFolder];
      }

      const boundary = '-------boundary' + Date.now();
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const metaPart = delimiter + 'Content-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(metadata);

      const mediaPart =
        delimiter + `Content-Type: ${file.mimeType}\r\n` + 'Content-Transfer-Encoding: base64\r\n\r\n' + file.content.toString('base64');

      const requestBody = metaPart + mediaPart + closeDelimiter;

      const response = await fetch(`${GOOGLE_UPLOAD_API}/files?uploadType=multipart`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: requestBody,
        signal: AbortSignal.timeout(30000)
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, message: `Upload failed: ${errorText}` };
      }

      const result = await response.json();
      return {
        success: true,
        file: {
          id: result.id,
          name: result.name,
          mimeType: result.mimeType,
          webViewLink: result.webViewLink
        },
        message: 'File uploaded successfully'
      };
    } catch (error: unknown) {
      return { success: false, message: error.message || 'Failed to upload file' };
    }
  }

  /**
   * List files in a Google Drive folder.
   */
  async listFiles(folderId: string | undefined, config: GoogleDriveConfig): Promise<{ success: boolean; files: DriveFile[]; message: string }> {
    try {
      const accessToken = await this.getAccessToken(config);
      const targetFolder = folderId || config.folderId || 'root';

      const query = encodeURIComponent(`'${targetFolder}' in parents and trashed = false`);
      const fields = encodeURIComponent('files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink)');

      const response = await fetch(`${GOOGLE_DRIVE_API}/files?q=${query}&fields=${fields}&pageSize=100`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, files: [], message: `List files failed: ${errorText}` };
      }

      const data = await response.json();
      return {
        success: true,
        files: data.files || [],
        message: `Found ${(data.files || []).length} files`
      };
    } catch (error: unknown) {
      return { success: false, files: [], message: error.message || 'Failed to list files' };
    }
  }

  /**
   * Test Google Drive connection by verifying OAuth credentials.
   */
  async testConnection(config: GoogleDriveConfig): Promise<{ success: boolean; message: string }> {
    if (!config.clientId || !config.clientSecret) {
      return { success: false, message: 'Client ID and Client Secret are required' };
    }

    // If we have an access or refresh token, test actual API access
    if (config.accessToken || config.refreshToken) {
      try {
        const accessToken = await this.getAccessToken(config);
        const response = await fetch(`${GOOGLE_DRIVE_API}/about?fields=user`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: AbortSignal.timeout(10000)
        });

        if (response.ok) {
          const data = await response.json();
          return { success: true, message: `Connected as ${data.user?.displayName || 'Unknown user'}` };
        }
        return { success: false, message: `Google API error: ${response.status}` };
      } catch (error: unknown) {
        return { success: false, message: error.message || 'Connection test failed' };
      }
    }

    // Without tokens, we can only validate that credentials look correct
    return {
      success: true,
      message: 'Credentials saved. OAuth authorization required to complete connection.'
    };
  }
}

export const googleDriveConnector = new GoogleDriveConnector();
export default googleDriveConnector;
