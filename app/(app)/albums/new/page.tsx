"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/auth0/client";
import { clientFetch } from "@/lib/api";
import { validateImageDimensions } from "@/lib/utils";
import { toast } from "@/lib/notifications";
import { transformAlbumResponse } from "@/types/album";
import type { AlbumResponse } from "@/types/album";
import type { UploadedFile } from "@/types";
import {
    type PreferencesState,
    DEFAULT_PREFERENCES,
    resolvePreferences
} from "@/components/ui/PreferencesPopover";
import { useSupabaseUpload } from "@/hooks/useSupabaseUpload";
import { useSubscriptionStatus } from "@/hooks";
import { useAlbumsContext } from "@/contexts/AlbumsContext";
import { EmptyTimeline } from "../_components/timeline/EmptyTimeline";
import { EmptyGallery } from "../_components/gallery/EmptyGallery";
import { shouldDisableSending } from "@/components/subscription/subscriptionUtils";
import { DashboardLayout } from "../../_components/DashboardLayout";

/**
 * New Album Page
 * 
 * Route: /albums/new
 * 
 * Displays the new album creation interface.
 * User enters their first prompt, which triggers:
 * 1. Album creation with AI-generated name
 * 2. Image generation
 * 3. Redirect to the new album
 */
export default function NewAlbumPage() {
    const router = useRouter();
    const { user } = useUser();
    const { subscriptionStatus } = useSubscriptionStatus();
    const { uploadFile } = useSupabaseUpload();
    const { fetchAlbums, selectAlbum } = useAlbumsContext();

    // Input state
    const [inputValue, setInputValue] = useState("");
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [preferences, setPreferences] = useState<PreferencesState>(DEFAULT_PREFERENCES);
    const [isGenerating, setIsGenerating] = useState(false);

    const disableSendEnv = process.env.NEXT_PUBLIC_SUBSCRIPTION_DISABLE_GENERATE === "true";
    const forceDisableSend = disableSendEnv && shouldDisableSending(subscriptionStatus);

    const handleRemoveFile = (fileId: string) => {
        setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!user) return;

        // Validate each image's dimensions before processing
        const validFiles: File[] = [];
        for (const file of files) {
            const validation = await validateImageDimensions(file);
            if (!validation.isValid && validation.message) {
                toast.error(validation.message, {
                    context: 'imageUpload',
                    attributes: {
                        fileName: file.name,
                        fileSize: file.size,
                        dimensions: validation.dimensions,
                        errorType: validation.error,
                    },
                });
            } else {
                validFiles.push(file);
            }
        }

        // Only proceed with valid files
        if (validFiles.length === 0) return;

        // Create UploadedFile objects with pending state
        const newUploadedFiles: UploadedFile[] = validFiles.map(file => ({
            file,
            id: `${file.name}-${file.size}-${file.lastModified}`,
            status: 'pending' as const,
            progress: 0,
            previewUrl: URL.createObjectURL(file),
        }));

        // Add to state immediately
        setUploadedFiles(prev => [...prev, ...newUploadedFiles]);

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
                );

                // Upload to Supabase
                const result = await uploadFile(uploadedFile.file, user.sub);

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
                );
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
                );
            }
        }
    };

    const handleSubmit = async () => {
        if (!inputValue.trim() && uploadedFiles.length === 0) return;

        // Only allow submission if all files are uploaded successfully
        const completedFiles = uploadedFiles.filter(f => f.status === 'completed');
        if (uploadedFiles.length > 0 && completedFiles.length !== uploadedFiles.length) {
            return;
        }

        const prompt = inputValue;
        const inputImageUrls = completedFiles
            .map(f => f.signedUrl)
            .filter((url): url is string => !!url);

        const resolvedPrefs = resolvePreferences(preferences);

        setIsGenerating(true);

        try {
            // Call generate endpoint with new_album=true to create album AND generate images
            const response = await clientFetch('/api/image-gen/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    input_images: inputImageUrls.length > 0 ? inputImageUrls : undefined,
                    num_images: resolvedPrefs.count,
                    aspect_ratio: resolvedPrefs.aspectRatio,
                    output_format: 'png',
                    model: resolvedPrefs.model,
                    new_album: true, // Flag to create new album
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create album and generate images');
            }

            const data = await response.json();

            // Extract album from response (backend returns album data when new_album=true)
            if (!data.album) {
                throw new Error('Album data missing from response');
            }

            const newAlbum = transformAlbumResponse(data.album as AlbumResponse);

            if (!newAlbum.id) {
                throw new Error('Album created but missing ID');
            }

            // Refresh albums list and select the new album
            await fetchAlbums();
            selectAlbum(newAlbum);

            toast.success('Album created! Generating images...', {
                context: 'newAlbum',
            });

            // Navigate to albums page where user can see generation progress
            router.push('/albums');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to create album', {
                context: 'newAlbum',
            });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <DashboardLayout currentRoute="albums">
            <EmptyTimeline
                albumName="New Album"
                inputValue={inputValue}
                onInputChange={setInputValue}
                uploadedFiles={uploadedFiles}
                onFileChange={handleFileChange}
                onRemoveFile={handleRemoveFile}
                onSubmit={handleSubmit}
                subscriptionStatus={subscriptionStatus}
                forceDisableSend={forceDisableSend || isGenerating}
                onPreferencesChange={setPreferences}
            />
            <EmptyGallery onFileChange={handleFileChange} />
        </DashboardLayout>
    );
}
