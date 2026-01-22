/**
 * File Upload API
 * Handles file uploads using signed URLs - mirrors Vue/Nuxt uploadFile
 */

import apiClient, { ApiResponse } from './client';

export interface UploadLinkResponse {
    url: string;
}

export const fileApi = {
    /**
     * Generate a signed upload URL
     */
    async generateUploadLink(
        fileName: string,
        contentType: string,
        sizeInBytes: number
    ): Promise<string> {
        // Note: If backend uses GraphQL for this, we'll need to adjust
        // For now, assuming REST endpoint exists or we use the GraphQL mutation
        const response = await apiClient.post<ApiResponse<UploadLinkResponse>>('/uploader/generate-link', {
            model: 'PROPOSAL_ATTACHMENT',
            fileName,
            contentType,
            sizeInBytes,
        });

        return response.data.body?.url || '';
    },

    /**
     * Upload file to signed URL
     */
    async uploadToSignedUrl(signedUrl: string, file: File): Promise<string> {
        await fetch(signedUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type,
            },
        });

        // Extract file path from signed URL (remove query params)
        const filePath = signedUrl.split('?')[0];
        // Extract relative path based on bucket URL pattern
        const bucketUrl = import.meta.env.VITE_BUCKET_URL || 'http://localhost:5000/';
        return filePath.split(bucketUrl)[1] || filePath;
    },

    /**
     * Upload file (combines generate link + upload)
     */
    async uploadFile(file: File): Promise<string> {
        const extension = file.name.slice(file.name.lastIndexOf('.'));
        const fileName = `File-${Date.now()}${extension}`;

        const signedUrl = await this.generateUploadLink(fileName, file.type, file.size);

        if (!signedUrl) {
            throw new Error('Failed to generate upload URL');
        }

        const filePath = await this.uploadToSignedUrl(signedUrl, file);
        return filePath;
    },

    /**
     * Download file
     */
    async downloadFile(filePath: string): Promise<void> {
        const response = await apiClient.get(`/${filePath}`, {
            responseType: 'blob',
        });

        const blob = response.data as Blob;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filePath.split('/').pop() || 'file';
        a.click();
        URL.revokeObjectURL(url);
    },
};

export default fileApi;
