'use client'

import { useState, useCallback } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'

/**
 * Upload state for a single file
 */
export interface FileUploadState {
    file: File
    status: 'pending' | 'uploading' | 'completed' | 'error'
    progress: number
    signedUrl?: string
    storagePath?: string
    error?: string
}

/**
 * Hook return type
 */
interface UseSupabaseUploadReturn {
    // Upload single file
    uploadFile: (file: File, userId: string) => Promise<{ url: string; path: string }>

    // Upload multiple files
    uploadFiles: (files: File[], userId: string) => Promise<Array<{ url: string; path: string }>>

    // Get signed URL for existing path
    getSignedUrl: (path: string) => Promise<string>

    // State
    uploadStates: Map<string, FileUploadState>
    isUploading: boolean
    error: string | null
}

/**
 * useSupabaseUpload Hook
 * 
 * Handles file uploads to Supabase storage bucket 'PromptRequestImages'
 * Generates signed URLs with 24-hour expiry
 * 
 * @example
 * ```typescript
 * const { uploadFile, uploadStates, isUploading } = useSupabaseUpload()
 * 
 * const result = await uploadFile(file, userId)
 * console.log('Signed URL:', result.url)
 * ```
 */
export function useSupabaseUpload(): UseSupabaseUploadReturn {
    const [uploadStates, setUploadStates] = useState<Map<string, FileUploadState>>(new Map())
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const supabase = createSupabaseClient()

    // Get bucket and folder configuration from environment
    const bucketName = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET
    const uploadsFolderName = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_UPLOADS_FOLDER

    /**
     * Generate unique file path in storage
     */
    const generateFilePath = useCallback((file: File, userId: string): string => {
        const timestamp = Date.now()
        const randomId = Math.random().toString(36).substring(7)
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        // Sanitize userId to remove invalid characters for storage paths (e.g., pipe |)
        const sanitizedUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '_')

        return `${uploadsFolderName}/${sanitizedUserId}/${timestamp}_${randomId}_${sanitizedName}`
    }, [uploadsFolderName])

    /**
     * Get signed URL for a storage path
     */
    const getSignedUrl = useCallback(async (path: string): Promise<string> => {
        try {
            const { data, error: signError } = await supabase.storage
                .from(bucketName || '')
                .createSignedUrl(path, 86400) // 24 hours in seconds

            if (signError) {
                throw new Error(`Failed to create signed URL: ${signError.message}`)
            }

            if (!data?.signedUrl) {
                throw new Error('No signed URL returned from Supabase')
            }

            return data.signedUrl
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to get signed URL'
            console.error('[useSupabaseUpload] getSignedUrl error:', errorMsg)
            throw err
        }
    }, [supabase, bucketName])

    /**
     * Upload a single file to Supabase storage
     */
    const uploadFile = useCallback(async (
        file: File,
        userId: string
    ): Promise<{ url: string; path: string }> => {
        const fileId = `${file.name}-${file.size}-${file.lastModified}`

        try {
            setIsUploading(true)
            setError(null)

            // Update state: uploading
            setUploadStates(prev => new Map(prev).set(fileId, {
                file,
                status: 'uploading',
                progress: 0,
            }))

            // Generate storage path
            const storagePath = generateFilePath(file, userId)

            // Upload file to Supabase storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from(bucketName || '')
                .upload(storagePath, file, {
                    cacheControl: '3600',
                    upsert: false,
                })

            if (uploadError) {
                throw new Error(`Upload failed: ${uploadError.message}`)
            }

            // Update progress
            setUploadStates(prev => new Map(prev).set(fileId, {
                file,
                status: 'uploading',
                progress: 50,
                storagePath,
            }))

            // Get signed URL
            const signedUrl = await getSignedUrl(storagePath)

            // Update state: completed
            setUploadStates(prev => new Map(prev).set(fileId, {
                file,
                status: 'completed',
                progress: 100,
                signedUrl,
                storagePath,
            }))

            return {
                url: signedUrl,
                path: storagePath,
            }

        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Upload failed'

            // Update state: error
            setUploadStates(prev => new Map(prev).set(fileId, {
                file,
                status: 'error',
                progress: 0,
                error: errorMsg,
            }))

            setError(errorMsg)
            console.error('[useSupabaseUpload] Upload error:', err)
            throw err

        } finally {
            setIsUploading(false)
        }
    }, [supabase, bucketName, generateFilePath, getSignedUrl])

    /**
     * Upload multiple files concurrently
     */
    const uploadFiles = useCallback(async (
        files: File[],
        userId: string
    ): Promise<Array<{ url: string; path: string }>> => {
        try {
            setIsUploading(true)
            setError(null)

            const uploadPromises = files.map(file => uploadFile(file, userId))
            const results = await Promise.all(uploadPromises)

            return results

        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Batch upload failed'
            setError(errorMsg)
            console.error('[useSupabaseUpload] Batch upload error:', err)
            throw err

        } finally {
            setIsUploading(false)
        }
    }, [uploadFile])

    return {
        uploadFile,
        uploadFiles,
        getSignedUrl,
        uploadStates,
        isUploading,
        error,
    }
}

