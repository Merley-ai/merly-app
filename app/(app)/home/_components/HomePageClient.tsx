"use client";

import Link from 'next/link';

/**
 * Dashboard Home Page
 * 
 * Shown when no album is selected.
 * TODO: Kuria - Currently a placeholder - design to be added later.
 */

export function HomePageClient() {
    return (
        <div className="flex-1 bg-black flex items-center justify-center">
            <div className="text-white/60 text-center">
                <p className="text-lg">Welcome to your Dashboard</p>
                <p className="text-sm mt-2">Select an album or create a new one to get started</p>

                {/* Account & Billing link */}
                <div className="mt-8">
                    <Link
                        href="/accounts"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Test Pricing Page
                    </Link>
                </div>
            </div>
        </div>
    );
}

