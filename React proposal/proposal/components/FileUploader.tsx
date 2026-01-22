/**
 * File Uploader Component
 * Handles file uploads for proposal attachments
 */

import React, { useState, useRef, useCallback } from 'react';
import { Upload, File, X, Loader2, FileText, Image, FileSpreadsheet, Presentation, Download } from 'lucide-react';

export interface UploadedFile {
    id: string;
    name: string;
    size: number;
    type: string;
    url?: string;
    uploadProgress?: number;
    status: 'uploading' | 'complete' | 'error';
    errorMessage?: string;
}

interface FileUploaderProps {
    files: UploadedFile[];
    onChange: (files: UploadedFile[]) => void;
    onUpload?: (file: File) => Promise<{ url: string; id: string }>;
    acceptedTypes?: string[];
    maxSize?: number; // in MB
    multiple?: boolean;
    disabled?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
    files,
    onChange,
    onUpload,
    acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'],
    maxSize = 10,
    multiple = true,
    disabled = false
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getFileIcon = (type: string) => {
        if (type.startsWith('image/')) return <Image size={20} className="text-blue-500" />;
        if (type.includes('pdf')) return <FileText size={20} className="text-red-500" />;
        if (type.includes('sheet') || type.includes('excel') || type.includes('xls'))
            return <FileSpreadsheet size={20} className="text-green-500" />;
        if (type.includes('presentation') || type.includes('powerpoint') || type.includes('ppt'))
            return <Presentation size={20} className="text-orange-500" />;
        return <File size={20} className="text-gray-500" />;
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
    }, [disabled]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const processFiles = async (fileList: FileList | null) => {
        if (!fileList || disabled) return;

        const newFiles: UploadedFile[] = [];

        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];

            // Check file size
            if (file.size > maxSize * 1024 * 1024) {
                newFiles.push({
                    id: `file-${Date.now()}-${i}`,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    status: 'error',
                    errorMessage: `File too large (max ${maxSize}MB)`
                });
                continue;
            }

            // Create file entry
            const fileEntry: UploadedFile = {
                id: `file-${Date.now()}-${i}`,
                name: file.name,
                size: file.size,
                type: file.type,
                uploadProgress: 0,
                status: 'uploading'
            };
            newFiles.push(fileEntry);

            // Upload if handler provided
            if (onUpload) {
                try {
                    const result = await onUpload(file);
                    fileEntry.url = result.url;
                    fileEntry.id = result.id;
                    fileEntry.status = 'complete';
                    fileEntry.uploadProgress = 100;
                } catch (error: any) {
                    fileEntry.status = 'error';
                    fileEntry.errorMessage = error.message || 'Upload failed';
                }
            } else {
                // Simulate upload for demo
                fileEntry.status = 'complete';
                fileEntry.uploadProgress = 100;
                fileEntry.url = URL.createObjectURL(file);
            }
        }

        onChange([...files, ...newFiles]);
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        processFiles(e.dataTransfer.files);
    }, [files, disabled]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        processFiles(e.target.files);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleRemove = (id: string) => {
        onChange(files.filter(f => f.id !== id));
    };

    const handleDownload = (file: UploadedFile) => {
        if (file.url) {
            const link = document.createElement('a');
            link.href = file.url;
            link.download = file.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="space-y-4">
            {/* Label */}
            <label className="block text-sm font-semibold text-gray-700">
                Attachments
            </label>

            {/* Drop Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !disabled && fileInputRef.current?.click()}
                className={`
                    relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
                    transition-all duration-200
                    ${isDragging
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-gray-200 hover:border-violet-300 hover:bg-violet-50/50'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={acceptedTypes.join(',')}
                    multiple={multiple}
                    onChange={handleFileSelect}
                    disabled={disabled}
                    className="hidden"
                />

                <div className="flex flex-col items-center gap-3">
                    <div className={`p-4 rounded-2xl ${isDragging ? 'bg-violet-100' : 'bg-gray-100'}`}>
                        <Upload size={32} className={isDragging ? 'text-violet-600' : 'text-gray-400'} />
                    </div>
                    <div>
                        <p className="font-medium text-gray-700">
                            {isDragging ? 'Drop files here' : 'Drag & drop files here'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            or <span className="text-violet-600 font-medium">browse</span> to upload
                        </p>
                    </div>
                    <p className="text-xs text-gray-400">
                        PDF, DOC, XLS, PPT, Images up to {maxSize}MB
                    </p>
                </div>
            </div>

            {/* File List */}
            {files.length > 0 && (
                <div className="space-y-2">
                    {files.map((file) => (
                        <div
                            key={file.id}
                            className={`
                                flex items-center gap-4 p-4 rounded-xl border
                                ${file.status === 'error'
                                    ? 'border-red-200 bg-red-50'
                                    : 'border-gray-100 bg-white'
                                }
                            `}
                        >
                            {/* Icon */}
                            <div className="p-2 rounded-lg bg-gray-100">
                                {file.status === 'uploading' ? (
                                    <Loader2 size={20} className="animate-spin text-violet-500" />
                                ) : (
                                    getFileIcon(file.type)
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">{file.name}</p>
                                <p className="text-xs text-gray-500">
                                    {formatFileSize(file.size)}
                                    {file.status === 'error' && (
                                        <span className="text-red-500 ml-2">{file.errorMessage}</span>
                                    )}
                                </p>
                                {file.status === 'uploading' && file.uploadProgress !== undefined && (
                                    <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-violet-500 transition-all duration-300"
                                            style={{ width: `${file.uploadProgress}%` }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                {file.status === 'complete' && file.url && (
                                    <button
                                        onClick={() => handleDownload(file)}
                                        className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                                        title="Download"
                                    >
                                        <Download size={18} />
                                    </button>
                                )}
                                {!disabled && (
                                    <button
                                        onClick={() => handleRemove(file.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Remove"
                                    >
                                        <X size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FileUploader;
