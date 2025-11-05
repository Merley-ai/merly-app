"use client";

/**
 * Dashboard Home Page
 * 
 * Shown when no album is selected.
 * TODO: Kuria - Currently a placeholder - design to be added later.
 */

export function HomePage() {
    return (
        <div className="flex-1 bg-black flex items-center justify-center">
            <div className="text-white/60 text-center">
                <p className="text-lg">Welcome to your Dashboard</p>
                <p className="text-sm mt-2">Select an album or create a new one to get started</p>
            </div>
        </div>
    );
}

