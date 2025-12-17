'use client'

import { useState, useCallback } from 'react'
import { DEFAULT_PREFERENCES, type PreferencesState } from '@/components/ui/Menus/PreferencesPopover'
import { useFileUpload } from '@/hooks/files/useFileUpload'
import type { UploadedFile } from '@/types'

/**
 * Hook return type
 */
interface UseAlbumInputReturn {
    // Input state
    inputValue: string
    uploadedFiles: UploadedFile[]
    preferences: PreferencesState

    // Input actions
    setInputValue: (value: string) => void
    setPreferences: (preferences: PreferencesState) => void
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
    handleRemoveFile: (fileId: string) => void

    // Utility
    clearInput: () => void
    canSubmit: boolean
    getInputImageUrls: () => string[]
}

/**
 * useAlbumInput Hook
 * 
 * Shared input state management for album generation:
 * - Text prompt input
 * - File uploads with validation
 * - Generation preferences (count, aspect ratio, model)
 * 
 * Combines text input, file upload, and preferences into a single hook
 * to reduce duplication across components.
 * 
 * @example
 * ```typescript
 * const {
 *   inputValue,
 *   setInputValue,
 *   uploadedFiles,
 *   handleFileChange,
 *   handleRemoveFile,
 *   preferences,
 *   setPreferences,
 *   clearInput,
 *   canSubmit,
 *   getInputImageUrls
 * } = useAlbumInput(user?.sub)
 * 
 * // Check if ready to submit
 * if (canSubmit) {
 *   await generate({
 *     prompt: inputValue,
 *     inputImages: getInputImageUrls(),
 *     preferences
 *   })
 *   clearInput()
 * }
 * ```
 */
export function useAlbumInput(userId?: string): UseAlbumInputReturn {
    const [inputValue, setInputValue] = useState('')
    const [preferences, setPreferences] = useState<PreferencesState>(DEFAULT_PREFERENCES)

    const {
        uploadedFiles,
        handleFileChange,
        handleRemoveFile,
        clearFiles,
        getCompletedUrls,
    } = useFileUpload(userId)

    /**
     * Clear all input state
     */
    const clearInput = useCallback(() => {
        setInputValue('')
        clearFiles()
    }, [clearFiles])

    /**
     * Check if submission is allowed
     * - Must have prompt or files
     * - All files must be uploaded successfully
     */
    const canSubmit = useCallback((): boolean => {
        const hasPrompt = inputValue.trim().length > 0
        const hasFiles = uploadedFiles.length > 0
        const allFilesCompleted = uploadedFiles.every(f => f.status === 'completed')

        // Must have at least prompt or files
        if (!hasPrompt && !hasFiles) return false

        // If files exist, they must all be completed
        if (hasFiles && !allFilesCompleted) return false

        return true
    }, [inputValue, uploadedFiles])

    /**
     * Get input image URLs for API calls
     */
    const getInputImageUrls = useCallback((): string[] => {
        return getCompletedUrls()
    }, [getCompletedUrls])

    return {
        inputValue,
        uploadedFiles,
        preferences,
        setInputValue,
        setPreferences,
        handleFileChange,
        handleRemoveFile,
        clearInput,
        canSubmit: canSubmit(),
        getInputImageUrls,
    }
}
