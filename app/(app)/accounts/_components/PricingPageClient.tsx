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
            {/* Header */}
            <header className="flex items-center justify-between p-6 border-b border-[#6b6b6b]/30 flex-shrink-0">
                <h1
                    className="font-['Roboto:Regular',_sans-serif] text-white text-[20px] font-medium"
                    style={{ fontVariationSettings: "'wdth' 100" }}
                >
                    Manage my plan
                </h1>
            </header>

            {/* Pricing Table Content - Scrollable */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-6">
                    <StripePricingTable enableCustomerSession={true} />
                </div>
            </div>
        </main>
    );
}
