import type { Metadata } from 'next';
import { DashboardLayout } from '../_components/DashboardLayout';
import { HomePageClient } from './_components/HomePageClient';

export const metadata: Metadata = {
    title: 'Home - Merley Dashboard',
    description: 'Your Merley AI fashion editorial dashboard home.',
};

/**
 * Dashboard Home Page
 * 
 * Main landing page for the dashboard when no album is selected.
 * Provides navigation to albums and account management.
 * 
 * Features:
 * - Welcome screen with navigation options
 * - Link to account & billing page
 * - Protected by authentication (via app layout)
 * - Includes sidebar for album navigation
 */
export default async function HomePage() {
    return (
        <DashboardLayout currentRoute="home">
            <HomePageClient />
        </DashboardLayout>
    );
}
