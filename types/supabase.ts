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
 * Matches the profiles table created in Phase 3
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
        }
    }
}

/**
 * Typed Supabase Client
 * Use this type when you need proper type hints for your tables
 */
export type TypedSupabaseClient = SupabaseClient<Database>

/**
 * Convenient type exports for the profiles table
 */
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

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
