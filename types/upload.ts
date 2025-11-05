/**
 * Upload Types
 * 
 * Type definitions for file uploads with Supabase storage
 */

/**
 * Represents a file being uploaded with its state
 */
export interface UploadedFile {
    file: File
    id: string // Unique identifier for tracking
    status: 'pending' | 'uploading' | 'completed' | 'error'
    progress: number
    signedUrl?: string // Supabase signed URL after upload
    storagePath?: string // Path in Supabase storage
    previewUrl: string // Local blob URL for preview
    error?: string
}

