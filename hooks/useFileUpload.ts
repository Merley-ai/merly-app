'use client'

import { useState, useCallback } from 'react'
import { validateImageDimensions } from '@/lib/utils'
import { toast } from '@/lib/notifications'
import { useSupabaseUpload } from './useSupabaseUpload'
import type { UploadedFile } from '@/types'

/**
 * Hook return type
 */
interface UseFileUploadReturn {
    uploadedFiles: UploadedFile[]
    isUploading: boolean
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
    handleRemoveFile: (fileId: string) => void
    clearFiles: () => void
    getCompletedUrls: () => string[]
}

/**
 * useFileUpload Hook
 * 
 * Shared file upload logic with:
 * - Image dimension validation
 * - Supabase upload with progress tracking
 * - Error handling
 * - Multi-file support
 * 
 * @example
 * ```typescript
 * const { uploadedFiles, handleFileChange, handleRemoveFile, getCompletedUrls } = useFileUpload(user?.sub)
 * 
 * <input type="file" onChange={handleFileChange} />
 * 
 * const urls = getCompletedUrls() // Get signed URLs for API calls
 * ```
 */
export function useFileUpload(userId?: string): UseFileUploadReturn {
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const { uploadFile } = useSupabaseUpload()

    /**
     * Handle file selection and upload
     */
    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (!userId || files.length === 0) return

        setIsUploading(true)

        try {
            // Validate each image's dimensions before processing
            const validFiles: File[] = []
            for (const file of files) {
                const validation = await validateImageDimensions(file)
                if (!validation.isValid && validation.message) {
                    toast.error(validation.message, {
                        context: 'imageUpload',
                        attributes: {
                            fileName: file.name,
                            fileSize: file.size,
                            dimensions: validation.dimensions,
                            errorType: validation.error,
                        },
                    })
                } else {
                    validFiles.push(file)
                }
            }

            // Only proceed with valid files
            if (validFiles.length === 0) return

            // Create UploadedFile objects with pending state
            const newUploadedFiles: UploadedFile[] = validFiles.map(file => ({
                file,
                id: `${file.name}-${file.size}-${file.lastModified}`,
                status: 'pending' as const,
                progress: 0,
                previewUrl: URL.createObjectURL(file),
            }))

            // Add to state immediately
            setUploadedFiles(prev => [...prev, ...newUploadedFiles])

            // Upload each file to Supabase
            for (const uploadedFile of newUploadedFiles) {
                try {
                    // Update status to uploading
                    setUploadedFiles(prev =>
                        prev.map(uf =>
                            uf.id === uploadedFile.id
                                ? { ...uf, status: 'uploading' as const }
                                : uf
                        )
                    )

                    // Upload to Supabase
                    const result = await uploadFile(uploadedFile.file, userId)

                    // Update with signed URL
                    setUploadedFiles(prev =>
                        prev.map(uf =>
                            uf.id === uploadedFile.id
                                ? {
                                    ...uf,
                                    status: 'completed' as const,
                                    progress: 100,
                                    signedUrl: result.url,
                                    storagePath: result.path,
                                }
                                : uf
                        )
                    )
                } catch (error) {
                    // Update status to error
                    setUploadedFiles(prev =>
                        prev.map(uf =>
                            uf.id === uploadedFile.id
                                ? {
                                    ...uf,
                                    status: 'error' as const,
                                    error: error instanceof Error ? error.message : 'Upload failed',
                                }
                                : uf
                        )
                    )
                }
            }
        } finally {
            setIsUploading(false)
        }
    }, [userId, uploadFile])

    /**
     * Remove file from list
     */
    const handleRemoveFile = useCallback((fileId: string) => {
        setUploadedFiles(prev => {
            const fileToRemove = prev.find(f => f.id === fileId)
            // Revoke object URL to prevent memory leaks
            if (fileToRemove?.previewUrl) {
                URL.revokeObjectURL(fileToRemove.previewUrl)
            }
            return prev.filter(f => f.id !== fileId)
        })
    }, [])

    /**
     * Clear all files
     */
    const clearFiles = useCallback(() => {
        // Revoke all object URLs
        uploadedFiles.forEach(file => {
            if (file.previewUrl) {
                URL.revokeObjectURL(file.previewUrl)
            }
        })
        setUploadedFiles([])
    }, [uploadedFiles])

    /**
     * Get completed file URLs for API calls
     */
    const getCompletedUrls = useCallback((): string[] => {
        return uploadedFiles
            .filter(f => f.status === 'completed')
            .map(f => f.signedUrl)
            .filter((url): url is string => !!url)
    }, [uploadedFiles])

    return {
        uploadedFiles,
        isUploading,
        handleFileChange,
        handleRemoveFile,
        clearFiles,
        getCompletedUrls,
    }
}
