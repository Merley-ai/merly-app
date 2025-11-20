'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useEffect, useState } from 'react';
import type { StripePricingTableProps } from '@/types';

/**
 * Props for the StripePricingTable component
 */
interface StripePricingTableComponentProps {
    /**
     * Optional: Override the pricing table ID from environment variables
     */
    pricingTableId?: string;

    /**
     * Optional: Override the publishable key from environment variables
     */
    publishableKey?: string;

    /**
     * Optional: Additional client reference ID to pass to Stripe
     * This will be combined with the Auth0 user ID if authenticated
     */
    clientReferenceId?: string;

    /**
     * Optional: Enable customer session for authenticated users
     * When true, will fetch a customer session from your API backend
     * @default true
     */
    enableCustomerSession?: boolean;

    /**
     * Optional: Custom API endpoint for fetching customer session
     * @default '/api/stripe/customer-session'
     */
    customerSessionEndpoint?: string;
}

/**
 * Reusable Stripe Pricing Table Component
 * 
 * **IMPORTANT**: This component should only be used in authenticated contexts.
 * It is designed for use in the dashboard where users are already logged in.
 * 
 * Features:
 * - Automatically pre-fills email for authenticated users
 * - Fetches customer session to link existing Stripe customers
 * - Passes Auth0 user ID as client reference ID for reconciliation
 * - Prevents duplicate customer creation
 * - Graceful error handling if customer session fails
 * 
 * @example
 * ```tsx
 * // Basic usage (in authenticated route)
 * <StripePricingTable />
 * 
 * // With custom settings
 * <StripePricingTable 
 *   enableCustomerSession={true}
 *   clientReferenceId="campaign-123"
 * />
 * ```
 */
export function StripePricingTable({
    pricingTableId,
    publishableKey,
    clientReferenceId,
    enableCustomerSession = true,
    customerSessionEndpoint = '/api/stripe/customer-session',
}: StripePricingTableComponentProps) {
    const { user, isLoading } = useUser();
    const [customerSessionSecret, setCustomerSessionSecret] = useState<string | null>(null);
    const [sessionError, setSessionError] = useState<string | null>(null);

    // Get environment variables with fallbacks
    const tableId = pricingTableId || process.env.NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID;
    const pubKey = publishableKey || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    // Fetch customer session for authenticated users
    useEffect(() => {
        if (!enableCustomerSession || !user || isLoading) {
            return;
        }

        const fetchCustomerSession = async () => {
            try {
                const response = await fetch(customerSessionEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    // If customer session fails, continue without it (graceful degradation)
                    console.warn('Failed to fetch customer session:', response.statusText);
                    return;
                }

                const data = await response.json();

                if (data.clientSecret) {
                    setCustomerSessionSecret(data.clientSecret);
                }
            } catch (error) {
                console.error('Error fetching customer session:', error);
                setSessionError('Failed to load customer session');
            }
        };

        fetchCustomerSession();
    }, [user, isLoading, enableCustomerSession, customerSessionEndpoint]);

    // Show error if configuration is missing
    if (!tableId || !pubKey) {
        return (
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-medium">
                    Stripe pricing table configuration is missing. Please set:
                </p>
                <ul className="mt-2 text-sm text-red-700 space-y-1">
                    {!tableId && <li>• NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID</li>}
                    {!pubKey && <li>• NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</li>}
                </ul>
            </div>
        );
    }

    // Show warning if user is not authenticated (after loading)
    if (!isLoading && !user) {
        return (
            <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 font-medium">
                    Authentication required
                </p>
                <p className="mt-2 text-sm text-yellow-700">
                    This pricing table requires authentication. Please ensure this component is only used in authenticated routes.
                </p>
            </div>
        );
    }

    // Build the props for the stripe-pricing-table web component
    const stripePricingTableProps: StripePricingTableProps = {
        'pricing-table-id': tableId,
        'publishable-key': pubKey,
    };

    // Add customer email if user is authenticated
    if (user?.email) {
        stripePricingTableProps['customer-email'] = user.email;
    }

    // Add customer session secret if available
    if (customerSessionSecret) {
        stripePricingTableProps['customer-session-client-secret'] = customerSessionSecret;
    }

    // Add client reference ID (Auth0 user ID or custom ID)
    if (user?.sub || clientReferenceId) {
        const sanitizedUserId = user?.sub?.replace(/[^a-zA-Z0-9\s\-_]/g, '_') || 'anonymous';
        const referenceId = clientReferenceId
            ? `${sanitizedUserId}_${clientReferenceId}`
            : sanitizedUserId;

        if (referenceId) {
            stripePricingTableProps['client-reference-id'] = referenceId;
        }
    }

    return (
        <div className="w-full">
            {/* Show loading state while fetching customer session */}
            {enableCustomerSession && isLoading && (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    <span className="ml-3 text-gray-600">Loading pricing options...</span>
                </div>
            )}

            {/* Show session error if any (non-blocking) */}
            {sessionError && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                    <p>{sessionError}. Continuing with standard checkout flow.</p>
                </div>
            )}

            {/* Render the Stripe pricing table */}
            {!isLoading && (
                <stripe-pricing-table {...stripePricingTableProps} />
            )}
        </div>
    );
}
