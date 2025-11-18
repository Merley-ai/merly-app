'use client'

import { createClient } from '@supabase/supabase-js'
import { useUser } from '@/lib/auth0/client'
import { useState } from 'react'

/**
 * Initialize Supabase client with Auth0 authentication
 * This client uses Auth0 tokens to authenticate requests to Supabase
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
    // Supabase environment variables not configured
}

/**
 * Create a Supabase client with Auth0 token provider
 * The access token is fetched from Auth0 and used for all Supabase requests
 */
export function createSupabaseClient() {
    return createClient(supabaseUrl, supabaseAnonKey, {
        accessToken: async () => {
            try {
                const response = await fetch('/auth/access-token')
                const data = await response.json()
                return data.accessToken || null
            } catch (_error) {
                return null
            }
        },
    })
}

/**
 * Hook for using Supabase client in client components
 * Automatically handles Auth0 token refresh and provides Supabase client instance
 * 
 * @example
 * const { supabase, user, loading } = useSupabase();
 * 
 * if (loading) return <div>Loading...</div>;
 * 
 * // Use supabase client for queries
 * const { data, error } = await supabase.from('table_name').select('*');
 */
export function useSupabase() {
    const { user, isLoading } = useUser()
    const [supabase] = useState(() => createSupabaseClient())

    return {
        supabase,
        user,
        loading: isLoading,
    }
}
