"use client";

import { StripePricingTable } from '@/components/stripe';

/**
 * Account & Billing Page Client Component
 * 
 * Displays the Stripe pricing table for subscription management.
 * Layout and sidebar are handled by DashboardLayout.
 */
export function PricingPageClient() {
    return (
        <main className="flex-1 bg-[#1a1a1a] flex flex-col overflow-hidden">
            <header className="flex items-center justify-between p-6 border-b border-[#6b6b6b]/30 flex-shrink-0">
                <h1 className="text-xl font-semibold text-white">Manage my plan</h1>
            </header>
            <div className="flex-1 overflow-y-auto flex items-center justify-center">
                <div className="w-full max-w-6xl px-6 scale-130 origin-center">
                    <StripePricingTable
                        enableCustomerSession={true}
                    />
                </div>
            </div>
        </main>
    );
}
