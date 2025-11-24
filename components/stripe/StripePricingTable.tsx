'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useEffect, useState, useMemo } from 'react';
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
 
 * Users should be already logged in.
 * 
 * **Two-Phase Rendering Approach:**
 * - Renders pricing table immediately without customer session
 * - Silently fetches customer-session-client-secret in background
 * - When session arrives, React automatically updates the pricing table props
 * - Stripe's web component handles the update gracefully
 * 
 * Features:
 * - Instant page load - no blocking on API calls
 * - Automatic customer linking when session is ready
 * - Passes Auth0 user ID as client reference ID for reconciliation
 * - Prevents duplicate customer creation
 * - Silent error handling - continues with standard checkout if session fails
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
                    // Silent failure - continue without customer session (graceful degradation)
                    console.warn('Failed to fetch customer session:', response.statusText);
                    return;
                }

                const data = await response.json();

                if (data.clientSecret) {
                    setCustomerSessionSecret(data.clientSecret);
                }
            } catch (error) {
                // Silent failure - pricing table continues to work without customer session
                console.warn('Error fetching customer session:', error);
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
    const stripePricingTableProps = useMemo(() => {
        const props: StripePricingTableProps = {
            'pricing-table-id': tableId,
            'publishable-key': pubKey,
        };

        // Add customer session secret if available (takes precedence over email)
        // Note: Stripe doesn't allow both customer-email and customer-session-client-secret
        if (customerSessionSecret) {
            props['customer-session-client-secret'] = customerSessionSecret;
        }

        // Add client reference ID (Auth0 user ID or custom ID)
        if (clientReferenceId) {
            props['client-reference-id'] = clientReferenceId;
        }

        return props;
    }, [tableId, pubKey, customerSessionSecret, clientReferenceId]);

    return (
        <div className="w-full">
            {/* 
                Two-Phase Rendering:
                Phase 1: Render pricing table immediately (0ms) - shows pricing to all users
                Phase 2: Silently fetch and inject customer-session-client-secret (background)
            */}
            <stripe-pricing-table {...stripePricingTableProps} />
        </div>
    );
}
