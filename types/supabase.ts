/**
 * Supabase Type Definitions
 * 
 * This file contains TypeScript types for Supabase integration.
 * These types match the database schema created in Phase 3.
 * 
 * To regenerate types from your Supabase schema:
 * npx supabase gen types typescript --project-id <your-project-id> > types/database.ts
 */

import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Database schema types
 * Includes all tables: profiles, albums, generations, generation_results
 */
export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    user_id: string
                    email: string
                    full_name: string | null
                    avatar_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    email: string
                    full_name?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    email?: string
                    full_name?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            albums: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    thumbnail_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    thumbnail_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    thumbnail_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            generations: {
                Row: {
                    id: string
                    user_id: string
                    type: 'generate' | 'edit' | 'remix'
                    prompt: string
                    model: string
                    input_image_urls: string[] | null
                    aspect_ratio: string
                    num_images: number
                    output_format: string
                    job_id: string | null
                    backend_status: string | null
                    status: 'pending' | 'processing' | 'completed' | 'failed'
                    error_message: string | null
                    album_id: string | null
                    created_at: string
                    updated_at: string
                    completed_at: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    type: 'generate' | 'edit' | 'remix'
                    prompt: string
                    model?: string
                    input_image_urls?: string[] | null
                    aspect_ratio?: string
                    num_images?: number
                    output_format?: string
                    job_id?: string | null
                    backend_status?: string | null
                    status?: 'pending' | 'processing' | 'completed' | 'failed'
                    error_message?: string | null
                    album_id?: string | null
                    created_at?: string
                    updated_at?: string
                    completed_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    type?: 'generate' | 'edit' | 'remix'
                    prompt?: string
                    model?: string
                    input_image_urls?: string[] | null
                    aspect_ratio?: string
                    num_images?: number
                    output_format?: string
                    job_id?: string | null
                    backend_status?: string | null
                    status?: 'pending' | 'processing' | 'completed' | 'failed'
                    error_message?: string | null
                    album_id?: string | null
                    created_at?: string
                    updated_at?: string
                    completed_at?: string | null
                }
            }
            generation_results: {
                Row: {
                    id: string
                    generation_id: string
                    image_url: string
                    image_index: number
                    seed: number | null
                    width: number | null
                    height: number | null
                    content_type: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    generation_id: string
                    image_url: string
                    image_index: number
                    seed?: number | null
                    width?: number | null
                    height?: number | null
                    content_type?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    generation_id?: string
                    image_url?: string
                    image_index?: number
                    seed?: number | null
                    width?: number | null
                    height?: number | null
                    content_type?: string | null
                    created_at?: string
                }
            }
        }
    }
}

/**
 * Typed Supabase Client
 * Use this type when you need proper type hints for your tables
 */
export type TypedSupabaseClient = SupabaseClient<Database>

/**
 * Convenient type exports for all tables
 */

// Profile types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

// Album types
export type Album = Database['public']['Tables']['albums']['Row']
export type AlbumInsert = Database['public']['Tables']['albums']['Insert']
export type AlbumUpdate = Database['public']['Tables']['albums']['Update']

// Generation types
export type Generation = Database['public']['Tables']['generations']['Row']
export type GenerationInsert = Database['public']['Tables']['generations']['Insert']
export type GenerationUpdate = Database['public']['Tables']['generations']['Update']

// Generation result types
export type GenerationResult = Database['public']['Tables']['generation_results']['Row']
export type GenerationResultInsert = Database['public']['Tables']['generation_results']['Insert']
export type GenerationResultUpdate = Database['public']['Tables']['generation_results']['Update']

/**
 * Combined type for generation with results
 */
export type GenerationWithResults = Generation & {
    generation_results: GenerationResult[]
}

/**
 * Generic type for Supabase query results
 */
export type SupabaseQueryResult<T> = {
    data: T | null
    error: Error | null
}

/**
 * Type for paginated Supabase responses
 */
export type SupabasePaginatedResult<T> = {
    data: T[]
    error: Error | null
    count: number | null
    pageSize: number
    pageNumber: number
}

/**
 * Supabase Row type helper
 * Extract the Row type from a table definition
 * 
 * Usage: type ProfileRow = SupabaseRow<Database['public']['Tables']['profiles']>
 */
export type SupabaseRow<T> = T extends { Row: infer R } ? R : never

/**
 * Supabase Insert type helper
 * Extract the Insert type from a table definition
 */
export type SupabaseInsert<T> = T extends { Insert: infer I } ? I : never

/**
 * Supabase Update type helper
 * Extract the Update type from a table definition
 */
export type SupabaseUpdate<T> = T extends { Update: infer U } ? U : never
