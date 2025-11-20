import type { Metadata } from 'next';
import { DashboardLayout } from '../_components/DashboardLayout';
import { PricingPageClient } from './_components/PricingPageClient';

export const metadata: Metadata = {
    title: 'Account & Billing - Merley Dashboard',
    description: 'Manage your subscription and billing for Merley AI fashion editorial tools.',
};

/**
 * Dashboard Account & Billing Page
 * 
 * Displays the Stripe pricing table for subscription management.
 * This page requires authentication and is only accessible to logged-in users.
 * 
 * Features:
 * - Auto-fills email for authenticated users
 * - Links to existing Stripe customers via customer session
 * - Passes Auth0 user ID for reconciliation
 * - Protected by authentication (via app layout)
 * - Full-page responsive layout with sidebar
 */
export default async function AccountPage() {
    return (
        <DashboardLayout currentRoute="accounts">
            <PricingPageClient />
        </DashboardLayout>
    );
}
