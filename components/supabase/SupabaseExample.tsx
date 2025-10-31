'use client'

import { useSupabase } from '@/lib/supabase'
import { useState } from 'react'

/**
 * Example Component: Supabase + Auth0 Integration
 * 
 * This component demonstrates:
 * - Using the useSupabase hook
 * - Fetching data from Supabase
 * - Handling loading and authentication states
 * - Error handling for Supabase queries
 * 
 * BEFORE USING THIS COMPONENT:
 * 1. Update the table name from 'your_table' to your actual table name
 * 2. Update the select query to match your table schema
 * 3. Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 * 4. Ensure Auth0 is configured with 'role: authenticated' claim
 */

interface SupabaseExampleProps {
    className?: string
}

export function SupabaseExample({ className }: SupabaseExampleProps) {
    const { supabase, user, loading } = useSupabase()
    const [data, setData] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    async function fetchData() {
        if (!supabase) {
            setError('Supabase not initialized. Check environment variables.')
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            // TODO: Replace 'your_table' with your actual table name
            const { data: result, error: supabaseError } = await supabase
                .from('your_table') // Change this to your table name
                .select('*')
                .limit(10)

            if (supabaseError) {
                throw supabaseError
            }

            setData(result)
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error'
            setError(`Failed to fetch data: ${message}`)
            console.error('Supabase query error:', err)
        } finally {
            setIsLoading(false)
        }
    }

    async function insertData(newData: any) {
        if (!supabase) {
            setError('Supabase not initialized. Check environment variables.')
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            // TODO: Replace 'your_table' with your actual table name
            const { data: result, error: supabaseError } = await supabase
                .from('your_table') // Change this to your table name
                .insert([newData])
                .select()

            if (supabaseError) {
                throw supabaseError
            }

            setData(result)
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error'
            setError(`Failed to insert data: ${message}`)
            console.error('Supabase insert error:', err)
        } finally {
            setIsLoading(false)
        }
    }

    // Show loading state while checking authentication
    if (loading) {
        return (
            <div className={className}>
                <div className="text-gray-500">Loading authentication...</div>
            </div>
        )
    }

    // Show login prompt if not authenticated
    if (!user) {
        return (
            <div className={className}>
                <div className="text-yellow-600">
                    Please log in to access Supabase data.
                </div>
            </div>
        )
    }

    return (
        <div className={className}>
            <div className="space-y-4">
                {/* User Info */}
                <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-900">Authenticated User</h3>
                    <p className="text-sm text-blue-700">{user.email}</p>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="p-4 bg-red-50 rounded-lg">
                        <h3 className="font-semibold text-red-900">Error</h3>
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={fetchData}
                        disabled={isLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isLoading ? 'Loading...' : 'Fetch Data'}
                    </button>
                </div>

                {/* Data Display */}
                {data && (
                    <div className="p-4 bg-green-50 rounded-lg">
                        <h3 className="font-semibold text-green-900 mb-2">Results</h3>
                        <pre className="text-sm text-green-700 overflow-auto max-h-64 bg-white p-2 rounded">
                            {JSON.stringify(data, null, 2)}
                        </pre>
                    </div>
                )}

                {/* Instructions */}
                <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
                    <p className="font-semibold text-gray-700 mb-2">Setup Instructions:</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>Replace 'your_table' with your actual Supabase table name</li>
                        <li>Configure NEXT_PUBLIC_SUPABASE_URL environment variable</li>
                        <li>Configure NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable</li>
                        <li>Ensure Auth0 includes 'role: authenticated' claim</li>
                        <li>Set up Supabase Row Level Security (RLS) policies if needed</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
