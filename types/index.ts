// Centralized type exports

// Dashboard types
export type {
    Album,
    AlbumResponse,
    CreateAlbumRequest,
    UpdateAlbumRequest,
    DeleteAlbumRequest,
    GetAlbumRequest,
    GetAllAlbumsRequest,
} from './album';
export { transformAlbumResponse } from './album';
export type { TimelineEntry } from './timeline';
export type { GalleryImage } from './gallery';
export type { DashboardProps } from './dashboard';
export type { UploadedFile } from './upload';

// SSE types
export type {
    SseMessage,
    SseHandlers,
    SseConnectionState,
    UseServerSentEventsOptions,
    UseServerSentEventsReturn,
} from './sse';

// Image generation types
export type {
    GenerationType,
    GenerationStatus,
    GenerateImageRequest,
    EditImageRequest,
    RemixImageRequest,
    GenerationResponse,
    GeneratedImage,
    JobStatusResponse,
    JobResultsResponse,
    Generation,
    GenerationResult,
    GenerationWithResults,
    CreateGenerationRequest,
    CreateGenerationResponse,
    GetGenerationStatusResponse,
    GenerationDisplay,
    GenerationOptions,
    AnyGenerationRequest,
    TypedGenerationRequest,
} from './image-generation';

export {
    DEFAULT_GENERATION_OPTIONS,
    GENERATION_MODELS,
    ASPECT_RATIOS,
    OUTPUT_FORMATS,
    isGenerationComplete,
    isGenerationFailed,
    isGenerationActive,
    isAsyncResponse,
    isSyncResponse,
} from './image-generation';

// Supabase types
export type {
    Database,
    Profile,
    ProfileInsert,
    ProfileUpdate,
    Album as AlbumDB,
    AlbumInsert,
    AlbumUpdate,
    Generation as GenerationDB,
    GenerationInsert,
    GenerationUpdate,
    GenerationResult as GenerationResultDB,
    GenerationResultInsert,
    GenerationResultUpdate,
    GenerationWithResults as GenerationWithResultsDB,
    TypedSupabaseClient,
    SupabaseQueryResult,
    SupabasePaginatedResult,
} from './supabase';

