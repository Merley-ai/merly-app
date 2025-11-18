'use client'

import { useSupabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import type { Profile } from '@/types/supabase'

/**
 * ProfileExample Component
 * 
 * Demonstrates Auth0 + Supabase integration:
 * - Fetches user profile from Supabase via API route
 * - Creates/updates profile
 * - Shows authentication state
 * - Handles loading and error states
 * - Demonstrates RLS in action
 */

export function ProfileExample() {
    const { user, loading: authLoading } = useSupabase()
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [fullName, setFullName] = useState('')
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    // Fetch profile on mount when user is authenticated
    useEffect(() => {
        if (user) {
            fetchProfile()
        }
    }, [user])

    async function fetchProfile() {
        setLoading(true)
        setError(null)
        setSuccessMessage(null)

        try {
            const response = await fetch('/api/profile')

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to fetch profile')
            }

            const { profile: fetchedProfile } = await response.json()
            setProfile(fetchedProfile)

            if (fetchedProfile?.full_name) {
                setFullName(fetchedProfile.full_name)
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error'
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    async function saveProfile(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccessMessage(null)

        try {
            const response = await fetch('/api/profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    full_name: fullName,
                    avatar_url: user?.picture || null,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to save profile')
            }

            const { profile: savedProfile } = await response.json()
            setProfile(savedProfile)
            setSuccessMessage('Profile saved successfully! ✅')

            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(null), 3000)
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error'
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    // Loading state while checking authentication
    if (authLoading) {
        return (
            <div className="p-6 max-w-2xl mx-auto">
                <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading authentication...</span>
                </div>
            </div>
        )
    }

    // Not authenticated state
    if (!user) {
        return (
            <div className="p-6 max-w-2xl mx-auto">
                <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                        Authentication Required
                    </h3>
                    <p className="text-yellow-800 mb-4">
                        Please log in to view and edit your profile.
                    </p>
                    <a
                        href="/auth/login"
                        className="inline-block px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                        Log In
                    </a>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="border-b pb-4">
                <h2 className="text-3xl font-bold text-gray-900">User Profile</h2>
                <p className="text-gray-600 mt-1">
                    Manage your profile information stored in Supabase
                </p>
            </div>

            {/* Auth0 User Info */}
            <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-blue-900 mb-3">
                            Auth0 User Information
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex">
                                <span className="font-medium text-blue-800 w-24">Email:</span>
                                <span className="text-blue-700">{user.email}</span>
                            </div>
                            <div className="flex">
                                <span className="font-medium text-blue-800 w-24">Name:</span>
                                <span className="text-blue-700">{user.name || 'Not set'}</span>
                            </div>
                            <div className="flex">
                                <span className="font-medium text-blue-800 w-24">User ID:</span>
                                <span className="text-blue-700 font-mono text-xs">{user.sub}</span>
                            </div>
                        </div>
                    </div>
                    {user.picture && (
                        <img
                            src={user.picture}
                            alt="Profile"
                            className="w-16 h-16 rounded-full ml-4"
                        />
                    )}
                </div>
            </div>

            {/* Success Message */}
            {successMessage && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 font-medium">{successMessage}</p>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h3 className="font-semibold text-red-900 mb-1">Error</h3>
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {/* Profile Form */}
            <form onSubmit={saveProfile} className="space-y-4">
                <div className="p-6 bg-white border border-gray-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Supabase Profile Data
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                                Full Name
                            </label>
                            <input
                                type="text"
                                id="fullName"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                placeholder="Enter your full name"
                                disabled={loading}
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                This will be stored in Supabase profiles table
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? 'Saving...' : 'Save Profile'}
                            </button>

                            <button
                                type="button"
                                onClick={fetchProfile}
                                disabled={loading}
                                className="px-6 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? 'Loading...' : 'Refresh'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            {/* Supabase Profile Data Display */}
            {profile && (
                <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-green-900 mb-3">
                        Current Profile in Supabase
                    </h3>
                    <pre className="text-sm text-green-700 overflow-auto bg-white p-4 rounded border border-green-200 font-mono">
                        {JSON.stringify(profile, null, 2)}
                    </pre>
                    <p className="mt-2 text-xs text-green-600">
                        This data is protected by Row Level Security (RLS) - only you can see and modify it!
                    </p>
                </div>
            )}

            {/* No Profile State */}
            {!profile && !loading && (
                <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No Profile Found
                    </h3>
                    <p className="text-gray-600 mb-4">
                        You don&apos;t have a profile in Supabase yet. Fill in your name above and click &quot;Save Profile&quot; to create one.
                    </p>
                </div>
            )}

            {/* How It Works */}
            <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    How Auth0 + Supabase Works
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                    <li>You log in with Auth0 (handles authentication)</li>
                    <li>Auth0 creates a JWT with custom claims (role, user_id, email)</li>
                    <li>Your app sends this JWT to Supabase with each request</li>
                    <li>Supabase validates the JWT using Auth0&apos;s public key</li>
                    <li>Row Level Security (RLS) policies check the JWT claims</li>
                    <li>You can only access your own data (secured at database level!)</li>
                </ol>
            </div>
        </div>
    )
}

