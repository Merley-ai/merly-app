import { createClient } from '@supabase/supabase-js'
import { getAccessToken } from '@/lib/auth0/server'

/**
 * Server-side Supabase client
 * Uses Auth0 access token for authentication with Supabase
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
    // Supabase environment variables not configured
}

/**
 * Get a Supabase client instance for server-side operations
 * Automatically fetches the current Auth0 access token
 * 
 * @example
 * const supabase = await getSupabaseClient();
 * const { data, error } = await supabase.from('table_name').select('*');
 */
export async function getSupabaseClient() {
    const accessToken = await getAccessToken()

    return createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: {
                Authorization: accessToken ? `Bearer ${accessToken}` : '',
            },
        },
    })
}

/**
 * Execute a Supabase query with proper authentication
 * Handles token fetching and client initialization automatically
 * 
 * @example
 * const { data, error } = await executeSupabaseQuery(
 *   (supabase) => supabase.from('table_name').select('*')
 * );
 */
export async function executeSupabaseQuery<T>(
    query: (client: Awaited<ReturnType<typeof getSupabaseClient>>) => Promise<T>
): Promise<{ data: T | null; error: Error | null }> {
    try {
        const supabase = await getSupabaseClient()
        const data = await query(supabase)
        return { data, error: null }
    } catch (error) {
        return { data: null, error: error as Error }
    }
}
